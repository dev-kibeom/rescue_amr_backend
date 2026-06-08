#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy
import requests
from geometry_msgs.msg import PoseStamped
from interfaces.msg import TargetPose

class BtDbBridge(Node):
    def __init__(self):
        super().__init__("bt_db_bridge")

        # 센서 데이터 및 가짜 토픽이 어떤 QoS로 날아오든 가리지 않고 다 받아먹는 마스터 QoS 설정
        yolo_qos = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,  # 또는 RELIABLE 둘 다 자동 매칭 호환
            history=HistoryPolicy.KEEP_LAST,
            depth=10,
        )

        self.bt_sub = self.create_subscription(
            PoseStamped, "/report/survivor_found", self.bt_report_callback, 10
        )

        # qos_profile 인자 적용
        self.yolo_sub = self.create_subscription(
            TargetPose,
            "/yolo/target_pose",
            self.yolo_detection_callback,
            qos_profile=yolo_qos,
        )

        # Flask 백엔드 서버 주소
        self.bt_flask_url = "http://127.0.0.1:8001/api/robots/robot1/nav_success"
        self.yolo_flask_url = "http://127.0.0.1:8001/api/logs"
        self.get_logger().info(
            "✅ [ARES 브릿지] BT-to-DB 미션로그 브릿지 노드가 시작되었습니다."
        )

    def bt_report_callback(self, msg: PoseStamped):
        self.get_logger().warn(
            "🚨 [BT 이벤트 발생] Behavior Tree로부터 최종 구조 임무 보고 수신!"
        )

        # 가독성을 위해 현재 좌표 추출
        x = msg.pose.position.x
        y = msg.pose.position.y

        # Flask 백엔드 규격에 맞게 데이터 조립
        data = {
            "x": x,
            "y": y,
            "message": "<span style='color:#2ecc71; font-weight:bold;'>[임무 성공]</span> BT 시퀀스 완료: 생존자 위치 확보",
        }

        self._send_to_flask(self.bt_flask_url, data, "BT 임무완료")

    def yolo_detection_callback(self, msg: TargetPose):
        """🚀 YOLO 3D 전역 좌표 탐지 신호 처리"""
        self.get_logger().warn("🚀 콜백 함수 진입 성공! 데이터 수신됨")

        x = msg.pose.position.x
        y = msg.pose.position.y
        
        # survivor_logs 테이블에 저장할 데이터 구조로 변환
        data = {
            "id": msg.class_name,  # 주민번호 또는 고유식별 번호
            "detected_x": x,
            "detected_y": y,
            "similarity": float(msg.confidence),  # 얼굴 일치도 (0.0 ~ 1.0)
            "robot_id": "robot1",
            "img_path": f"/workspace/app/static/img/captured/{msg.class_name}.jpg",  # 현장 증거 사진 가상 경로
        }

        self._send_to_flask("http://127.0.0.1:8001/api/survivor-logs", data, f"AI 대상자 식별")

    def _send_to_flask(self, url, data, label):
        """HTTP POST 요청 공통 처리 유틸리티"""
        try:
            response = requests.post(url, json=data, timeout=1.0)
            if response.status_code in [200, 201]:
                self.get_logger().info(f"🎯 Flask DB 동기화 성공 ({label})")
            else:
                self.get_logger().error(
                    f"⚠️ 백엔드 수신 거부 ({response.status_code}): {response.text}"
                )
        except Exception as e:
            self.get_logger().error(f"❌ Flask 백엔드 서버 통신 실패 ({label}): {e}")

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
