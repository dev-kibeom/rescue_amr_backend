#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};


#[link(name = "rescue_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__rescue_interfaces__msg__CoverageStatus() -> *const std::ffi::c_void;
}

#[link(name = "rescue_interfaces__rosidl_generator_c")]
extern "C" {
    fn rescue_interfaces__msg__CoverageStatus__init(msg: *mut CoverageStatus) -> bool;
    fn rescue_interfaces__msg__CoverageStatus__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<CoverageStatus>, size: usize) -> bool;
    fn rescue_interfaces__msg__CoverageStatus__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<CoverageStatus>);
    fn rescue_interfaces__msg__CoverageStatus__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<CoverageStatus>, out_seq: *mut rosidl_runtime_rs::Sequence<CoverageStatus>) -> bool;
}

// Corresponds to rescue_interfaces__msg__CoverageStatus
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct CoverageStatus {

    // This member is not documented.
    #[allow(missing_docs)]
    pub header: std_msgs::msg::rmw::Header,


    // This member is not documented.
    #[allow(missing_docs)]
    pub mode: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub state: rosidl_runtime_rs::String,


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
    pub current_goal: geometry_msgs::msg::rmw::PoseStamped,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for CoverageStatus {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !rescue_interfaces__msg__CoverageStatus__init(&mut msg as *mut _) {
        panic!("Call to rescue_interfaces__msg__CoverageStatus__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for CoverageStatus {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { rescue_interfaces__msg__CoverageStatus__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { rescue_interfaces__msg__CoverageStatus__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { rescue_interfaces__msg__CoverageStatus__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for CoverageStatus {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for CoverageStatus where Self: Sized {
  const TYPE_NAME: &'static str = "rescue_interfaces/msg/CoverageStatus";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__rescue_interfaces__msg__CoverageStatus() }
  }
}


