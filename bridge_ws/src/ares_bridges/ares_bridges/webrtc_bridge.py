#!/usr/bin/env python3
import numpy as np
import asyncio, json, cv2, sys, threading
from fractions import Fraction
import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy

from nav_msgs.msg import Path
from nav_msgs.msg import OccupancyGrid
from sensor_msgs.msg import Image, BatteryState

from cv_bridge import CvBridge
from aiohttp import web
from aiortc import MediaStreamTrack, RTCPeerConnection, RTCSessionDescription
from av import VideoFrame

latest_frame = None
frame_lock = threading.Lock()
pcs = set()
active_datachannels = set()
main_loop = None


class RosImageTrack(MediaStreamTrack):
    kind = "video"

    def __init__(self):
        super().__init__()
        self._start_time = None
        self._pts = 0
        self._pts_step = max(1, int(90000 * (1.0 / 15.0)))

    async def recv(self):
        global latest_frame
        loop = asyncio.get_event_loop()
        if self._start_time is None:
            self._start_time = loop.time()

        self._pts += self._pts_step
        await asyncio.sleep(
            max(0, (self._start_time + (self._pts / 90000)) - loop.time())
        )

        with frame_lock:
            img = (
                latest_frame
                if latest_frame is not None
                else np.zeros((480, 640, 3), dtype=np.uint8)
            )

        frame = VideoFrame.from_ndarray(
            cv2.cvtColor(img, cv2.COLOR_BGR2RGB), format="rgb24"
        )
        frame.pts, frame.time_base = self._pts, Fraction(1, 90000)
        return frame


class WebrtcBridge(Node):
    def __init__(self):
        super().__init__("webrtc_bridge")
        self.bridge = CvBridge()
        self.declare_parameter("port", 8002)
        self.declare_parameter("topic", "/robot5/survivor/annotated")
        self.declare_parameter("robot", "robot5")

        self.port = self.get_parameter("port").value
        self.topic_name = self.get_parameter("topic").value
        self.robot_id = self.get_parameter("robot").value

        qos = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            history=HistoryPolicy.KEEP_LAST,
            depth=1,
        )

        image_qos = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            history=HistoryPolicy.KEEP_LAST,
            depth=2,
        )

        self.create_subscription(Image, self.topic_name, self.image_callback, image_qos)
        self.create_subscription(
            BatteryState, f"/{self.robot_id}/battery_state", self.battery_callback, 10
        )
        self.create_subscription(
            Path, f"/{self.robot_id}/coverage/path", self.path_callback, 10
        )
        self.create_subscription(
            OccupancyGrid,
            f"/{self.robot_id}/camera_coverage",
            self.coverage_callback,
            qos,
        )

        self.get_logger().info(
            f"👀 [WebRTC 코어] 웹소켓 미들웨어 스트리밍 대기 중 (Port: {self.port})"
        )

    def coverage_callback(self, msg: OccupancyGrid):
        if not active_datachannels:
            return
        width, height, res = msg.info.width, msg.info.height, msg.info.resolution
        origin_x, origin_y = msg.info.origin.position.x, msg.info.origin.position.y
        data = np.array(msg.data, dtype=np.int8).reshape((height, width))
        y_indices, x_indices = np.where(data == 100)

        step = max(1, len(x_indices) // 200)
        sampled_x, sampled_y = x_indices[::step], y_indices[::step]
        coverage_points = [
            {"x": float(origin_x + (sx * res)), "y": float(origin_y + (sy * res))}
            for sx, sy in zip(sampled_x, sampled_y)
        ]

        self._broadcast_json({"type": "camera_coverage", "points": coverage_points})

    def battery_callback(self, msg):
        val = (
            round(msg.percentage * 100, 1)
            if msg.percentage <= 1.0
            else round(msg.percentage, 1)
        )
        self._broadcast_json({"type": "battery", "value": val})

    def path_callback(self, msg):
        sampled_poses = msg.poses[::5]
        poses_data = [
            {"x": float(p.pose.position.x), "y": float(p.pose.position.y)}
            for p in sampled_poses
        ]
        self._broadcast_json({"type": "path", "poses": poses_data})

    def image_callback(self, msg):
        global latest_frame
        try:
            with frame_lock:
                latest_frame = self.bridge.imgmsg_to_cv2(msg, desired_encoding="bgr8")
        except Exception:
            pass

    def _broadcast_json(self, data):
        if not active_datachannels:
            return
        payload = json.dumps(data)
        global main_loop
        if main_loop and not main_loop.is_closed():
            main_loop.call_soon_threadsafe(
                lambda: [
                    c.send(payload)
                    for c in list(active_datachannels)
                    if c.readyState == "open"
                ]
            )


# ─── 💡 [완벽 보정] OPTIONS 통로와 헤더 규격을 결합한 핸들러 ───
async def handle_offer(request):
    params = await request.json()
    pc = RTCPeerConnection()
    pcs.add(pc)
    pc.addTrack(RosImageTrack())

    @pc.on("datachannel")
    def on_datachannel(channel):
        active_datachannels.add(channel)

        @channel.on("close")
        def on_close():
            active_datachannels.discard(channel)

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
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
    )


async def handle_options(request):
    return web.Response(
        status=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
    )


def main():
    global main_loop
    main_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(main_loop)

    rclpy.init(args=sys.argv)
    node = WebrtcBridge()

    threading.Thread(target=rclpy.spin, args=(node,), daemon=True).start()
    app = web.Application()

    # 확실하게 비동기 세션을 뚫어주기 위해 명시적 매핑 선언
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
