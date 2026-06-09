import numpy as np
from abc import ABC, abstractmethod
from geometry_msgs.msg import PointStamped


class BaseDetector(ABC):
    """ 
    모든 YOLO 탐지 전략(BBox, OBB, Seg)이 반드시 지켜야 할 기본 규격서
    """
    @abstractmethod
    def extract_3d_features(
        self,
        result,
        depth_img,
        intrinsics,
        frame_id,
        node_time,
        depth_filter_size
):
        """
        YOLO의 탐지 결과 텐서를 받아, 로봇 제어에 필요한 3D 좌표 데이터 리스트로 반환합니다.

        Args:
            result: YOLO 추론 결과 객체 (results[0])
            depth_img: 동기화된 Depth 이미지 (cv2 numpy array)
            intrinsics: CameraInfo 메시지 구조체
            frame_id: 카메라 프레임 이름
            node_time: ROS2 노드의 현재 시간

        Returns:
            list[dict]: 추출된 객체 정보 딕셔너리 리스트
                        (예: [{'class_id': 0, 'point_camera': PointStamped()}, ...])
        """
        pass

    # 뎁스 노이즈 필터링
    def _get_robust_depth(self, depth_img, u, v, depth_filter_size=3):
        """중심점 주변 커널의 유효 뎁스 중간값을 추출하여 노이즈를 방지합니다."""
        half_w = depth_filter_size // 2
        v_min, v_max = max(0, v - half_w), min(depth_img.shape[0], v + half_w + 1)
        u_min, u_max = max(0, u - half_w), min(depth_img.shape[1], u + half_w + 1)

        depth_roi = depth_img[v_min:v_max, u_min:u_max]
        valid_depths = depth_roi[depth_roi > 0]

        if len(valid_depths) > 0:
            return float(np.median(valid_depths)) / 1000.0  # mm -> m
        return float(depth_img[v, u]) / 1000.0

    # 3D 카메라 좌표 역투영
    def _deproject_pixel_to_3d(self, u, v, z, intrinsics):
        """2D 픽셀 좌표(u, v)와 뎁스(z)를 카메라 인트린식을 이용해 3D 공간 좌표로 역투영합니다."""
        fx, fy = intrinsics.k[0], intrinsics.k[4]
        px, py = intrinsics.k[2], intrinsics.k[5]

        cam_x = (u - px) * z / fx
        cam_y = (v - py) * z / fy
        return cam_x, cam_y


class BaseDispatcher(ABC):
    """
    모든 데이터 전달 및 로봇 제어 전략이 반드시 지켜야 할 기본 규격서
    """
    @abstractmethod
    def initialize(self, node, tf_buffer):
        """
        코어 노드가 시작될 때 필요한 리소스(노드, 로거, TF 등)를 전달받아 초기화합니다.
        """
        pass

    @abstractmethod
    def dispatch(self, extracted_data_list):
        """
        추출된 3D 좌표 리스트를 받아서 실제 로봇 명령을 내리거나 메시지를 발행합니다.
        """
        pass
