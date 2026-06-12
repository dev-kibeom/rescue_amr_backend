// generated from rosidl_typesupport_introspection_c/resource/idl__type_support.c.em
// with input from rescue_interfaces:msg/CoverageStatus.idl
// generated code does not contain a copyright notice

#include <stddef.h>
#include "rescue_interfaces/msg/detail/coverage_status__rosidl_typesupport_introspection_c.h"
#include "rescue_interfaces/msg/rosidl_typesupport_introspection_c__visibility_control.h"
#include "rosidl_typesupport_introspection_c/field_types.h"
#include "rosidl_typesupport_introspection_c/identifier.h"
#include "rosidl_typesupport_introspection_c/message_introspection.h"
#include "rescue_interfaces/msg/detail/coverage_status__functions.h"
#include "rescue_interfaces/msg/detail/coverage_status__struct.h"


// Include directives for member types
// Member `header`
#include "std_msgs/msg/header.h"
// Member `header`
#include "std_msgs/msg/detail/header__rosidl_typesupport_introspection_c.h"
// Member `mode`
// Member `state`
// Member `message`
#include "rosidl_runtime_c/string_functions.h"
// Member `current_goal`
#include "geometry_msgs/msg/pose_stamped.h"
// Member `current_goal`
#include "geometry_msgs/msg/detail/pose_stamped__rosidl_typesupport_introspection_c.h"

#ifdef __cplusplus
extern "C"
{
#endif

void rescue_interfaces__msg__CoverageStatus__rosidl_typesupport_introspection_c__CoverageStatus_init_function(
  void * message_memory, enum rosidl_runtime_c__message_initialization _init)
{
  // TODO(karsten1987): initializers are not yet implemented for typesupport c
  // see https://github.com/ros2/ros2/issues/397
  (void) _init;
  rescue_interfaces__msg__CoverageStatus__init(message_memory);
}

void rescue_interfaces__msg__CoverageStatus__rosidl_typesupport_introspection_c__CoverageStatus_fini_function(void * message_memory)
{
  rescue_interfaces__msg__CoverageStatus__fini(message_memory);
}

static rosidl_typesupport_introspection_c__MessageMember rescue_interfaces__msg__CoverageStatus__rosidl_typesupport_introspection_c__CoverageStatus_message_member_array[8] = {
  {
    "header",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_MESSAGE,  // type
    0,  // upper bound of string
    NULL,  // members of sub message (initialized later)
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(rescue_interfaces__msg__CoverageStatus, header),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "mode",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_STRING,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(rescue_interfaces__msg__CoverageStatus, mode),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "state",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_STRING,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(rescue_interfaces__msg__CoverageStatus, state),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "total_goals",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_UINT32,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(rescue_interfaces__msg__CoverageStatus, total_goals),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "visited_goals",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_UINT32,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(rescue_interfaces__msg__CoverageStatus, visited_goals),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "coverage_ratio",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_FLOAT,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(rescue_interfaces__msg__CoverageStatus, coverage_ratio),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "current_goal",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_MESSAGE,  // type
    0,  // upper bound of string
    NULL,  // members of sub message (initialized later)
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(rescue_interfaces__msg__CoverageStatus, current_goal),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "message",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_STRING,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(rescue_interfaces__msg__CoverageStatus, message),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  }
};

static const rosidl_typesupport_introspection_c__MessageMembers rescue_interfaces__msg__CoverageStatus__rosidl_typesupport_introspection_c__CoverageStatus_message_members = {
  "rescue_interfaces__msg",  // message namespace
  "CoverageStatus",  // message name
  8,  // number of fields
  sizeof(rescue_interfaces__msg__CoverageStatus),
  rescue_interfaces__msg__CoverageStatus__rosidl_typesupport_introspection_c__CoverageStatus_message_member_array,  // message members
  rescue_interfaces__msg__CoverageStatus__rosidl_typesupport_introspection_c__CoverageStatus_init_function,  // function to initialize message memory (memory has to be allocated)
  rescue_interfaces__msg__CoverageStatus__rosidl_typesupport_introspection_c__CoverageStatus_fini_function  // function to terminate message instance (will not free memory)
};

// this is not const since it must be initialized on first access
// since C does not allow non-integral compile-time constants
static rosidl_message_type_support_t rescue_interfaces__msg__CoverageStatus__rosidl_typesupport_introspection_c__CoverageStatus_message_type_support_handle = {
  0,
  &rescue_interfaces__msg__CoverageStatus__rosidl_typesupport_introspection_c__CoverageStatus_message_members,
  get_message_typesupport_handle_function,
};

ROSIDL_TYPESUPPORT_INTROSPECTION_C_EXPORT_rescue_interfaces
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, rescue_interfaces, msg, CoverageStatus)() {
  rescue_interfaces__msg__CoverageStatus__rosidl_typesupport_introspection_c__CoverageStatus_message_member_array[0].members_ =
    ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, std_msgs, msg, Header)();
  rescue_interfaces__msg__CoverageStatus__rosidl_typesupport_introspection_c__CoverageStatus_message_member_array[6].members_ =
    ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, geometry_msgs, msg, PoseStamped)();
  if (!rescue_interfaces__msg__CoverageStatus__rosidl_typesupport_introspection_c__CoverageStatus_message_type_support_handle.typesupport_identifier) {
    rescue_interfaces__msg__CoverageStatus__rosidl_typesupport_introspection_c__CoverageStatus_message_type_support_handle.typesupport_identifier =
      rosidl_typesupport_introspection_c__identifier;
  }
  return &rescue_interfaces__msg__CoverageStatus__rosidl_typesupport_introspection_c__CoverageStatus_message_type_support_handle;
}
#ifdef __cplusplus
}
#endif
