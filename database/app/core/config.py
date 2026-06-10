import os
from dotenv import load_dotenv

# config.py 파일의 위치를 기준으로 database/ 폴더의 절대 경로를 계산합니다.
# __file__ = database/app/core/config.py
CORE_DIR = os.path.dirname(os.path.abspath(__file__))  # database/app/core
APP_DIR = os.path.dirname(CORE_DIR)  # database/app
BASE_DIR = os.path.dirname(APP_DIR)  # database/ (프로젝트 루트)

# 절대 경로를 기반으로 .env 파일 로드
dotenv_path = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=dotenv_path)

# ==========================================
# 환경 변수 매핑
# ==========================================
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("SERVER_PORT", 8001))
MQTT_BROKER_IP = os.getenv("MQTT_BROKER_IP", "127.0.0.1")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))

# 도커 컴포즈 환경 변수가 없으면 기본 로컬값(localhost)을 사용합니다.
DB_USER = os.getenv("DB_USER", "admin")
DB_PASSWORD = os.getenv("DB_PASSWORD", "rokey1234")
DB_HOST = os.getenv("DB_HOST", "rescue_db")  # 도커 내부에서는 서비스명 'rescue_db'로 통신
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "rescue_amr_db")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# 최종 SQLAlchemy DB URL (PostgreSQL 매핑)
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
