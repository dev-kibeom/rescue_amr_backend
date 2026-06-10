cmake_minimum_required(VERSION 3.8)
project(rescue_bt_manager)

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# find dependencies
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(behaviortree_cpp_v3 REQUIRED)
find_package(interfaces REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(nav2_msgs REQUIRED)

include_directories(
  include
)

# C++ Executable 추가
add_executable(rescue_bt_node src/rescue_bt_node.cpp)
ament_target_dependencies(rescue_bt_node
  rclcpp
  behaviortree_cpp_v3
  geometry_msgs
  interfaces
)

# ==========================================
# 2. 설치 및 배포 설정 (Python 브릿지 포함)
# ==========================================
# 파이썬 브릿지 스크립트 설치 경로 지정 (ros2 run 가능하게 세팅)
install(PROGRAMS
  src/bt_db_bridge.py
  DESTINATION lib/${PROJECT_NAME}
)

install(TARGETS
  rescue_bt_node
  DESTINATION lib/${PROJECT_NAME}
)

install(DIRECTORY config
  DESTINATION share/${PROJECT_NAME}
)

if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  # the following line skips the linter which checks for copyrights
  # comment the line when a copyright and license is added to all source files
  set(ament_cmake_copyright_FOUND TRUE)
  # the following line skips cpplint (only works in a git repo)
  # comment the line when this package is in a git repo and when
  # a copyright and license is added to all source files
  set(ament_cmake_cpplint_FOUND TRUE)
  ament_lint_auto_find_test_dependencies()
endif()

ament_package()
