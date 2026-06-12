#!/usr/bin/env python3
import numpy as np
import asyncio, json, cv2, sys, threading
from fractions import Fraction
from collections import defaultdict
import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy, DurabilityPolicy

from nav_msgs.msg import Path, OccupancyGrid
from sensor_msgs.msg import Image, BatteryState
from cv_bridge import CvBridge
from aiohttp import web
from aiortc import MediaStreamTrack, RTCPeerConnection, RTCSessionDescription
from av import VideoFrame

# 💡 다중 로봇 상태 분리 구조 유지 (싱글 배포 시에도 안전)
latest_frames = {}
frame_locks = defaultdict(threading.Lock)
active_datachannels = defaultdict(set)
pcs = set()
main_loop = None


class RosDynamicImageTrack(MediaStreamTrack):
    kind = "video"

    def __init__(self, robot_id):
        super().__init__()
        self.robot_id = robot_id
        self._start_time = None
        self._pts = 0
        self._pts_step = max(1, int(90000 * (1.0 / 15.0)))

    async def recv(self):
        loop = asyncio.get_event_loop()
        if self._start_time is None:
            self._start_time = loop.time()
        self._pts += self._pts_step
        await asyncio.sleep(
            max(0, (self._start_time + (self._pts / 90000)) - loop.time())
        )

        with frame_locks[self.robot_id]:
            img = latest_frames.get(self.robot_id)
            if img is None:
                img = np.zeros((480, 640, 3), dtype=np.uint8)

        frame = VideoFrame.from_ndarray(
            cv2.cvtColor(img, cv2.COLOR_BGR2RGB), format="rgb24"
        )
        frame.pts, frame.time_base = self._pts, Fraction(1, 90000)
        return frame


class WebrtcBridgeGateway(Node):
    def __init__(self):
        super().__init__("webrtc_bridge_gateway")
        self.bridge = CvBridge()

        # 💡 파라미터로 자신의 로봇 ID와 포트를 유동적으로 받음
        self.declare_parameter("robot_id", "robot5")
        self.declare_parameter("port", 8002)

        self.robot_id = self.get_parameter("robot_id").value
        self.port = self.get_parameter("port").value

        # QoS 프로파일 세팅
        nav2_compatible_qos = QoSProfile(
            reliability=ReliabilityPolicy.RELIABLE,
            durability=DurabilityPolicy.TRANSIENT_LOCAL,
            history=HistoryPolicy.KEEP_LAST,
            depth=5,
        )
        sensor_qos = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            durability=DurabilityPolicy.VOLATILE,
            history=HistoryPolicy.KEEP_LAST,
            depth=5,
        )

        latest_frames[self.robot_id] = None

        # 🎯 [Import 에러 안전 가드]: 인터페이스 패키지가 아직 로드되지 않았을 때를 대비한 런타임 예외 처리
        try:
            from rescue_interfaces.msg import CoverageStatus

            # 💡 플래너 배율 감시선 연결 (인터페이스 로드 성공 시에만 구독 개통)
            self.create_subscription(
                CoverageStatus,
                f"/{self.robot_id}/coverage/status",
                self.coverage_status_callback,
                10,
            )
            self.get_logger().info(
                "✅ [인터페이스 매핑] rescue_interfaces/msg/CoverageStatus 바인딩 완료"
            )
        except ImportError as e:
            self.get_logger().error(
                f"❌ [Import 에러] rescue_interfaces를 찾을 수 없습니다! "
                f"package.xml의 <depend> 설정을 확인하세요. 에러 원인: {e}"
            )

        self.create_subscription(
            Image,
            f"/{self.robot_id}/survivor/annotated",
            self.image_callback,
            sensor_qos,
        )
        self.create_subscription(
            BatteryState, f"/{self.robot_id}/battery_state", self.battery_callback, 10
        )
        self.create_subscription(
            Path,
            f"/{self.robot_id}/coverage/path",
            self.path_callback,
            nav2_compatible_qos,
        )
        self.create_subscription(
            OccupancyGrid,
            f"/{self.robot_id}/camera_coverage",
            self.coverage_callback,
            sensor_qos,
        )

        self.get_logger().info(
            f"⚙️ [1:1 다이렉트 브릿지] 타겟 로봇 세팅 완료: {self.robot_id}"
        )

    def coverage_callback(self, msg):
        """로봇의 실시간 커버리지 격자 지도 파싱 및 웹소켓 단독 토스"""
        try:
            width, height = msg.info.width, msg.info.height
            if len(msg.data) == 0:
                return

            grid = np.array(msg.data, dtype=np.int8).reshape((height, width))
            y_indices, x_indices = np.where(grid == 100)

            coverage_points = []
            sample_rate = max(1, len(x_indices) // 300)

            for i in range(0, len(x_indices), sample_rate):
                rx = msg.info.origin.position.x + x_indices[i] * msg.info.resolution
                ry = msg.info.origin.position.y + y_indices[i] * msg.info.resolution
                coverage_points.append({"x": float(rx), "y": float(ry)})

            if not active_datachannels[self.robot_id]:
                return

            self._broadcast_json(
                self.robot_id, {"type": "camera_coverage", "points": coverage_points}
            )
        except Exception as e:
            self.get_logger().error(f"❌ 커버리지 파싱 크래시: {e}")

    def battery_callback(self, msg):
        val = (
            round(msg.percentage * 100, 1)
            if msg.percentage <= 1.0
            else round(msg.percentage, 1)
        )
        self._broadcast_json(self.robot_id, {"type": "battery", "value": val})

    def path_callback(self, msg):
        sampled_poses = msg.poses[::5]
        poses_data = [
            {"x": float(p.pose.position.x), "y": float(p.pose.position.y)}
            for p in sampled_poses
        ]
        self._broadcast_json(self.robot_id, {"type": "path", "poses": poses_data})

    def image_callback(self, msg):
        try:
            with frame_locks[self.robot_id]:
                latest_frames[self.robot_id] = self.bridge.imgmsg_to_cv2(
                    msg, desired_encoding="bgr8"
                )
        except Exception:
            pass

    def coverage_status_callback(self, msg):
        """
        명세서 3.4절 규격: 로봇 플래너가 던지는 탐사 배율 수집
        msg.coverage_ratio 형식 (0.0 ~ 1.0) -> 대시보드 전용 백분율(%)로 가공
        """
        try:
            pct_value = round(msg.coverage_ratio * 100, 1)
            self._broadcast_json(
                self.robot_id, {"type": "telemetry_update", "coverage_ratio": pct_value}
            )
        except Exception as e:
            self.get_logger().error(f"❌ 탐사 완료율 처리 오류: {e}")

    def _broadcast_json(self, robot_id: str, data: dict):
        if not active_datachannels[robot_id]:
            return
        payload = json.dumps(data)
        global main_loop
        if main_loop and not main_loop.is_closed():
            main_loop.call_soon_threadsafe(
                lambda: [
                    c.send(payload)
                    for c in list(active_datachannels[robot_id])
                    if c.readyState == "open"
                ]
            )


async def handle_offer(request):
    params = await request.json()
    target_robot_id = params.get("robot_id", "robot5")  # 프론트엔드가 요청한 ID 매핑
    pc = RTCPeerConnection()
    pcs.add(pc)
    pc.addTrack(RosDynamicImageTrack(robot_id=target_robot_id))

    @pc.on("datachannel")
    def on_datachannel(channel):
        active_datachannels[target_robot_id].add(channel)

        @channel.on("close")
        def on_close():
            active_datachannels[target_robot_id].discard(channel)

    @pc.on("connectionstatechange")
    async def on_state():
        if pc.connectionState in ("failed", "closed"):
            pcs.discard(pc)
            await pc.close()

    await pc.setRemoteDescription(
        RTCSessionDescription(sdp=params["sdp"], type=params["type"])
    )
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
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
    return web.Response(
        status=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
    )


def main():
    global main_loop
    main_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(main_loop)
    rclpy.init(args=sys.argv)
    node = WebrtcBridgeGateway()
    threading.Thread(target=rclpy.spin, args=(node,), daemon=True).start()
    app = web.Application()
    app.router.add_post("/offer", handle_offer)
    app.router.add_options("/offer", handle_options)
    try:
        web.run_app(app, host="0.0.0.0", port=node.port, print=None)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.try_shutdown()


if __name__ == "__main__":
    main()
