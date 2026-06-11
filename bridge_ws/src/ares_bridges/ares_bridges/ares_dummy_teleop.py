#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
import numpy as np
import math
from geometry_msgs.msg import PoseStamped
from nav_msgs.msg import OccupancyGrid, Path
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy, DurabilityPolicy


class AresDummyTeleop(Node):
    def __init__(self):
        super().__init__("ares_dummy_teleop")
        self.declare_parameter("robot_id", "robot5")
        self.robot_id = self.get_parameter("robot_id").value

        # 💡 [핵심 교정]: 브릿지 노드와 결합할 TRANSIENT_LOCAL 프로파일 명시적 정의
        map_qos = QoSProfile(
            reliability=ReliabilityPolicy.RELIABLE,
            durability=DurabilityPolicy.TRANSIENT_LOCAL,  # 👈 일시적 보존 설정으로 통일
            history=HistoryPolicy.KEEP_LAST,
            depth=1,
        )

        sensor_qos = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            durability=DurabilityPolicy.VOLATILE,
            history=HistoryPolicy.KEEP_LAST,
            depth=5,
        )

        # 💡 보정된 QoS 프로파일을 기반으로 퍼블리셔 등록
        self.map_pub = self.create_publisher(
            OccupancyGrid, f"/{self.robot_id}/map", map_qos
        )
        self.path_pub = self.create_publisher(
            Path, f"/{self.robot_id}/coverage/path", map_qos
        )
        self.cov_pub = self.create_publisher(
            OccupancyGrid, f"/{self.robot_id}/camera_coverage", sensor_qos
        )

        self.map_width = 100
        self.map_height = 100
        self.resolution = 0.2
        self.map_data = np.full((self.map_height, self.map_width), -1, dtype=np.int8)

        self.map_data[30:35, 20:70] = 100
        self.map_data[65:70, 40:90] = 100

        self.robot_x = 2.0
        self.robot_y = 2.0
        self.angle = 0.0
        self.path_msg = Path()
        self.path_msg.header.frame_id = "map"

        self.create_timer(0.3, self.update_simulation)
        self.get_logger().info(
            f"🎮 [더미노드 QoS 보정] 가동 완료 - {self.robot_id} 토픽 스트리밍 시작"
        )

    def update_simulation(self):
        self.angle += 0.05
        self.robot_x += 0.15 * math.cos(self.angle)
        self.robot_y += 0.15 * math.sin(self.angle)

        grid_x = int(self.robot_x / self.resolution)
        grid_y = int(self.robot_y / self.resolution)

        for dy in range(-6, 7):
            for dx in range(-6, 7):
                nx, ny = grid_x + dx, grid_y + dy
                if 0 <= nx < self.map_width and 0 <= ny < self.map_height:
                    if dx * dx + dy * dy <= 36 and self.map_data[ny, nx] != 100:
                        self.map_data[ny, nx] = 0

        stamp = self.get_clock().now().to_msg()

        map_msg = OccupancyGrid()
        map_msg.header.stamp = stamp
        map_msg.header.frame_id = "map"
        map_msg.info.resolution = self.resolution
        map_msg.info.width = self.map_width
        map_msg.info.height = self.map_height
        map_msg.data = self.map_data.flatten().tolist()
        self.map_pub.publish(map_msg)

        pose_stamped = PoseStamped()
        pose_stamped.header.stamp = stamp
        pose_stamped.pose.position.x = self.robot_x
        pose_stamped.pose.position.y = self.robot_y
        self.path_msg.poses.append(pose_stamped)
        self.path_pub.publish(self.path_msg)

        # 5. camera_coverage (가시 범위 음영) 실제 미터 좌표계 기반 역연산 매핑으로 보정
        cov_msg = OccupancyGrid()
        cov_msg.header.stamp = stamp
        cov_msg.header.frame_id = "map"
        cov_msg.info.resolution = self.resolution
        cov_msg.info.width = self.map_width
        cov_msg.info.height = self.map_height

        cov_data = np.zeros_like(self.map_data)
        # 로봇 현재 인덱스 기준 주변만 마킹
        for dy in range(-3, 4):
            for dx in range(-3, 4):
                nx, ny = grid_x + dx, grid_y + dy
                if 0 <= nx < self.map_width and 0 <= ny < self.map_height:
                    cov_data[ny, nx] = 100
        cov_msg.data = cov_data.flatten().tolist()
        self.cov_pub.publish(cov_msg)


def main(args=None):
    rclpy.init(args=args)
    node = AresDummyTeleop()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == "__main__":
    main()
