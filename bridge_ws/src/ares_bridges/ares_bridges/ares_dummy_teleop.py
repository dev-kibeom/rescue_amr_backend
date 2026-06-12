#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy, DurabilityPolicy
import sys
import random

# 💡 방금 성공적으로 빌드한 커스텀 인터페이스 및 표준 메시지 임포트
from rescue_interfaces.msg import CoverageStatus
from nav_msgs.msg import Path, OccupancyGrid
from sensor_msgs.msg import Image, BatteryState
from geometry_msgs.msg import PoseStamped
import std_msgs.msg


class AresDummyTeleop(Node):
    def __init__(self):
        super().__init__("ares_dummy_teleop")

        # 💡 CLI 인자 또는 런치 파라미터 파싱
        self.declare_parameter("robot_id", "robot5")
        self.robot_id = self.get_parameter("robot_id").value

        # 주파수 및 내구성 매칭용 QoS 설정
        sensor_qos = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            durability=DurabilityPolicy.VOLATILE,
            history=HistoryPolicy.KEEP_LAST,
            depth=5,
        )

        # 🎯 명세서 3.4절 커버리지 상태 퍼블리셔 등록
        self.status_pub = self.create_publisher(
            CoverageStatus, f"/{self.robot_id}/coverage/status", 10
        )

        # 백업용 센서 퍼블리셔들 등록 (혼선 방지용 최소화)
        self.battery_pub = self.create_publisher(
            BatteryState, f"/{self.robot_id}/battery_state", 10
        )
        self.cov_map_pub = self.create_publisher(
            OccupancyGrid, f"/{self.robot_id}/camera_coverage", sensor_qos
        )

        # 더미 시뮬레이션용 가상 상태 상태 변수
        self.total_goals = 120
        self.visited_goals = 0
        self.current_ratio = 0.0
        self.battery_level = 100.0

        # 0.5초 주기로 정밀 데이터 펌핑 실행
        self.create_timer(0.5, self.publish_dummy_data)

        self.get_logger().info(
            f"🚀 [ARES 커스텀 더미 에이전트] 가동 완료! 타겟 맵핑: {self.robot_id}"
        )

    def publish_dummy_data(self):
        # ─── 1. CoverageStatus 커스텀 규격 데이터 생성 ───
        status_msg = CoverageStatus()

        # Header 주입
        status_msg.header = std_msgs.msg.Header()
        status_msg.header.stamp = self.get_clock().now().to_msg()
        status_msg.header.frame_id = "map"

        # 단순 문자열 상태값 설정
        status_msg.mode = "AUTONOMOUS"
        status_msg.state = "EXPLORING"
        status_msg.message = "영역 개척 및 구조대상자 탐색 수행 중"

        # 💡 시연 효과를 위해 타이머 돌 때마다 탐사 배율 점진적 상승 연산
        if self.visited_goals < self.total_goals:
            self.visited_goals += random.choice([0, 1, 2])
            if self.visited_goals > self.total_goals:
                self.visited_goals = self.total_goals

        # 백분율이 아닌 0.0 ~ 1.0 규격으로 주입 (브릿지 노드에서 * 100 가공함)
        self.current_ratio = float(self.visited_goals) / float(self.total_goals)

        status_msg.total_goals = self.total_goals
        status_msg.visited_goals = self.visited_goals
        status_msg.coverage_ratio = self.current_ratio

        # 현재 목표지 가상 좌표 주입 (geometry_msgs/PoseStamped)
        goal_pose = PoseStamped()
        goal_pose.header = status_msg.header
        goal_pose.pose.position.x = 1.5 + (self.current_ratio * 5)
        goal_pose.pose.position.y = -2.3 + (self.current_ratio * 3)
        status_msg.current_goal = goal_pose

        # 🎯 최종 퍼블리시
        self.status_pub.publish(status_msg)

        # ─── 2. 배터리 및 지도 커버리지 백업 데이터 동시 펌핑 ───
        bat_msg = BatteryState()
        self.battery_level = max(15.0, self.battery_level - 0.05)
        bat_msg.percentage = self.battery_level / 100.0
        self.battery_pub.publish(bat_msg)

        # 강제 카메라 커버리지 격자 생성 (100x100)
        map_msg = OccupancyGrid()
        map_msg.header = status_msg.header
        map_msg.info.resolution = 0.05
        map_msg.info.width = 100
        map_msg.info.height = 100
        map_msg.info.origin.position.x = -2.5
        map_msg.info.origin.position.y = -2.5

        # 가상으로 탐사된 인덱스(값: 100) 무작위 채우기
        grid_data = [-1] * 10000
        fill_count = int(self.current_ratio * 3000)
        for _ in range(fill_count):
            idx = random.randint(0, 9999)
            grid_data[idx] = 100
        map_msg.data = grid_data
        self.cov_map_pub.publish(map_msg)

        # 디버깅 터미널 확인용 출력
        self.get_logger().info(
            f"📥 [더미 송신] 목표 달성: {status_msg.visited_goals}/{status_msg.total_goals} "
            f"({round(self.current_ratio * 100, 1)}%)"
        )


def main(args=None):
    rclpy.init(args=args)
    node = AresDummyTeleop()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.try_shutdown()


if __name__ == "__main__":
    main()
