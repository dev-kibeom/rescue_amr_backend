#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy, DurabilityPolicy
import requests
from geometry_msgs.msg import PoseStamped, PoseWithCovarianceStamped
from nav_msgs.msg import Odometry
from interfaces.msg import TargetPose

FLASK_BASE = "http://127.0.0.1:8001/api"

# 로봇 ID — ros-args로 덮어쓸 수 있음
# 예: ros2 run rescue_bt_manager bt_db_bridge --ros-args -p robot_id:=robot2
ROBOT_ID_DEFAULT = "robot1"

# TurtleBot4 위치 토픽 우선순위
#   1) /robot_pose          (turtlebot4_navigation이 퍼블리시, 가장 정확)
#   2) /amcl_pose           (Nav2 AMCL localization)
#   3) /odom                (wheel odometry, drift 있음)
POSE_TOPIC_PRIORITY = [
    ("/robot_pose",  PoseStamped,                  "pose.position"),
    ("/amcl_pose",   PoseWithCovarianceStamped,     "pose.pose.position"),
    ("/odom",        Odometry,                      "pose.pose.position"),
]

def _extract_xy(msg, path: str):
    """도트 경로로 중첩 속성 접근"""
    obj = msg
    for attr in path.split("."):
        obj = getattr(obj, attr)
    return float(obj.x), float(obj.y)


class BtDbBridge(Node):
    def __init__(self):
        super().__init__("bt_db_bridge")

        # 로봇 ID 파라미터
        self.declare_parameter("robot_id", ROBOT_ID_DEFAULT)
        self.robot_id = self.get_parameter("robot_id").get_parameter_value().string_value

        # 범용 QoS (센서/네비게이션 토픽 모두 수신)
        sensor_qos = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            durability=DurabilityPolicy.VOLATILE,
            history=HistoryPolicy.KEEP_LAST,
            depth=5,
        )

        # ── 기존 구독 ──────────────────────────────────────────────────────────
        self.bt_sub = self.create_subscription(
            PoseStamped, "/report/survivor_found", self.bt_report_callback, 10
        )
        self.yolo_sub = self.create_subscription(
            TargetPose, "/yolo/target_pose", self.yolo_detection_callback,
            qos_profile=sensor_qos,
        )

        # ── 로봇 위치 구독 (우선순위 순서대로 시도) ────────────────────────────
        self._pose_sub = None
        self._pose_active_topic = None
        self._try_pose_topics(sensor_qos)

        # ── 1초마다 상태 DB 동기화 타이머 ─────────────────────────────────────
        self._last_x: float = 0.0
        self._last_y: float = 0.0
        self._pose_received = False
        self.create_timer(1.0, self._pose_heartbeat)

        self.get_logger().info(
            f"✅ [ARES 브릿지] 시작 — robot_id={self.robot_id}"
        )

    # ── 위치 토픽 탐색 ─────────────────────────────────────────────────────────
    def _try_pose_topics(self, qos):
        """ros2 topic list에서 사용 가능한 토픽을 순서대로 시도"""
        for topic, msg_type, path in POSE_TOPIC_PRIORITY:
            try:
                self._pose_sub = self.create_subscription(
                    msg_type, topic,
                    lambda msg, p=path: self._pose_callback(msg, p),
                    qos_profile=qos,
                )
                self._pose_active_topic = topic
                self.get_logger().info(f"📍 위치 토픽 구독: {topic}")
                break
            except Exception as e:
                self.get_logger().warn(f"⚠️  {topic} 구독 실패, 다음 시도: {e}")

    def _pose_callback(self, msg, path: str):
        try:
            x, y = _extract_xy(msg, path)
            self._last_x = x
            self._last_y = y
            self._pose_received = True
        except Exception as e:
            self.get_logger().warn(f"위치 파싱 오류: {e}")

    def _pose_heartbeat(self):
        """1초마다 로봇 위치·상태를 DB에 동기화"""
        if not self._pose_received:
            return  # 아직 위치 수신 전이면 스킵

        data = {
            "x":      self._last_x,
            "y":      self._last_y,
            "status": "MOVING",   # BT가 돌고 있으면 MOVING
        }
        self._send_to_flask(
            f"{FLASK_BASE}/robots/{self.robot_id}/pose", data, "위치 동기화"
        )

    # ── 기존 콜백 ──────────────────────────────────────────────────────────────
    def bt_report_callback(self, msg: PoseStamped):
        self.get_logger().warn("🚨 [BT 이벤트] 최종 구조 임무 보고 수신")
        x = msg.pose.position.x
        y = msg.pose.position.y
        data = {
            "x": x,
            "y": y,
            "message": "<span style='color:#2ecc71; font-weight:bold;'>[임무 성공]</span> BT 시퀀스 완료: 생존자 위치 확보",
        }
        self._send_to_flask(
            f"{FLASK_BASE}/robots/{self.robot_id}/nav_success", data, "BT 임무완료"
        )

    def yolo_detection_callback(self, msg: TargetPose):
        self.get_logger().warn("🚀 YOLO 탐지 수신")
        data = {
            "id":         msg.class_name,
            "detected_x": msg.pose.position.x,
            "detected_y": msg.pose.position.y,
            "similarity": float(msg.confidence),
            "robot_id":   self.robot_id,
            "img_path":   f"/workspace/app/static/img/captured/{msg.class_name}.jpg",
        }
        self._send_to_flask(f"{FLASK_BASE}/survivor-logs", data, "AI 대상자 식별")

    # ── 공통 HTTP 유틸 ────────────────────────────────────────────────────────
    def _send_to_flask(self, url, data, label):
        try:
            res = requests.post(url, json=data, timeout=1.0)
            if res.status_code in [200, 201]:
                self.get_logger().info(f"🎯 DB 동기화 성공 ({label})")
            else:
                self.get_logger().error(f"⚠️  백엔드 거부 {res.status_code} ({label}): {res.text}")
        except Exception as e:
            self.get_logger().error(f"❌ Flask 통신 실패 ({label}): {e}")


def main(args=None):
    rclpy.init(args=args)
    node = BtDbBridge()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
