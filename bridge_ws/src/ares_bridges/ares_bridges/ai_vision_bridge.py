#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy
from sensor_msgs.msg import CompressedImage
import requests


class AiVisionBridge(Node):
    def __init__(self):
        super().__init__("ai_vision_bridge")
        self.declare_parameter("robot_id", "robot5")
        self.robot_id = self.get_parameter("robot_id").value

        qos_profile = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            history=HistoryPolicy.KEEP_LAST,
            depth=5,
        )

        topic_name = f"/{self.robot_id}/survivor/face_crop/compressed"
        self.create_subscription(
            CompressedImage, topic_name, self.crop_callback, qos_profile
        )

        # 💡 특징 벡터 추출 및 PostgreSQL 조회를 전담하는 도커 백엔드 API 주소로 타겟 배정
        self.flask_url = "http://127.0.0.1:8001/api/survivors/identify"
        self.get_logger().info(
            f"🧠 [AI 비전 브릿지] 가동 - 단말기 이미지 바이패스 준비 완료"
        )

    def crop_callback(self, msg: CompressedImage):
        try:
            # 💡 CompressedImage 메시지 내의 롭된 바이너리 데이터 버퍼를 그대로 획득
            image_bytes = bytes(msg.data)

            # 멀티파트 폼데이터 구조로 묶어서 도커의 buffalo 연산 라인으로 즉시 바이패스
            files = {
                "face_image": (f"{self.robot_id}_crop.jpg", image_bytes, "image/jpeg")
            }

            res = requests.post(self.flask_url, files=files, timeout=3.0)
            if res.status_code == 200:
                data = res.json()
                if data.get("matched"):
                    self.get_logger().info(
                        f"🎯 [식별 성공] {data['data']['name']} 님 포착 (유사도: {data['data']['similarity']}%)"
                    )
        except Exception as e:
            self.get_logger().error(f"비전 폼 전송 예외: {e}")


def main(args=None):
    rclpy.init(args=args)
    node = AiVisionBridge()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == "__main__":
    main()
