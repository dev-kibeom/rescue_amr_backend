import os
from glob import glob
from setuptools import find_packages, setup

package_name = "ares_bridges"

setup(
    name=package_name,
    version="0.0.0",
    packages=find_packages(exclude=["test"]),
    data_files=[
        ("share/ament_index/resource_index/packages", ["resource/" + package_name]),
        ("share/" + package_name, ["package.xml"]),
        # 🚀 런치 폴더가 정상적으로 share 폴더로 복사되도록 설정
        (os.path.join("share", package_name, "launch"), glob("launch/*.launch.py")),
    ],
    install_requires=["setuptools"],
    zip_safe=True,
    maintainer="kibeom",
    maintainer_email="neopkrrl@gmail.com",
    description="ARES Robot Backend Bridge Services",
    license="TODO: License declaration",
    tests_require=["pytest"],
    entry_points={
        "console_scripts": [
            # 💡 실행파일명 = 패키지폴더명.소스파일명:진입함수명
            "ai_vision_bridge = ares_bridges.ai_vision_bridge:main",
            "ares_dummy_teleop = ares_bridges.ares_dummy_teleop:main",
            "robot_status_bridge = ares_bridges.robot_status_bridge:main",
            "webrtc_bridge = ares_bridges.webrtc_bridge:main",
        ],
    },
)
