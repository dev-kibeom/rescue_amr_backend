#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy
import requests
import random
from interfaces.msg import TargetPose


class AresAiDummyPublisher(Node):
    def __init__(self):
        super().__init__("ares_ai_dummy_publisher")

        # 브릿지 노드와 완벽하게 통신하기 위한 QoS 설정
        qos_profile = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            history=HistoryPolicy.KEEP_LAST,
            depth=10,
        )
        self.publisher_ = self.create_publisher(
            TargetPose, "/yolo/target_pose", qos_profile
        )
        self.timer = self.create_timer(
            2.5, self.timer_callback
        )  # 2.5초 주기로 자동 발행

        # Flask 유사도 검색 엔드포인트 주소
        self.backend_url = "http://127.0.0.1:8001/api/survivors/identify"
        self.get_logger().info(
            "🤖 [ARES AI 더미 노드] 실시간 벡터 유사도 쿼리 엔진 가동!"
        )

    def timer_callback(self):
        # 현장에서 가상으로 얼굴 임베딩 벡터(256차원)를 포착했다고 가정
        target_choice = random.choice(["이하영", "이승준"])

        if target_choice == "이하영":
            # 1번 원소 근처에 유효값 배치, 나머지는 미세한 노이즈
            mock_face_vector = [
                round(random.uniform(0.85, 0.92), 4)
                if i == 0
                else round(random.uniform(0.08, 0.12), 4)
                for i in range(256)
            ]
        else:
            # 50번 원소 근처에 유효값 배치, 나머지는 미세한 노이즈
            mock_face_vector = [
                round(random.uniform(0.85, 0.92), 4)
                if i == 49
                else round(random.uniform(0.08, 0.12), 4)
                for i in range(256)
            ]

        msg = TargetPose()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = "map"

        # 2. 백엔드 DB에 이 벡터와 제일 닮은 사람 찾아달라고 실시간 쿼리(POST 요청) 날리기
        try:
            response = requests.post(
                self.backend_url, json={"vector": mock_face_vector}, timeout=1.0
            )
            if response.status_code == 200 and response.json().get("matched"):
                matched_user = response.json()["data"]

                # DB 유사도 검색 결과를 ROS2 토픽 메시지에 이식!
                msg.class_name = matched_user["id"]  # 식별된 부모 주민번호 ID
                msg.confidence = (
                    matched_user["similarity"] / 100.0
                )  # 0.0 ~ 1.0 규격으로 조절

                self.get_logger().info(
                    f"🎯 [DB 매칭 완] {matched_user['name']} 선별됨 (유사도: {matched_user['similarity']:.2f}%)"
                )
            else:
                # 매칭 실패 시 기본값 방어 코드
                msg.class_name = "Unknown"
                msg.confidence = 0.5
                self.get_logger().warn(
                    "⚠️ [DB 매칭 실패] 일치하는 대상자가 데이터베이스에 없습니다."
                )

        except Exception as e:
            self.get_logger().error(f"❌ 백엔드 유사도 쿼리 통신 에러: {e}")
            return

        # 터틀봇 주행 가상 좌표 생성
        msg.pose.position.x = round(random.uniform(-5.0, 5.0), 2)
        msg.pose.position.y = round(random.uniform(-5.0, 5.0), 2)
        msg.pose.position.z = 0.0

        self.publisher_.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = AresAiDummyPublisher()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
