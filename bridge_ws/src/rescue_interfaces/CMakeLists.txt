cmake_minimum_required(VERSION 3.8)
project(rescue_interfaces)

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# find dependencies
find_package(ament_cmake REQUIRED)
find_package(rosidl_default_generators REQUIRED)

# 메시지 내부 멤버들이 의존하는 외부 패키지 로드
find_package(std_msgs REQUIRED)
find_package(geometry_msgs REQUIRED)

# 메시지 파일 등록 및 의존성 주입
rosidl_generate_interfaces(${PROJECT_NAME}
  "msg/CoverageStatus.msg"
  DEPENDENCIES std_msgs geometry_msgs
)

ament_package()