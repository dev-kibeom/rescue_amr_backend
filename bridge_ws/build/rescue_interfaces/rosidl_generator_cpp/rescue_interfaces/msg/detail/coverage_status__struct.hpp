// generated from rosidl_generator_cpp/resource/idl__struct.hpp.em
// with input from rescue_interfaces:msg/CoverageStatus.idl
// generated code does not contain a copyright notice

#ifndef RESCUE_INTERFACES__MSG__DETAIL__COVERAGE_STATUS__STRUCT_HPP_
#define RESCUE_INTERFACES__MSG__DETAIL__COVERAGE_STATUS__STRUCT_HPP_

#include <algorithm>
#include <array>
#include <cstdint>
#include <memory>
#include <string>
#include <vector>

#include "rosidl_runtime_cpp/bounded_vector.hpp"
#include "rosidl_runtime_cpp/message_initialization.hpp"


// Include directives for member types
// Member 'header'
#include "std_msgs/msg/detail/header__struct.hpp"
// Member 'current_goal'
#include "geometry_msgs/msg/detail/pose_stamped__struct.hpp"

#ifndef _WIN32
# define DEPRECATED__rescue_interfaces__msg__CoverageStatus __attribute__((deprecated))
#else
# define DEPRECATED__rescue_interfaces__msg__CoverageStatus __declspec(deprecated)
#endif

namespace rescue_interfaces
{

namespace msg
{

// message struct
template<class ContainerAllocator>
struct CoverageStatus_
{
  using Type = CoverageStatus_<ContainerAllocator>;

  explicit CoverageStatus_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : header(_init),
    current_goal(_init)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->mode = "";
      this->state = "";
      this->total_goals = 0ul;
      this->visited_goals = 0ul;
      this->coverage_ratio = 0.0f;
      this->message = "";
    }
  }

  explicit CoverageStatus_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : header(_alloc, _init),
    mode(_alloc),
    state(_alloc),
    current_goal(_alloc, _init),
    message(_alloc)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->mode = "";
      this->state = "";
      this->total_goals = 0ul;
      this->visited_goals = 0ul;
      this->coverage_ratio = 0.0f;
      this->message = "";
    }
  }

  // field types and members
  using _header_type =
    std_msgs::msg::Header_<ContainerAllocator>;
  _header_type header;
  using _mode_type =
    std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>;
  _mode_type mode;
  using _state_type =
    std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>;
  _state_type state;
  using _total_goals_type =
    uint32_t;
  _total_goals_type total_goals;
  using _visited_goals_type =
    uint32_t;
  _visited_goals_type visited_goals;
  using _coverage_ratio_type =
    float;
  _coverage_ratio_type coverage_ratio;
  using _current_goal_type =
    geometry_msgs::msg::PoseStamped_<ContainerAllocator>;
  _current_goal_type current_goal;
  using _message_type =
    std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>;
  _message_type message;

  // setters for named parameter idiom
  Type & set__header(
    const std_msgs::msg::Header_<ContainerAllocator> & _arg)
  {
    this->header = _arg;
    return *this;
  }
  Type & set__mode(
    const std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>> & _arg)
  {
    this->mode = _arg;
    return *this;
  }
  Type & set__state(
    const std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>> & _arg)
  {
    this->state = _arg;
    return *this;
  }
  Type & set__total_goals(
    const uint32_t & _arg)
  {
    this->total_goals = _arg;
    return *this;
  }
  Type & set__visited_goals(
    const uint32_t & _arg)
  {
    this->visited_goals = _arg;
    return *this;
  }
  Type & set__coverage_ratio(
    const float & _arg)
  {
    this->coverage_ratio = _arg;
    return *this;
  }
  Type & set__current_goal(
    const geometry_msgs::msg::PoseStamped_<ContainerAllocator> & _arg)
  {
    this->current_goal = _arg;
    return *this;
  }
  Type & set__message(
    const std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>> & _arg)
  {
    this->message = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    rescue_interfaces::msg::CoverageStatus_<ContainerAllocator> *;
  using ConstRawPtr =
    const rescue_interfaces::msg::CoverageStatus_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<rescue_interfaces::msg::CoverageStatus_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<rescue_interfaces::msg::CoverageStatus_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      rescue_interfaces::msg::CoverageStatus_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<rescue_interfaces::msg::CoverageStatus_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      rescue_interfaces::msg::CoverageStatus_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<rescue_interfaces::msg::CoverageStatus_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<rescue_interfaces::msg::CoverageStatus_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<rescue_interfaces::msg::CoverageStatus_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__rescue_interfaces__msg__CoverageStatus
    std::shared_ptr<rescue_interfaces::msg::CoverageStatus_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__rescue_interfaces__msg__CoverageStatus
    std::shared_ptr<rescue_interfaces::msg::CoverageStatus_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const CoverageStatus_ & other) const
  {
    if (this->header != other.header) {
      return false;
    }
    if (this->mode != other.mode) {
      return false;
    }
    if (this->state != other.state) {
      return false;
    }
    if (this->total_goals != other.total_goals) {
      return false;
    }
    if (this->visited_goals != other.visited_goals) {
      return false;
    }
    if (this->coverage_ratio != other.coverage_ratio) {
      return false;
    }
    if (this->current_goal != other.current_goal) {
      return false;
    }
    if (this->message != other.message) {
      return false;
    }
    return true;
  }
  bool operator!=(const CoverageStatus_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct CoverageStatus_

// alias to use template instance with default allocator
using CoverageStatus =
  rescue_interfaces::msg::CoverageStatus_<std::allocator<void>>;

// constant definitions

}  // namespace msg

}  // namespace rescue_interfaces

#endif  // RESCUE_INTERFACES__MSG__DETAIL__COVERAGE_STATUS__STRUCT_HPP_
