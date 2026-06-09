// include/rescue_bt_manager/check_survivor_sub.hpp
#pragma once
#include "behaviortree_cpp_v3/condition_node.h"
#include "rclcpp/rclcpp.hpp"
#include "interfaces/msg/target_pose.hpp"
#include "geometry_msgs/msg/pose_stamped.hpp"

class CheckSurvivorSub : public BT::ConditionNode
{
public:
    CheckSurvivorSub(const std::string& name, const BT::NodeConfiguration& config)
        : BT::ConditionNode(name, config), has_survivor_(false)
    {
        // ROS2 노드 및 구독자 초기화
        node_ = rclcpp::Node::make_shared("bt_survivor_subscriber");
        
        sub_ = node_->create_subscription<interfaces::msg::TargetPose>(
            "/yolo/target_pose", 10,
            std::bind(&CheckSurvivorSub::target_callback, this, std::placeholders::_1));
    }

    static BT::PortsList providedPorts() {
        return { BT::OutputPort<geometry_msgs::msg::PoseStamped>("survivor_pose") };
    }

    BT::NodeStatus tick() override {
        // 백그라운드 토픽 큐 소모
        rclcpp::spin_some(node_);

        std::lock_guard<std::mutex> lock(mutex_);
        if (has_survivor_) {
            setOutput("survivor_pose", last_pose_);
            // 1회성 트리거 소모 처리 (필요에 따라 유지 또는 지속 구독 상태에 따라 커스텀 가능)
            has_survivor_ = false; 
            return BT::NodeStatus::SUCCESS;
        }
        return BT::NodeStatus::FAILURE;
    }

private:
    void target_callback(const interfaces::msg::TargetPose::SharedPtr msg) {
        std::lock_guard<std::mutex> lock(mutex_);
        if (msg->class_name == "survivor" && msg->confidence >= 0.5) {
            last_pose_.header = msg->header;
            last_pose_.pose = msg->pose;
            has_survivor_ = true;
        }
    }

    rclcpp::Node::SharedPtr node_;
    rclcpp::Subscription<interfaces::msg::TargetPose>::SharedPtr sub_;
    geometry_msgs::msg::PoseStamped last_pose_;
    bool has_survivor_;
    std::mutex mutex_;
};