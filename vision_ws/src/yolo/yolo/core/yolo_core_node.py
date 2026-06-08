import cv2
import rclpy
import numpy as np
import threading
import tf2_geometry_msgs

from rclpy.node import Node
from rclpy.executors import MultiThreadedExecutor
from cv_bridge import CvBridge

# from sensor_msgs.msg import Image as ROSImage
from sensor_msgs.msg import CameraInfo, CompressedImage
from tf2_ros import Buffer, TransformListener
from message_filters import Subscriber, ApproximateTimeSynchronizer
from ultralytics import YOLO

from yolo.strategies.detectors import StandardBBoxDetector, OBBDetector, SegDetector
from yolo.strategies.dispatchers import (
    TurtlebotDispatcher,
    CustomMsgPublisher,
)


class YoloCoreNode(Node):
    def __init__(self):
        super().__init__("yolo_core_node")
        self.bridge = CvBridge()
        self.lock = threading.Lock()

        # 1. 파라미터 로드 및 전략 동적 조립
        self._init_parameters()
        self._assemble_strategies()

        # 2. 리소스 및 자원 초기화
        self.model = YOLO(self.model_path)
        self.tf_buffer = Buffer()
        self.tf_listener = TransformListener(self.tf_buffer, self)

        self.intrinsics = None
        self.rgb_image = None
        self.depth_image = None
        self.camera_frame = None

        # 중복 연산 방지 플래그
        self.image_updated = False

        self.dispatcher.initialize(self, self.tf_buffer)
        self._setup_comms()

    def _init_parameters(self):
        self.declare_parameter("model_path", "yolo_best.pt")
        self.declare_parameter("conf_threshold", 0.45)
        self.declare_parameter("detector_type", "bbox")
        self.declare_parameter("dispatcher_type", "nav2")
        self.declare_parameter("depth_filter_size", 3)

        self.model_path = (
            self.get_parameter("model_path").get_parameter_value().string_value
        )
        self.conf_threshold = (
            self.get_parameter("conf_threshold").get_parameter_value().double_value
        )
        self.det_type = (
            self.get_parameter("detector_type").get_parameter_value().string_value
        )
        self.disp_type = (
            self.get_parameter("dispatcher_type").get_parameter_value().string_value
        )
        self.depth_filter_size = (
            self.get_parameter("depth_filter_size").get_parameter_value().integer_value
        )

    def _assemble_strategies(self):
        """팩토리 패턴을 이용한 전략 인스턴스 동적 조립"""
        detector_map = {
            "bbox": StandardBBoxDetector,
            "obb": OBBDetector,
            "seg": SegDetector,
        }
        dispatcher_map = {
            "turtlebot": TurtlebotDispatcher,
            "custom": CustomMsgPublisher,
        }

        if self.det_type not in detector_map or self.disp_type not in dispatcher_map:
            self.get_logger().error(
                f"❌ 지원하지 않는 전략 타입입니다. (det: {self.det_type}, disp: {self.disp_type})"
            )
            raise ValueError("Invalid strategy type")

        self.detector = detector_map[self.det_type]()
        self.dispatcher = dispatcher_map[self.disp_type]()
        self.get_logger().info(
            f"🧩 레고 조립 완료: [{self.det_type}] Detector + [{self.disp_type}] Dispatcher"
        )

    def _setup_comms(self):
        """구독자, 퍼블리셔 및 타임 동기화 필터 설정"""
        self.rgb_pub = self.create_publisher(CompressedImage, "rgb_processed/compressed", 1)
        # self.depth_pub = self.create_publisher(ROSImage, "depth_colored", 1)

        self.create_subscription(CameraInfo, "camera_info_in", self.info_cb, 10)
        self.ts = ApproximateTimeSynchronizer(
            [
                Subscriber(self, CompressedImage, "image_in/compressed"),
                Subscriber(self, CompressedImage, "depth_in/compressed"),
            ],
            queue_size=10,
            slop=0.3,
        )
        self.ts.registerCallback(self.synced_cb)
        self.create_timer(0.2, self.process_pipeline)

    def info_cb(self, msg):
        self.intrinsics = msg

    def synced_cb(self, rgb_msg, depth_msg):
        """RGB와 Depth 이미지가 동기화되어 도착하면 Depth Filtering 작업 수행 후 내부 상태 업데이트"""
        try:
            color_img = self.bridge.compressed_imgmsg_to_cv2(rgb_msg, "bgr8")
            depth_data_clean = depth_msg.data[12:]
            depth_np_arr = np.frombuffer(depth_data_clean, dtype=np.uint8)
            depth_img = cv2.imdecode(depth_np_arr, cv2.IMREAD_UNCHANGED)
        except Exception:
            return

        with self.lock:
            self.rgb_image = color_img
            self.depth_image = depth_img
            self.camera_frame = depth_msg.header.frame_id
            self.image_updated = True

    def process_pipeline(self):
        """메인 파이프라인: 이미지가 업데이트되었을 때만 YOLO 추론 및 전략 실행"""
        with self.lock:
            if not self.image_updated:
                return
            
            if not all(
                [
                    self.rgb_image is not None,
                    self.depth_image is not None,
                    self.intrinsics,
                ]
            ):
                return
            
            rgb, depth = self.rgb_image.copy(), self.depth_image.copy()
            frame_id, intrinsics = self.camera_frame, self.intrinsics
            self.image_updated = False

        # YOLO 추론, half precision으로 속도 최적화 (GPU 사용 시)
        results = self.model(rgb, conf=self.conf_threshold, verbose=False, half=True)

        # 압축된 annotation이나 원본 image 발행
        self._publish_visualizations(rgb, results, frame_id)

        # 객체가 발견된 경우에만 하위 액션 전략 수행
        if len(results[0]) > 0:
            self._execute_action_strategy(results[0], depth, intrinsics, frame_id)

    def _publish_visualizations(self, rgb, results, frame_id):
        """탐지된 객체가 있을 때는 annotation이 포함된 이미지를, 없을 때는 원본 RGB 이미지를 압축하여 발행"""
        rgb_display = results[0].plot() if len(results[0]) > 0 else rgb.copy()

        try:
            # JPEG 포맷 압축 메시지 발행
            rgb_msg = self.bridge.cv2_to_compressed_imgmsg(
                rgb_display, dst_format="jpg"
            )
            rgb_msg.header.stamp = self.get_clock().now().to_msg()
            rgb_msg.header.frame_id = frame_id
            self.rgb_pub.publish(rgb_msg)
        except Exception as e:
            self.get_logger().error(f"❌ RGB 압축 이미지 변환 실패: {e}")

    def _execute_action_strategy(self, result, depth, intrinsics, frame_id):
        """주입된 전략 컴포넌트들을 이용하여 3D 특징 추출 및 명령 하달"""
        extracted_data_list = self.detector.extract_3d_features(
            result,
            depth,
            intrinsics,
            frame_id,
            self.get_clock().now().to_msg(),
            self.depth_filter_size,
        )

        if extracted_data_list:
            self.dispatcher.dispatch(extracted_data_list)


def main(args=None):
    rclpy.init(args=args)
    node = YoloCoreNode()
    executor = MultiThreadedExecutor()
    executor.add_node(node)
    try:
        executor.spin()
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()


if __name__ == "__main__":
    main()
