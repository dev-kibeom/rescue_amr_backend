import uuid
from app.models.database import RescueRobot, IncidentLog
from app.repositories.turtlebot4_repository import Turtlebot4Repository

# 터틀봇4 관련 비즈니스 로직을 담당하는 Service 클래스
class Turtlebot4Service:
    @staticmethod
    def process_nav_success(
        robot_id: str, x: float, y: float, message: str
    ):
        robot = Turtlebot4Repository.get_robot_by_id(robot_id)
        if not robot:
            robot = RescueRobot(id=robot_id)

        robot.status = "SUCCESS"
        robot.pos_x = x
        robot.pos_y = y
        Turtlebot4Repository.save_robot(robot)

        new_log = IncidentLog(
            id=str(uuid.uuid4()),
            robot_id=robot_id,
            message=f"<span class='highlight'>{robot_id}</span> {message} (x:{x:.1f}, y:{y:.1f})",
        )
        Turtlebot4Repository.create_log(new_log)
