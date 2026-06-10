#pragma once
#include "behaviortree_cpp_v3/action_node.h"
#include "rclcpp/rclcpp.hpp"
#include "geometry_msgs/msg/pose_stamped.hpp"

class LogRescueToDashboard : public BT::SyncActionNode
{
public:
    LogRescueToDashboard(const std::string& name, const BT::NodeConfiguration& config)
        : BT::SyncActionNode(name, config)
    {
        node_ = rclcpp::Node::make_shared("bt_dashboard_logger");
        // 데이터베이스 혹은 관제 서버 연동 브릿지 토픽 생성
        pub_ = node_->create_publisher<geometry_msgs::msg::PoseStamped>("/report/survivor_found", 10);
    }

    static BT::PortsList providedPorts() {
        return { BT::InputPort<geometry_msgs::msg::PoseStamped>("survivor_pose") };
    }

    BT::NodeStatus tick() override {
        geometry_msgs::msg::PoseStamped pose;
        if (!getInput("survivor_pose", pose)) {
            RCLCPP_ERROR(node_->get_logger(), "[-] 블랙보드에서 survivor_pose 포트를 읽는데 실패했습니다.");
            return BT::NodeStatus::FAILURE;
        }

        RCLCPP_INFO(node_->get_logger(), "🚨 [관제 보고] 생존자 발견! 좌표 연동 중... X: %.2f, Y: %.2f", 
                    pose.pose.position.x, pose.pose.position.y);
        
        // 대시보드 브릿지 노드로 데이터 발행
        pub_->publish(pose);
        
        return BT::NodeStatus::SUCCESS;
    }

private:
    rclcpp::Node::SharedPtr node_;
    rclcpp::Publisher<geometry_msgs::msg::PoseStamped>::SharedPtr pub_;
};