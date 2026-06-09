from flask import Blueprint, request, jsonify
from app.services.turtlebot4_services import Turtlebot4Service
from app.repositories.turtlebot4_repository import Turtlebot4Repository
import uuid
from app.models.database import IncidentLog, Survivor, SurvivorLog, db

api_bp = Blueprint("api", __name__)


@api_bp.route("/robots/<robot_id>/nav_success", methods=["POST"])
def handle_nav_success(robot_id):
    data = request.get_json()
    Turtlebot4Service.process_nav_success(
        robot_id, data["x"], data["y"], data["message"]
    )
    return jsonify({"status": "ok"}), 200


@api_bp.route("/logs", methods=["GET"])
def get_logs():
    logs = Turtlebot4Repository.get_recent_logs(limit=10)
    return jsonify(
        [
            {"time": log.timestamp.strftime("%H:%M:%S"), "msg": log.message}
            for log in logs
        ]
    ), 200


@api_bp.route("/logs", methods=["POST"])
def add_yolo_log():
    data = request.get_json()
    new_log = IncidentLog(
        id=str(uuid.uuid4()),
        robot_id=data.get("robot_id", "ARES-VISION"),
        message=data.get("message", ""),
    )
    Turtlebot4Repository.create_log(new_log)
    return jsonify({"status": "ok"}), 200


@api_bp.route("/survivor-logs", methods=["POST"])
def add_survivor_log():
    """🚀 고도화된 AI 구조로그 수신 창구 (React Incident Log 자동 일원화)"""
    data = request.get_json()
    try:
        survivor_id = data.get("id")

        # 🚨 외래키 위반 방지 처리
        # 미식별 대상자('Unknown') 문자열이 들어오면 DB FK 에러를 피하기 위해 연산 가능한 SQL NULL(None)로 변환합니다.
        if survivor_id in ["Unknown", "UNIDENTIFIED", "", None]:
            survivor_id = None

        # 1. 생존자 실시간 위치/매칭 테이블 기록
        new_log = SurvivorLog(
            id=survivor_id,
            detected_x=data.get("detected_x"),
            detected_y=data.get("detected_y"),
            similarity=data.get("similarity"),
            robot_id=data.get("robot_id", "robot1"),
            img_path=data.get("img_path"),
        )
        db.session.add(new_log)

        # 2. 🚨 대시보드 Incident Log 전용 메시지 실시간 조립
        if survivor_id:
            # 부모 테이블에서 실제 성함 조회
            survivor = Survivor.query.filter_by(id=survivor_id).first()
            name_str = survivor.name if survivor else survivor_id
            sim_percent = data.get("similarity", 0) * 100
            integrated_msg = f"<span class='highlight'>[생존자 식별]</span> {name_str} 님 포착 (유사도: {sim_percent:.1f}%)"
        else:
            # 매칭 실패 시에도 유령 문자열 대신 관제실 알림 텍스트로 가공하여 전송
            integrated_msg = f"<span class='highlight-warn'>[미식별 대상 감지]</span> 알 수 없는 구조대상자 포착 (X: {data.get('detected_x')}, Y: {data.get('detected_y')})"

        # 통합 인시던트 로그 인서트
        integrated_log = IncidentLog(
            id=str(uuid.uuid4()),
            robot_id=data.get("robot_id", "robot1"),
            message=integrated_msg,
        )
        db.session.add(integrated_log)
        db.session.commit()

        return jsonify({"status": "success", "message": "Log saved successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 400


@api_bp.route("/survivors/identify", methods=["POST"])
def identify_survivor():
    """현장 포착 벡터를 받아 가장 유사한 구조대상자 1명을 반환하는 API"""
    data = request.get_json()
    input_vector = data.get("vector")

    print(
        f"📥 [백엔드 오퍼레이션] 유사도 검색 요청 수신 완료! (차원 수: {len(input_vector) if input_vector else 0})"
    )

    if not input_vector or len(input_vector) != 256:
        return jsonify(
            {"status": "error", "message": "256차원의 올바른 벡터가 필요합니다."}
        ), 400

    try:
        vector_str = f"[{','.join(map(str, input_vector))}]"
        print(
            f"🧱 [백엔드 오퍼레이션] DB 전송용 벡터 포맷팅 완료: {vector_str[:60]}..."
        )

        # 표준 CAST 문법
        query_text = db.text("""
            SELECT id, name, birth_year, sex, phone_number,
                   (1 - (face_vector <=> CAST(:vec AS vector))) * 100 AS similarity
            FROM survivors
            WHERE face_vector IS NOT NULL
            ORDER BY face_vector <=> CAST(:vec AS vector)
            LIMIT 1;
        """)

        result = db.session.execute(query_text, {"vec": vector_str}).fetchone()

        if result:
            print(
                f"🎯 [백엔드 오퍼레이션] DB 매칭 성공! 대상자: {result.name}, 유사도: {result.similarity:.2f}%"
            )
            return jsonify(
                {
                    "status": "success",
                    "matched": True,
                    "data": {
                        "id": result.id,
                        "name": result.name,
                        "birth_year": result.birth_year,
                        "sex": result.sex,
                        "phone_number": result.phone_number,
                        "similarity": round(float(result.similarity), 2),
                    },
                }
            ), 200
        else:
            print(
                "⚠️ [백엔드 오퍼레이션] 쿼리는 정상 실행되었으나, 매칭되는 행(Row)이 없습니다."
            )
            return jsonify(
                {
                    "status": "success",
                    "matched": False,
                    "message": "비교할 부모 벡터 데이터가 없습니다.",
                }
            ), 200

    except Exception as e:
        print(f"❌ [백엔드 오퍼레이션] SQLAlchemy 내부 연산 실패 상세 원인: {str(e)}")
        return jsonify({"status": "success", "matched": False, "message": str(e)}), 200


from app.models.database import LoginUser


import bcrypt as _bcrypt
from app.models.database import LoginUser


@api_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password", "").encode("utf-8")

    user = LoginUser.query.filter_by(username=username).first()
    if not user or not _bcrypt.checkpw(password, user.password_hash.encode("utf-8")):
        return jsonify({"status": "error", "message": "아이디 또는 비밀번호가 틀렸습니다."}), 401

    return jsonify({"ok": True, "username": username}), 200
