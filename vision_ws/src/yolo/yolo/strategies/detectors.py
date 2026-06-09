import numpy as np
from geometry_msgs.msg import PointStamped
from .base import BaseDetector


class StandardBBoxDetector(BaseDetector):
    """일반 YOLO (BBox) 탐지 결과를 3D 좌표로 추출하는 전략"""

    def extract_3d_features(self, result, depth_img, intrinsics, frame_id, node_time, depth_filter_size):
        extracted = []

        # 탐지된 객체가 없으면 빈 리스트 반환
        if (
            not hasattr(result, "boxes")
            or result.boxes is None
            or len(result.boxes) == 0
        ):
            return extracted

        # GPU 텐서를 CPU NumPy 배열로 변환
        boxes = result.boxes.xywh.cpu().numpy()
        classes = result.boxes.cls.cpu().numpy()
        confs = result.boxes.conf.cpu().numpy()

        for idx, (cx, cy, w, h) in enumerate(boxes):
            u, v = int(cx), int(cy)

            # 이미지 경계값 예외 처리
            if v >= depth_img.shape[0] or u >= depth_img.shape[1] or v < 0 or u < 0:
                continue

            z = self._get_robust_depth(depth_img, u, v, depth_filter_size)

            # 유효 거리 필터링 (0.2m ~ 5.0m)
            if 0.2 < z < 5.0:
                cam_x, cam_y = self._deproject_pixel_to_3d(u, v, z, intrinsics)
                
                # 카메라 프레임 기준 PointStamped 생성
                pt_camera = PointStamped()
                pt_camera.header.stamp = node_time
                pt_camera.header.frame_id = frame_id
                pt_camera.point.x = cam_x
                pt_camera.point.y = cam_y
                pt_camera.point.z = z

                # 추출된 데이터를 딕셔너리 형태로 저장
                extracted.append(
                    {
                        "class_id": int(classes[idx]),
                        "confidence": float(confs[idx]),
                        "point_camera": pt_camera,
                        "bbox_center_2d": (u, v),
                    }
                )

        return extracted


class OBBDetector(BaseDetector):
    """YOLO OBB (회전 박스) 탐지 결과를 3D 좌표와 회전각(Yaw)으로 추출하는 전략"""

    def extract_3d_features(self, result, depth_img, intrinsics, frame_id, node_time, depth_filter_size):
        extracted = []

        # OBB 객체가 없으면 스킵
        if not hasattr(result, "obb") or result.obb is None or len(result.obb) == 0:
            return extracted

        # OBB는 xywhr (중심x, 중심y, 너비, 높이, 라디안 회전각) 포맷을 사용합니다.
        obbs = result.obb.xywhr.cpu().numpy()
        classes = result.obb.cls.cpu().numpy()
        confs = result.obb.conf.cpu().numpy()

        for idx, (cx, cy, w, h, r) in enumerate(obbs):
            u, v = int(cx), int(cy)

            if v >= depth_img.shape[0] or u >= depth_img.shape[1] or v < 0 or u < 0:
                continue

            z = self._get_robust_depth(depth_img, u, v, depth_filter_size)

            if 0.2 < z < 5.0:
                cam_x, cam_y = self._deproject_pixel_to_3d(u, v, z, intrinsics)

                pt_camera = PointStamped()
                pt_camera.header.stamp = node_time
                pt_camera.header.frame_id = frame_id
                pt_camera.point.x, pt_camera.point.y, pt_camera.point.z = (
                    cam_x,
                    cam_y,
                    z,
                )

                extracted.append(
                    {
                        "class_id": int(classes[idx]),
                        "confidence": float(confs[idx]),
                        "point_camera": pt_camera,
                        "bbox_center_2d": (u, v),
                        "yaw": float(r),  # 로봇 팔이나 차량이 정렬해야 할 회전각 정보
                    }
                )

        return extracted


class SegDetector(BaseDetector):
    """YOLO Segmentation (픽셀 단위 외곽선) 결과를 기반으로 정밀한 3D 좌표를 추출하는 전략"""

    def extract_3d_features(self, result, depth_img, intrinsics, frame_id, node_time, depth_filter_size):
        extracted = []

        # 마스크(Seg) 객체가 없으면 스킵
        if (
            not hasattr(result, "masks")
            or result.masks is None
            or len(result.masks) == 0
        ):
            return extracted

        boxes = result.boxes.xywh.cpu().numpy()
        classes = result.boxes.cls.cpu().numpy()
        confs = result.boxes.conf.cpu().numpy()

        # 폴리곤 외곽선 데이터 (x, y 좌표 리스트)
        polygons = result.masks.xy

        for idx, (cx, cy, w, h) in enumerate(boxes):
            u, v = int(cx), int(cy)

            if v >= depth_img.shape[0] or u >= depth_img.shape[1] or v < 0 or u < 0:
                continue

            # 💡 Seg의 장점: 3x3 네모 박스가 아니라, 실제 물체의 폴리곤 내부 픽셀들의 뎁스만 평균 낼 수도 있습니다.
            # 여기서는 성능 확보를 위해 중심점 3x3 필터를 기본 유지하되, 필요시 마스크 텐서를 활용할 수 있게 데이터를 넘깁니다.
            z = self._get_robust_depth(depth_img, u, v, depth_filter_size)

            if 0.2 < z < 5.0:
                cam_x, cam_y = self._deproject_pixel_to_3d(u, v, z, intrinsics)

                pt_camera = PointStamped()
                pt_camera.header.stamp = node_time
                pt_camera.header.frame_id = frame_id
                pt_camera.point.x = cam_x
                pt_camera.point.y = cam_y
                pt_camera.point.z = z

                extracted.append(
                    {
                        "class_id": int(classes[idx]),
                        "confidence": float(confs[idx]),
                        "point_camera": pt_camera,
                        "bbox_center_2d": (u, v),
                        "polygon": polygons[idx]
                        # 물체의 정확한 픽셀 단위 외곽선 리스트
                    }
                )

        return extracted