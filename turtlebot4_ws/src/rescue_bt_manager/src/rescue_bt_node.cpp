#include <iostream>
#include <chrono>
#include <memory>
#include <string>

#include "rclcpp/rclcpp.hpp"
#include "behaviortree_cpp_v3/bt_factory.h"
#include "behaviortree_cpp_v3/loggers/bt_cout_logger.h"

// 기범님이 구현하신 커스텀 노드 헤더 임포트
#include "rescue_bt_manager/check_survivor_sub.hpp"
#include "rescue_bt_manager/log_rescure_to_dashboard.hpp"

using namespace std;

int main(int argc, char* argv[])
{
    rclcpp::init(argc, argv);
    auto node = rclcpp::Node::make_shared("rescue_behavior_tree_node");

    BT::BehaviorTreeFactory factory;

    // 팩토리에 커스텀 노드 타입 등록
    factory.registerNodeType<CheckSurvivorSub>("CheckSurvivor");
    factory.registerNodeType<LogRescueToDashboard>("LogRescueToDashboard");

    // 패키지 경로 내의 XML 파일 로드 설정
    string xml_path = "./config/rescue_tree.xml";
    
    try {
        auto tree = factory.createTreeFromFile(xml_path);
        BT::StdCoutLogger logger_cout(tree);

        RCLCPP_INFO(node->get_logger(), "🌲 [ARES BT] Behavior Tree 가 실행 준비 완료되었습니다.");

        // 트리 제어 루프 (10Hz 주기로 트리를 감시하며 실행)
        rclcpp::WallRate loop_rate(10);
        BT::NodeStatus status = BT::NodeStatus::RUNNING;

        while (rclcpp::ok() && status == BT::NodeStatus::RUNNING) {
            status = tree.tickRoot();
            loop_rate.sleep();
        }

        RCLCPP_INFO(node->get_logger(), "🌲 [ARES BT] Behavior Tree 시퀀스가 종료되었습니다. 최종 상태: %d", static_cast<int>(status));
    }
    catch (const std::exception& e) {
        RCLCPP_ERROR(node->get_logger(), "❌ [ARES BT] 트리 생성 실패: %s", e.what());
    }

    rclcpp::shutdown();
    return 0;
}