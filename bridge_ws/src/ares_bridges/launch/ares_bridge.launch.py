#!/usr/bin/env python3
import os
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    # 💡 1. 런치 파라미터 정의 (팀원 PC 배포 및 더미 테스트 공용)
    robot_id_arg = DeclareLaunchArgument(
        "robot_id",
        default_value="robot5",
        description="Target Robot ID (e.g., robot1, robot2, robot5)",
    )

    port_arg = DeclareLaunchArgument(
        "port", default_value="8002", description="WebRTC Bridge Server Port"
    )

    robot_id = LaunchConfiguration("robot_id")
    port = LaunchConfiguration("port")

    # 💡 2. WebRTC 다이렉트 브릿지 노드 (방금 정비한 1:1 구조)
    webrtc_bridge_node = Node(
        package="ares_bridges",
        executable="webrtc_bridge",
        name="webrtc_bridge_gateway",
        parameters=[{"robot_id": robot_id, "port": port}],
        output="screen",
    )

    # 💡 3. 로봇 상태 및 위치 중계 노드
    robot_status_bridge_node = Node(
        package="ares_bridges",
        executable="robot_status_bridge",
        name="robot_status_bridge",
        parameters=[{"robot_id": robot_id}],
        output="screen",
    )

    # 💡 4. AI 비전 데이터 바이패스 노드
    ai_vision_bridge_node = Node(
        package="ares_bridges",
        executable="ai_vision_bridge",
        name="ai_vision_bridge",
        parameters=[{"robot_id": robot_id}],
        output="screen",
    )

    return LaunchDescription(
        [
            robot_id_arg,
            port_arg,
            webrtc_bridge_node,
            robot_status_bridge_node,
            ai_vision_bridge_node,
        ]
    )
