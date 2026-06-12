// generated from rosidl_generator_cpp/resource/idl__builder.hpp.em
// with input from rescue_interfaces:msg/CoverageStatus.idl
// generated code does not contain a copyright notice

#ifndef RESCUE_INTERFACES__MSG__DETAIL__COVERAGE_STATUS__BUILDER_HPP_
#define RESCUE_INTERFACES__MSG__DETAIL__COVERAGE_STATUS__BUILDER_HPP_

#include <algorithm>
#include <utility>

#include "rescue_interfaces/msg/detail/coverage_status__struct.hpp"
#include "rosidl_runtime_cpp/message_initialization.hpp"


namespace rescue_interfaces
{

namespace msg
{

namespace builder
{

class Init_CoverageStatus_message
{
public:
  explicit Init_CoverageStatus_message(::rescue_interfaces::msg::CoverageStatus & msg)
  : msg_(msg)
  {}
  ::rescue_interfaces::msg::CoverageStatus message(::rescue_interfaces::msg::CoverageStatus::_message_type arg)
  {
    msg_.message = std::move(arg);
    return std::move(msg_);
  }

private:
  ::rescue_interfaces::msg::CoverageStatus msg_;
};

class Init_CoverageStatus_current_goal
{
public:
  explicit Init_CoverageStatus_current_goal(::rescue_interfaces::msg::CoverageStatus & msg)
  : msg_(msg)
  {}
  Init_CoverageStatus_message current_goal(::rescue_interfaces::msg::CoverageStatus::_current_goal_type arg)
  {
    msg_.current_goal = std::move(arg);
    return Init_CoverageStatus_message(msg_);
  }

private:
  ::rescue_interfaces::msg::CoverageStatus msg_;
};

class Init_CoverageStatus_coverage_ratio
{
public:
  explicit Init_CoverageStatus_coverage_ratio(::rescue_interfaces::msg::CoverageStatus & msg)
  : msg_(msg)
  {}
  Init_CoverageStatus_current_goal coverage_ratio(::rescue_interfaces::msg::CoverageStatus::_coverage_ratio_type arg)
  {
    msg_.coverage_ratio = std::move(arg);
    return Init_CoverageStatus_current_goal(msg_);
  }

private:
  ::rescue_interfaces::msg::CoverageStatus msg_;
};

class Init_CoverageStatus_visited_goals
{
public:
  explicit Init_CoverageStatus_visited_goals(::rescue_interfaces::msg::CoverageStatus & msg)
  : msg_(msg)
  {}
  Init_CoverageStatus_coverage_ratio visited_goals(::rescue_interfaces::msg::CoverageStatus::_visited_goals_type arg)
  {
    msg_.visited_goals = std::move(arg);
    return Init_CoverageStatus_coverage_ratio(msg_);
  }

private:
  ::rescue_interfaces::msg::CoverageStatus msg_;
};

class Init_CoverageStatus_total_goals
{
public:
  explicit Init_CoverageStatus_total_goals(::rescue_interfaces::msg::CoverageStatus & msg)
  : msg_(msg)
  {}
  Init_CoverageStatus_visited_goals total_goals(::rescue_interfaces::msg::CoverageStatus::_total_goals_type arg)
  {
    msg_.total_goals = std::move(arg);
    return Init_CoverageStatus_visited_goals(msg_);
  }

private:
  ::rescue_interfaces::msg::CoverageStatus msg_;
};

class Init_CoverageStatus_state
{
public:
  explicit Init_CoverageStatus_state(::rescue_interfaces::msg::CoverageStatus & msg)
  : msg_(msg)
  {}
  Init_CoverageStatus_total_goals state(::rescue_interfaces::msg::CoverageStatus::_state_type arg)
  {
    msg_.state = std::move(arg);
    return Init_CoverageStatus_total_goals(msg_);
  }

private:
  ::rescue_interfaces::msg::CoverageStatus msg_;
};

class Init_CoverageStatus_mode
{
public:
  explicit Init_CoverageStatus_mode(::rescue_interfaces::msg::CoverageStatus & msg)
  : msg_(msg)
  {}
  Init_CoverageStatus_state mode(::rescue_interfaces::msg::CoverageStatus::_mode_type arg)
  {
    msg_.mode = std::move(arg);
    return Init_CoverageStatus_state(msg_);
  }

private:
  ::rescue_interfaces::msg::CoverageStatus msg_;
};

class Init_CoverageStatus_header
{
public:
  Init_CoverageStatus_header()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_CoverageStatus_mode header(::rescue_interfaces::msg::CoverageStatus::_header_type arg)
  {
    msg_.header = std::move(arg);
    return Init_CoverageStatus_mode(msg_);
  }

private:
  ::rescue_interfaces::msg::CoverageStatus msg_;
};

}  // namespace builder

}  // namespace msg

template<typename MessageType>
auto build();

template<>
inline
auto build<::rescue_interfaces::msg::CoverageStatus>()
{
  return rescue_interfaces::msg::builder::Init_CoverageStatus_header();
}

}  // namespace rescue_interfaces

#endif  // RESCUE_INTERFACES__MSG__DETAIL__COVERAGE_STATUS__BUILDER_HPP_
