#!/usr/bin/env python3
import numpy as np
import asyncio
import json
import cv2
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import CompressedImage
from cv_bridge import CvBridge

from aiohttp import web
from aiortc import MediaStreamTrack, RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaRelay
from av import VideoFrame

import threading
import argparse

# 글로벌 릴레이 및 이미지 변수 세팅 (비동기 루프와 ROS2 스핀 간 데이터 공유용)
relay = MediaRelay()
latest_frame = None
frame_lock = threading.Lock()

# argparse에서 채워지는 런타임 설정
_TOPIC    = "survivor/annotated/compressed"
_ROBOT_ID = "robot"



class RosImageTrack(MediaStreamTrack):
    """ROS2 토픽 이미지를 WebRTC 비디오 트랙으로 변환하는 클래스"""

    kind = "video"

    def __init__(self):
        super().__init__()
        self.bridge = CvBridge()

    async def recv(self):
        global latest_frame

        # WebRTC 프레임 
        await asyncio.sleep(1 / 30)

        with frame_lock:
            if latest_frame is None:
                # 대기 상태일 때 보낼 가짜 더미 검은 화면
                img = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(
                    img,
                    "ARES Video Waiting...",
                    (160, 240),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 0, 255),
                    2,
                )
            else:
                img = latest_frame

        # OpenCv BGR 이미지를 WebRTC 표준 VideoFrame(RGB)으로 변환
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        frame = VideoFrame.from_ndarray(img_rgb, format="rgb24")

        # WebRTC 타임스탬프 계산
        pts, time_base = await self._next_timestamp()
        frame.pts = pts
        frame.time_base = time_base
        return frame


class YoloWebRtcBridge(Node):
    """ROS2 이미지 토픽을 가로채서 WebRTC 통신망으로 전달하는 브릿지 노드"""

    def __init__(self):
        super().__init__("yolo_webrtc_bridge")
        self.bridge = CvBridge()

        # yolo_core_node.py가 발행하는 annotation 압축 이미지 토픽 구독
        self.subscription = self.create_subscription(
            CompressedImage, _TOPIC, self.image_callback, 10
        )
        self.get_logger().info(
            f"👀 [WebRTC 브릿지][{_ROBOT_ID}] 토픽 구독: {_TOPIC}"
        )

    def image_callback(self, msg):
        global latest_frame
        try:
            # ROS2 압축 이미지 메시지를 OpenCV 이미지(BGR)로 디코딩
            cv_image = self.bridge.compressed_imgmsg_to_cv2(
                msg, desired_encoding="bgr8"
            )
            with frame_lock:
                latest_frame = cv_image
        except Exception as e:
            self.get_logger().error(f"이미지 디코딩 실패: {e}")

pcs = set()

# =====================================================================
# WebRTC 시그널링 핸들러 (aiohttp 웹서버 엔진) - CORS 완벽 대응 버전
# =====================================================================
async def handle_offer(request):
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    pc = RTCPeerConnection()
    pcs.add(pc)
    
    # ROS2 이미지 트랙을 피어 커넥션에 주입
    video_track = RosImageTrack()
    pc.addTrack(video_track)

    # 클라이언트(대시보드)와 핸드셰이크 진행
    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    # 응답 헤더에 Access-Control-Allow-Origin 공유 정책을 명시적으로 주입합니다.
    return web.Response(
        content_type="application/json",
        text=json.dumps(
            {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
        ),
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
    )


async def handle_options(request):
    """🚨 브라우저가 본 요청(POST)을 보내기 전 안전을 확인하기 위해 쏘는 예비 요청(OPTIONS) 처리 핸들러"""
    return web.Response(
        status=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
    )


def start_ros_node():
    """ROS2 스핀을 별도 스레드에서 구동"""
    node = YoloWebRtcBridge()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


def main(args=None):
    # ros2 run은 커스텀 인자를 sys.argv에서 직접 읽어야 함
    # 사용법: ros2 run yolo yolo_webrtc_bridge --ros-args -p port:=8003 -p topic:=/robot5/survivor/annotated/compressed -p robot:=robot5
    import sys

    def get_ros_param(name, default):
        """--ros-args -p name:=value 형태에서 값 추출"""
        key = f"{name}:="
        for arg in sys.argv:
            if arg.startswith(key):
                return arg[len(key):]
        return default

    port  = int(get_ros_param("port",  "8002"))
    topic =     get_ros_param("topic", "/robot5/survivor/annotated/compressed")
    robot =     get_ros_param("robot", "robot")

    global _TOPIC, _ROBOT_ID
    _TOPIC    = topic
    _ROBOT_ID = robot

    rclpy.init(args=args)

    ros_thread = threading.Thread(target=start_ros_node, daemon=True)
    ros_thread.start()

    app = web.Application()
    app.router.add_post("/offer",    handle_offer)
    app.router.add_options("/offer", handle_options)

    print(f"🚀 [WebRTC 서버] 포트 {port} | 토픽: {_TOPIC} | 로봇: {_ROBOT_ID}")
    web.run_app(app, host="0.0.0.0", port=port)


# 터미널에서 스크립트를 직접 python3로 실행할 때를 위한 방어 코드
if __name__ == "__main__":
    main()
