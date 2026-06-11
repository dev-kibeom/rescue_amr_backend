#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy, DurabilityPolicy
import requests
import cv2
import numpy as np
import threading  # 💡 [핵심 추가] requests 블로킹을 방지하기 위한 스레드 모듈
from geometry_msgs.msg import PoseStamped
from nav_msgs.msg import OccupancyGrid, Path

FLASK_BASE = "http://localhost:8001/api"


class RobotStatusBridge(Node):
    def __init__(self):
        super().__init__("robot_status_bridge")
        self.declare_parameter("robot_id", "robot5")
        self.robot_id = self.get_parameter("robot_id").value

        # Nav2/더미노드와 완벽히 호환되는 Transient Local QoS 설정
        map_qos = QoSProfile(
            reliability=ReliabilityPolicy.RELIABLE,
            durability=DurabilityPolicy.TRANSIENT_LOCAL,
            history=HistoryPolicy.KEEP_LAST,
            depth=1,
        )

        self.map_sub = self.create_subscription(
            OccupancyGrid, f"/{self.robot_id}/map", self.map_callback, map_qos
        )
        self.path_sub = self.create_subscription(
            Path, f"/{self.robot_id}/coverage/path", self.path_callback, map_qos
        )
        self.bt_sub = self.create_subscription(
            PoseStamped,
            f"/{self.robot_id}/report/survivor_found",
            self.bt_report_callback,
            10,
        )

        self._last_x = 0.0
        self._last_y = 0.0
        self._pose_received = False

        # 1초 주기로 위치 동기화 실행
        self.create_timer(1.0, self._pose_heartbeat)
        self.get_logger().info(
            f"🚀 [ARES 멀티스레드 브릿지] 구동 시작 - ID: {self.robot_id}"
        )

    def path_callback(self, msg: Path):
        if not msg.poses:
            return
        try:
            latest_pose = msg.poses[-1].pose.position
            self._last_x = float(latest_pose.x)
            self._last_y = float(latest_pose.y)
            self._pose_received = True
        except Exception as e:
            self.get_logger().error(f"❌ 경로 좌표 추출 에러: {e}")

    def map_callback(self, msg: OccupancyGrid):
        try:
            width = msg.info.width
            height = msg.info.height
            if width == 0 or height == 0:
                return

            data = np.array(msg.data, dtype=np.int8).reshape((height, width))
            img = np.zeros((height, width), dtype=np.uint8)
            img[data == 0] = 255
            img[data == 100] = 0
            img[data == -1] = 127

            img = cv2.flip(img, 0)
            _, img_encoded = cv2.imencode(".png", img)

            # 💡 [핵심 교정]: 무거운 맵 이미지 전송 로직을 백그라운드 데몬 스레드로 격리하여 ROS2 스핀 마비 방지
            files = {
                "map_image": (
                    f"{self.robot_id}_map.png",
                    img_encoded.tobytes(),
                    "image/png",
                )
            }
            threading.Thread(
                target=self._executor_post_files,
                args=(f"{FLASK_BASE}/robots/{self.robot_id}/map", files),
                daemon=True,
            ).start()

        except Exception as e:
            self.get_logger().error(f"❌ 지도 이미지 인코딩 실패: {e}")

    def _pose_heartbeat(self):
        if not self._pose_received:
            return

        data = {"x": self._last_x, "y": self._last_y, "status": "MOVING"}
        # 💡 하트비트 전송도 비동기 스레드로 위임하여 1.0초 타이머 주기를 칼같이 사수합니다.
        threading.Thread(
            target=self._executor_post_json,
            args=(f"{FLASK_BASE}/robots/{self.robot_id}/pose", data),
            daemon=True,
        ).start()

    def bt_report_callback(self, msg: PoseStamped):
        data = {
            "x": msg.pose.position.x,
            "y": msg.pose.position.y,
            "message": "[임무 성공] 생존자 확보 완료",
        }
        threading.Thread(
            target=self._executor_post_json,
            args=(f"{FLASK_BASE}/robots/{self.robot_id}/nav_success", data),
            daemon=True,
        ).start()

    # ─── 💡 백그라운드 전용 네트워크 실행 워커(Worker) 함수 ───
    def _executor_post_files(self, url, files):
        try:
            requests.post(url, files=files, timeout=2.0)
        except Exception:
            pass

    def _executor_post_json(self, url, data):
        try:
            requests.post(url, json=data, timeout=1.5)
        except Exception:
            pass


def main(args=None):
    rclpy.init(args=args)
    node = RobotStatusBridge()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == "__main__":
    main()
