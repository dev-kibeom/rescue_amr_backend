#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy
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

        # 실습장 가상 시나리오를 위한 대상자 풀(Pool) 세팅
        self.survivor_pool = [
            {"id": "950101-1234567", "name": "김나경", "birth": 1506, "sex": "female"},
            {"id": "900505-2345678", "name": "이형원", "birth": 1443, "sex": "male"},
            {"id": "880808-1122334", "name": "황인규", "birth": 1521, "sex": "male"},
            {"id": "011010-4455667", "name": "Captain", "birth": 1600, "sex": "male"},
        ]
        self.get_logger().info(
            "🤖 [ARES AI 더미 노드] 고도화 데이터 생성기가 가동되었습니다."
        )

    def timer_callback(self):
        # 대상자 풀에서 무작위로 한 명 선택
        target = random.choice(self.survivor_pool)

        msg = TargetPose()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = "map"

        # class_name에 식별 ID를 실어 보내 브릿지가 관계형 매칭을 유도할 수 있도록 주입
        msg.class_name = target["id"]
        msg.confidence = round(
            random.uniform(0.72, 0.98), 2
        )  # 매칭 유사도(Similarity)로 활용될 값

        # 터틀봇 주행 가상 좌표 생성
        msg.pose.position.x = round(random.uniform(-5.0, 5.0), 2)
        msg.pose.position.y = round(random.uniform(-5.0, 5.0), 2)
        msg.pose.position.z = 0.0

        self.publisher_.publish(msg)
        self.get_logger().info(
            f"📤 [발행 성공] 성명: {target['name']} | ID: {msg.class_name} | "
            f"좌표: ({msg.pose.position.x}, {msg.pose.position.y}) | 유사도: {msg.confidence * 100:.1f}%"
        )


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
