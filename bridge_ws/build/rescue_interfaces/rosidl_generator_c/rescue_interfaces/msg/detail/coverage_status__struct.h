// generated from rosidl_generator_c/resource/idl__struct.h.em
// with input from rescue_interfaces:msg/CoverageStatus.idl
// generated code does not contain a copyright notice

#ifndef RESCUE_INTERFACES__MSG__DETAIL__COVERAGE_STATUS__STRUCT_H_
#define RESCUE_INTERFACES__MSG__DETAIL__COVERAGE_STATUS__STRUCT_H_

#ifdef __cplusplus
extern "C"
{
#endif

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>


// Constants defined in the message

// Include directives for member types
// Member 'header'
#include "std_msgs/msg/detail/header__struct.h"
// Member 'mode'
// Member 'state'
// Member 'message'
#include "rosidl_runtime_c/string.h"
// Member 'current_goal'
#include "geometry_msgs/msg/detail/pose_stamped__struct.h"

/// Struct defined in msg/CoverageStatus in the package rescue_interfaces.
typedef struct rescue_interfaces__msg__CoverageStatus
{
  std_msgs__msg__Header header;
  rosidl_runtime_c__String mode;
  rosidl_runtime_c__String state;
  uint32_t total_goals;
  uint32_t visited_goals;
  float coverage_ratio;
  geometry_msgs__msg__PoseStamped current_goal;
  rosidl_runtime_c__String message;
} rescue_interfaces__msg__CoverageStatus;

// Struct for a sequence of rescue_interfaces__msg__CoverageStatus.
typedef struct rescue_interfaces__msg__CoverageStatus__Sequence
{
  rescue_interfaces__msg__CoverageStatus * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} rescue_interfaces__msg__CoverageStatus__Sequence;

#ifdef __cplusplus
}
#endif

#endif  // RESCUE_INTERFACES__MSG__DETAIL__COVERAGE_STATUS__STRUCT_H_
