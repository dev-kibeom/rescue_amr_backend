# 객체의 종류와 3D 위치, 확신도를 모두 담는 종합 비전 타겟 메시지
std_msgs/Header header

string class_name          # 예: "apple", "cup", "0", "1"
float32 confidence         # 예: 0.85 (85% 확신)
geometry_msgs/Pose pose    # 객체의 3D 위치(x, y, z) 및 회전(OBB의 경우 yaw 적용)