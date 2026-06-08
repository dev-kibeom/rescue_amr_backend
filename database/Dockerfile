FROM python:3.10-slim

# 컨테이너 내 작업 디렉토리 설정
WORKDIR /workspace

# 파이썬 버퍼링 비활성화 (로그가 실시간으로 터미널에 찍히도록 설정)
ENV PYTHONUNBUFFERED=1

# 의존성 파일 먼저 복사 및 설치 (도커 레이어 캐시 활용으로 빌드 속도 향상)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 프로젝트 전체 소스 코드 복사 (.dockerignore에 지정된 파일은 제외)
COPY . .

# Flask 서버 실행 명령 (run.py가 진입점일 경우)
CMD ["python", "run.py"]

