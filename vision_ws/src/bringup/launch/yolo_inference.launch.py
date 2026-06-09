import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node


def generate_launch_description():
    bringup_share_dir = get_package_share_directory("bringup")
    config_file = os.path.join(bringup_share_dir, "config", "yolo_params.yaml")

    model_name_arg = DeclareLaunchArgument(
        "model_name",
        default_value="best.pt",
        description="학습된 YOLO 모델(.pt)의 파일 이름",
    )

    model_path = PathJoinSubstitution([
        bringup_share_dir,
        "weights",  # weights 폴더
        LaunchConfiguration("model_name")  # 런치 파일 실행 시 모델 이름을 인자로 받음
    ])

    rgb_topic_arg = DeclareLaunchArgument(
        "rgb_topic", default_value="/robot1/oakd/rgb/image_raw/compressed"
    )
    depth_topic_arg = DeclareLaunchArgument(
        "depth_topic", default_value="/robot1/oakd/stereo/image_raw/compressedDepth"
    )
    camera_info_topic_arg = DeclareLaunchArgument(
        "camera_info_topic", default_value="/robot1/oakd/rgb/camera_info"
    )

    detector_type_arg = DeclareLaunchArgument(
        "detector", default_value="bbox", description="탐지 전략 (bbox, obb, seg)"
    )
    dispatcher_type_arg = DeclareLaunchArgument(
        "dispatcher",
        default_value="custom",
        description="전달 전략 (turtlebot, nav2, custom)",
    )

    namespace_arg = DeclareLaunchArgument(
        "namespace", default_value="robot1", description="로봇 고유 네임스페이스"
    )

    yolo_node = Node(
        package="yolo",
        executable="yolo_core_node",
        name="yolo_core_node",  # yaml의 루트 이름과 일치해야함!
        namespace=LaunchConfiguration("namespace"),
        output="screen",
        parameters=[
            config_file,  # YAML 파일 경로
            {
                # CLI 실행 Argument 오버라이딩
                "model_path": model_path,
                "detector_type": LaunchConfiguration("detector"),
                "dispatcher_type": LaunchConfiguration("dispatcher"),
            },
        ],
        remappings=[
            ("image_in/compressed", LaunchConfiguration("rgb_topic")),
            ("depth_in/compressed", LaunchConfiguration("depth_topic")),
            ("camera_info_in", LaunchConfiguration("camera_info_topic")),
            ("/tf", ["/", LaunchConfiguration("namespace"), "/tf"]),
            ("/tf_static", ["/", LaunchConfiguration("namespace"), "/tf_static"]),
        ],
    )

    return LaunchDescription([
        model_name_arg,
        rgb_topic_arg,
        depth_topic_arg,
        camera_info_topic_arg,
        detector_type_arg,
        dispatcher_type_arg,
        namespace_arg,
        yolo_node
    ])
