// generated from rosidl_generator_cpp/resource/idl__traits.hpp.em
// with input from rescue_interfaces:msg/CoverageStatus.idl
// generated code does not contain a copyright notice

#ifndef RESCUE_INTERFACES__MSG__DETAIL__COVERAGE_STATUS__TRAITS_HPP_
#define RESCUE_INTERFACES__MSG__DETAIL__COVERAGE_STATUS__TRAITS_HPP_

#include <stdint.h>

#include <sstream>
#include <string>
#include <type_traits>

#include "rescue_interfaces/msg/detail/coverage_status__struct.hpp"
#include "rosidl_runtime_cpp/traits.hpp"

// Include directives for member types
// Member 'header'
#include "std_msgs/msg/detail/header__traits.hpp"
// Member 'current_goal'
#include "geometry_msgs/msg/detail/pose_stamped__traits.hpp"

namespace rescue_interfaces
{

namespace msg
{

inline void to_flow_style_yaml(
  const CoverageStatus & msg,
  std::ostream & out)
{
  out << "{";
  // member: header
  {
    out << "header: ";
    to_flow_style_yaml(msg.header, out);
    out << ", ";
  }

  // member: mode
  {
    out << "mode: ";
    rosidl_generator_traits::value_to_yaml(msg.mode, out);
    out << ", ";
  }

  // member: state
  {
    out << "state: ";
    rosidl_generator_traits::value_to_yaml(msg.state, out);
    out << ", ";
  }

  // member: total_goals
  {
    out << "total_goals: ";
    rosidl_generator_traits::value_to_yaml(msg.total_goals, out);
    out << ", ";
  }

  // member: visited_goals
  {
    out << "visited_goals: ";
    rosidl_generator_traits::value_to_yaml(msg.visited_goals, out);
    out << ", ";
  }

  // member: coverage_ratio
  {
    out << "coverage_ratio: ";
    rosidl_generator_traits::value_to_yaml(msg.coverage_ratio, out);
    out << ", ";
  }

  // member: current_goal
  {
    out << "current_goal: ";
    to_flow_style_yaml(msg.current_goal, out);
    out << ", ";
  }

  // member: message
  {
    out << "message: ";
    rosidl_generator_traits::value_to_yaml(msg.message, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const CoverageStatus & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: header
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "header:\n";
    to_block_style_yaml(msg.header, out, indentation + 2);
  }

  // member: mode
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "mode: ";
    rosidl_generator_traits::value_to_yaml(msg.mode, out);
    out << "\n";
  }

  // member: state
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "state: ";
    rosidl_generator_traits::value_to_yaml(msg.state, out);
    out << "\n";
  }

  // member: total_goals
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "total_goals: ";
    rosidl_generator_traits::value_to_yaml(msg.total_goals, out);
    out << "\n";
  }

  // member: visited_goals
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "visited_goals: ";
    rosidl_generator_traits::value_to_yaml(msg.visited_goals, out);
    out << "\n";
  }

  // member: coverage_ratio
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "coverage_ratio: ";
    rosidl_generator_traits::value_to_yaml(msg.coverage_ratio, out);
    out << "\n";
  }

  // member: current_goal
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "current_goal:\n";
    to_block_style_yaml(msg.current_goal, out, indentation + 2);
  }

  // member: message
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "message: ";
    rosidl_generator_traits::value_to_yaml(msg.message, out);
    out << "\n";
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const CoverageStatus & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace msg

}  // namespace rescue_interfaces

namespace rosidl_generator_traits
{

[[deprecated("use rescue_interfaces::msg::to_block_style_yaml() instead")]]
inline void to_yaml(
  const rescue_interfaces::msg::CoverageStatus & msg,
  std::ostream & out, size_t indentation = 0)
{
  rescue_interfaces::msg::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use rescue_interfaces::msg::to_yaml() instead")]]
inline std::string to_yaml(const rescue_interfaces::msg::CoverageStatus & msg)
{
  return rescue_interfaces::msg::to_yaml(msg);
}

template<>
inline const char * data_type<rescue_interfaces::msg::CoverageStatus>()
{
  return "rescue_interfaces::msg::CoverageStatus";
}

template<>
inline const char * name<rescue_interfaces::msg::CoverageStatus>()
{
  return "rescue_interfaces/msg/CoverageStatus";
}

template<>
struct has_fixed_size<rescue_interfaces::msg::CoverageStatus>
  : std::integral_constant<bool, false> {};

template<>
struct has_bounded_size<rescue_interfaces::msg::CoverageStatus>
  : std::integral_constant<bool, false> {};

template<>
struct is_message<rescue_interfaces::msg::CoverageStatus>
  : std::true_type {};

}  // namespace rosidl_generator_traits

#endif  // RESCUE_INTERFACES__MSG__DETAIL__COVERAGE_STATUS__TRAITS_HPP_
