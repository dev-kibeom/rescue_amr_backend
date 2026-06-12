#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};



// Corresponds to rescue_interfaces__msg__CoverageStatus

// This struct is not documented.
#[allow(missing_docs)]

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct CoverageStatus {

    // This member is not documented.
    #[allow(missing_docs)]
    pub header: std_msgs::msg::Header,


    // This member is not documented.
    #[allow(missing_docs)]
    pub mode: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub state: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub total_goals: u32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub visited_goals: u32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub coverage_ratio: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub current_goal: geometry_msgs::msg::PoseStamped,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for CoverageStatus {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::CoverageStatus::default())
  }
}

impl rosidl_runtime_rs::Message for CoverageStatus {
  type RmwMsg = super::msg::rmw::CoverageStatus;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        header: std_msgs::msg::Header::into_rmw_message(std::borrow::Cow::Owned(msg.header)).into_owned(),
        mode: msg.mode.as_str().into(),
        state: msg.state.as_str().into(),
        total_goals: msg.total_goals,
        visited_goals: msg.visited_goals,
        coverage_ratio: msg.coverage_ratio,
        current_goal: geometry_msgs::msg::PoseStamped::into_rmw_message(std::borrow::Cow::Owned(msg.current_goal)).into_owned(),
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        header: std_msgs::msg::Header::into_rmw_message(std::borrow::Cow::Borrowed(&msg.header)).into_owned(),
        mode: msg.mode.as_str().into(),
        state: msg.state.as_str().into(),
      total_goals: msg.total_goals,
      visited_goals: msg.visited_goals,
      coverage_ratio: msg.coverage_ratio,
        current_goal: geometry_msgs::msg::PoseStamped::into_rmw_message(std::borrow::Cow::Borrowed(&msg.current_goal)).into_owned(),
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      header: std_msgs::msg::Header::from_rmw_message(msg.header),
      mode: msg.mode.to_string(),
      state: msg.state.to_string(),
      total_goals: msg.total_goals,
      visited_goals: msg.visited_goals,
      coverage_ratio: msg.coverage_ratio,
      current_goal: geometry_msgs::msg::PoseStamped::from_rmw_message(msg.current_goal),
      message: msg.message.to_string(),
    }
  }
}


