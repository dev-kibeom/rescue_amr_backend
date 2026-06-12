// generated from rosidl_generator_c/resource/idl__functions.c.em
// with input from rescue_interfaces:msg/CoverageStatus.idl
// generated code does not contain a copyright notice
#include "rescue_interfaces/msg/detail/coverage_status__functions.h"

#include <assert.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

#include "rcutils/allocator.h"


// Include directives for member types
// Member `header`
#include "std_msgs/msg/detail/header__functions.h"
// Member `mode`
// Member `state`
// Member `message`
#include "rosidl_runtime_c/string_functions.h"
// Member `current_goal`
#include "geometry_msgs/msg/detail/pose_stamped__functions.h"

bool
rescue_interfaces__msg__CoverageStatus__init(rescue_interfaces__msg__CoverageStatus * msg)
{
  if (!msg) {
    return false;
  }
  // header
  if (!std_msgs__msg__Header__init(&msg->header)) {
    rescue_interfaces__msg__CoverageStatus__fini(msg);
    return false;
  }
  // mode
  if (!rosidl_runtime_c__String__init(&msg->mode)) {
    rescue_interfaces__msg__CoverageStatus__fini(msg);
    return false;
  }
  // state
  if (!rosidl_runtime_c__String__init(&msg->state)) {
    rescue_interfaces__msg__CoverageStatus__fini(msg);
    return false;
  }
  // total_goals
  // visited_goals
  // coverage_ratio
  // current_goal
  if (!geometry_msgs__msg__PoseStamped__init(&msg->current_goal)) {
    rescue_interfaces__msg__CoverageStatus__fini(msg);
    return false;
  }
  // message
  if (!rosidl_runtime_c__String__init(&msg->message)) {
    rescue_interfaces__msg__CoverageStatus__fini(msg);
    return false;
  }
  return true;
}

void
rescue_interfaces__msg__CoverageStatus__fini(rescue_interfaces__msg__CoverageStatus * msg)
{
  if (!msg) {
    return;
  }
  // header
  std_msgs__msg__Header__fini(&msg->header);
  // mode
  rosidl_runtime_c__String__fini(&msg->mode);
  // state
  rosidl_runtime_c__String__fini(&msg->state);
  // total_goals
  // visited_goals
  // coverage_ratio
  // current_goal
  geometry_msgs__msg__PoseStamped__fini(&msg->current_goal);
  // message
  rosidl_runtime_c__String__fini(&msg->message);
}

bool
rescue_interfaces__msg__CoverageStatus__are_equal(const rescue_interfaces__msg__CoverageStatus * lhs, const rescue_interfaces__msg__CoverageStatus * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // header
  if (!std_msgs__msg__Header__are_equal(
      &(lhs->header), &(rhs->header)))
  {
    return false;
  }
  // mode
  if (!rosidl_runtime_c__String__are_equal(
      &(lhs->mode), &(rhs->mode)))
  {
    return false;
  }
  // state
  if (!rosidl_runtime_c__String__are_equal(
      &(lhs->state), &(rhs->state)))
  {
    return false;
  }
  // total_goals
  if (lhs->total_goals != rhs->total_goals) {
    return false;
  }
  // visited_goals
  if (lhs->visited_goals != rhs->visited_goals) {
    return false;
  }
  // coverage_ratio
  if (lhs->coverage_ratio != rhs->coverage_ratio) {
    return false;
  }
  // current_goal
  if (!geometry_msgs__msg__PoseStamped__are_equal(
      &(lhs->current_goal), &(rhs->current_goal)))
  {
    return false;
  }
  // message
  if (!rosidl_runtime_c__String__are_equal(
      &(lhs->message), &(rhs->message)))
  {
    return false;
  }
  return true;
}

bool
rescue_interfaces__msg__CoverageStatus__copy(
  const rescue_interfaces__msg__CoverageStatus * input,
  rescue_interfaces__msg__CoverageStatus * output)
{
  if (!input || !output) {
    return false;
  }
  // header
  if (!std_msgs__msg__Header__copy(
      &(input->header), &(output->header)))
  {
    return false;
  }
  // mode
  if (!rosidl_runtime_c__String__copy(
      &(input->mode), &(output->mode)))
  {
    return false;
  }
  // state
  if (!rosidl_runtime_c__String__copy(
      &(input->state), &(output->state)))
  {
    return false;
  }
  // total_goals
  output->total_goals = input->total_goals;
  // visited_goals
  output->visited_goals = input->visited_goals;
  // coverage_ratio
  output->coverage_ratio = input->coverage_ratio;
  // current_goal
  if (!geometry_msgs__msg__PoseStamped__copy(
      &(input->current_goal), &(output->current_goal)))
  {
    return false;
  }
  // message
  if (!rosidl_runtime_c__String__copy(
      &(input->message), &(output->message)))
  {
    return false;
  }
  return true;
}

rescue_interfaces__msg__CoverageStatus *
rescue_interfaces__msg__CoverageStatus__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  rescue_interfaces__msg__CoverageStatus * msg = (rescue_interfaces__msg__CoverageStatus *)allocator.allocate(sizeof(rescue_interfaces__msg__CoverageStatus), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(rescue_interfaces__msg__CoverageStatus));
  bool success = rescue_interfaces__msg__CoverageStatus__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
rescue_interfaces__msg__CoverageStatus__destroy(rescue_interfaces__msg__CoverageStatus * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    rescue_interfaces__msg__CoverageStatus__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
rescue_interfaces__msg__CoverageStatus__Sequence__init(rescue_interfaces__msg__CoverageStatus__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  rescue_interfaces__msg__CoverageStatus * data = NULL;

  if (size) {
    data = (rescue_interfaces__msg__CoverageStatus *)allocator.zero_allocate(size, sizeof(rescue_interfaces__msg__CoverageStatus), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = rescue_interfaces__msg__CoverageStatus__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        rescue_interfaces__msg__CoverageStatus__fini(&data[i - 1]);
      }
      allocator.deallocate(data, allocator.state);
      return false;
    }
  }
  array->data = data;
  array->size = size;
  array->capacity = size;
  return true;
}

void
rescue_interfaces__msg__CoverageStatus__Sequence__fini(rescue_interfaces__msg__CoverageStatus__Sequence * array)
{
  if (!array) {
    return;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();

  if (array->data) {
    // ensure that data and capacity values are consistent
    assert(array->capacity > 0);
    // finalize all array elements
    for (size_t i = 0; i < array->capacity; ++i) {
      rescue_interfaces__msg__CoverageStatus__fini(&array->data[i]);
    }
    allocator.deallocate(array->data, allocator.state);
    array->data = NULL;
    array->size = 0;
    array->capacity = 0;
  } else {
    // ensure that data, size, and capacity values are consistent
    assert(0 == array->size);
    assert(0 == array->capacity);
  }
}

rescue_interfaces__msg__CoverageStatus__Sequence *
rescue_interfaces__msg__CoverageStatus__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  rescue_interfaces__msg__CoverageStatus__Sequence * array = (rescue_interfaces__msg__CoverageStatus__Sequence *)allocator.allocate(sizeof(rescue_interfaces__msg__CoverageStatus__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = rescue_interfaces__msg__CoverageStatus__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
rescue_interfaces__msg__CoverageStatus__Sequence__destroy(rescue_interfaces__msg__CoverageStatus__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    rescue_interfaces__msg__CoverageStatus__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
rescue_interfaces__msg__CoverageStatus__Sequence__are_equal(const rescue_interfaces__msg__CoverageStatus__Sequence * lhs, const rescue_interfaces__msg__CoverageStatus__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!rescue_interfaces__msg__CoverageStatus__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
rescue_interfaces__msg__CoverageStatus__Sequence__copy(
  const rescue_interfaces__msg__CoverageStatus__Sequence * input,
  rescue_interfaces__msg__CoverageStatus__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(rescue_interfaces__msg__CoverageStatus);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    rescue_interfaces__msg__CoverageStatus * data =
      (rescue_interfaces__msg__CoverageStatus *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!rescue_interfaces__msg__CoverageStatus__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          rescue_interfaces__msg__CoverageStatus__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!rescue_interfaces__msg__CoverageStatus__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}
