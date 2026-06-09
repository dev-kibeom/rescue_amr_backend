import math
from rclpy.duration import Duration
from rclpy.action import ActionClient
from nav2_msgs.action import NavigateToPose
import tf2_geometry_msgs

from geometry_msgs.msg import PoseStamped, Quaternion
from turtlebot4_navigation.turtlebot4_navigator import (
    TurtleBot4Navigator,
    TurtleBot4Directions,
)

from interfaces.msg import TargetPose
from .base import BaseDispatcher


class TurtlebotDispatcher(BaseDispatcher):
    """추출된 3D 좌표를 기반으로 동적 상태 머신(0.7m 정지/재추적)을 구동하여 터틀봇을 제어하는 전략"""

    def __init__(self, global_frame="map"):
        self.global_frame = global_frame
        self.node = None
        self.tf_buffer = None
        self.navigator = None

        self.stop_distance = 0.7  # 🛑 정지 안전 거리
        self.last_goal_x = 0.0
        self.last_goal_y = 0.0
        self.is_moving = False
        self.target_reached = False  # 동적 추적 락 플래그
        self.last_object_x = 0.0  # 락 시점 물체 X
        self.last_object_y = 0.0  # 락 시점 물체 Y

    def initialize(self, node, tf_buffer):
        self.node = node
        self.tf_buffer = tf_buffer

        self.node.get_logger().info("🐢 TurtleBot4 네비게이터 스택을 초기화합니다...")
        self.navigator = TurtleBot4Navigator()

        # 실습장 환경에 따라 도킹 해제 등이 필요 없다면 주석 유지
        # if not self.navigator.getDockedStatus():
        #     self.navigator.dock()
        # initial_pose = self.navigator.getPoseStamped(
        #     [0.0, 0.0], TurtleBot4Directions.NORTH
        # )
        # self.navigator.setInitialPose(initial_pose)
        # self.navigator.waitUntilNav2Active()
        # self.navigator.undock()
        self.node.get_logger().info("✅ TurtleBot4 주행 준비 완료!")

    def dispatch(self, extracted_data_list):
        """가장 신뢰도가 높은 첫 번째 객체를 타겟으로 주행"""
        if not extracted_data_list:
            return

        target_data = extracted_data_list[0]
        pt_camera = target_data["point_camera"]
        z = pt_camera.point.z
        
        try:
            # 실시간 타겟 전역 Map 좌표 변환
            pt_map = self.tf_buffer.transform(
                pt_camera, self.global_frame, timeout=Duration(seconds=1.0)
            )

            # 극단적 센서 노이즈(Blind spot) 방어
            if z <= 0.05:
                if self.is_moving:
                    self.node.get_logger().warn(
                        "⚠️ [BLIND SPOT] 센서 측정 불가 영역 진입. 강제 정지합니다."
                    )
                    self.navigator.cancelTask()
                    self.is_moving = False
                    self.target_reached = True
                return

            # [상태 A] 타겟이 정지 거리(0.7m) 안으로 들어왔을 때    
            if z <= self.stop_distance:
                self.last_object_x = pt_map.point.x
                self.last_object_y = pt_map.point.y

                if self.is_moving:
                    self.node.get_logger().info(
                        f"🛑 [도달] 타겟 {z:.2f}m 진입. cancelTask() 제동 후 전역 위치를 락(LOCK)합니다."
                    )
                    self.navigator.cancelTask()
                    self.is_moving = False
                    self.target_reached = True

            # [상태 B] 타겟이 정지 거리 바깥에 있을 때
            else:
                # 락 상태일 때 사물이 실제로 맵 상에서 이동했는지 판별
                if self.target_reached:
                    object_moved = math.sqrt(
                        (pt_map.point.x - self.last_object_x) ** 2
                        + (pt_map.point.y - self.last_object_y) ** 2
                    )

                    # 사물이 원래 서있던 자리에서 15cm 이상 변동되면 봉인 해제 및 재추적
                    if object_moved > 0.15:
                        self.node.get_logger().info(
                            f"🔄 [움직임 감지] 타겟이 {object_moved:.2f}m 이동함. 추적 락 해제 및 재추격!"
                        )
                        self.target_reached = False
                        self.last_goal_x = 0.0
                        self.last_goal_y = 0.0

                # 락이 풀린 상태에서만 도배 방지 필터를 거쳐 새로운 목적지 하달
                if not self.target_reached:
                    displacement = math.sqrt(
                        (pt_map.point.x - self.last_goal_x) ** 2
                        + (pt_map.point.y - self.last_goal_y) ** 2
                    )

                    if displacement > 0.1:
                        self.node.get_logger().info(
                            f"🎯 [FRAMEWORK TARGET] 목적지 주입: X={pt_map.point.x:.2f}, Y={pt_map.point.y:.2f}"
                        )

                        goal_pose = PoseStamped()
                        goal_pose.header.frame_id = self.global_frame
                        goal_pose.header.stamp = self.node.get_clock().now().to_msg()
                        goal_pose.pose.position.x = pt_map.point.x
                        goal_pose.pose.position.y = pt_map.point.y
                        goal_pose.pose.position.z = 0.0
                        goal_pose.pose.orientation = Quaternion(
                            x=0.0, y=0.0, z=0.0, w=1.0
                        )

                        self.navigator.goToPose(goal_pose)
                        self.last_goal_x = pt_map.point.x
                        self.last_goal_y = pt_map.point.y
                        self.is_moving = True

        except Exception as tf_err:
            self.node.get_logger().warn(f"⚠️ TF 좌표 변환 실패: {tf_err}")


class CustomMsgPublisher(BaseDispatcher):
    """추출된 3D 좌표와 객체 정보를 커스텀 메시지(TargetPose)로 발행하는 전략"""

    def __init__(self, global_frame="map", topic_name="/yolo/target_pose"):
        self.global_frame = global_frame
        self.topic_name = topic_name
        self.pub = None
        self.node = None  
        self.tf_buffer = None

    def initialize(self, node, tf_buffer):
        # super().initialize(node, tf_buffer)
        self.node = node
        self.tf_buffer = tf_buffer

        self.pub = self.node.create_publisher(TargetPose, self.topic_name, 10)
        self.node.get_logger().info(
            f"📢 커스텀 메시지 발행 부품 준비 완료: {self.topic_name}"
        )

    def dispatch(self, extracted_data_list):
        if not extracted_data_list:
            return

        # 가장 신뢰도가 높은 첫 번째 객체(대장 객체)의 데이터 추출
        target_data = extracted_data_list[0]
        pt_camera = target_data["point_camera"]

        try:
            # 로봇 팔이나 제어기가 쓰기 편하도록 글로벌 프레임(예: map 또는 base_link)으로 변환
            pt_map = self.tf_buffer.transform(
                pt_camera, self.global_frame, timeout=Duration(seconds=1.0)
            )

            # 커스텀 메시지 조립
            msg = TargetPose()
            msg.header.stamp = self.node.get_clock().now().to_msg()
            msg.header.frame_id = self.global_frame

            msg.class_name = str(target_data.get("class_id", "unknown"))
            msg.confidence = target_data.get("confidence", 0.0)

            msg.pose.position.x = pt_map.point.x
            msg.pose.position.y = pt_map.point.y
            msg.pose.position.z = pt_map.point.z

            # OBB 모델일 경우 yaw 값을 받아와 로봇 팔의 그리퍼 정렬 각도로 사용
            yaw = target_data.get("yaw", 0.0)
            msg.pose.orientation.x = 0.0
            msg.pose.orientation.y = 0.0
            msg.pose.orientation.z = math.sin(yaw / 2.0)
            msg.pose.orientation.w = math.cos(yaw / 2.0)

            self.pub.publish(msg)
            # 디버깅용 로그 (필요시 주석 해제)
            # self.node.get_logger().info(f"📤 [TargetPose] {msg.class_name} ({msg.confidence:.2f}) 발행 완료!")

        except Exception as tf_err:
            self.node.get_logger().warn(
                f"⚠️ TF 좌표 변환 실패 (커스텀 메시지): {tf_err}"
            )