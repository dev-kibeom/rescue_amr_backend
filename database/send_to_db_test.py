import requests

# 1. FastAPI 서버 주소 (robot1의 성공 신호)
url = "http://127.0.0.1:8001/api/robots/robot1/nav_success"

# 2. 보낼 데이터 (Pydantic 모델인 NavSuccessRequest 형식에 맞춤)
data = {"x": 3.14, "y": -1.59, "message": "Nav2 Goal Reached: 301호 도착 완료 (테스트)"}

# 3. HTTP POST 요청 전송
try:
    response = requests.post(url, json=data)
    print("상태 코드:", response.status_code)
    print("응답 내용:", response.json())
except Exception as e:
    print("전송 실패:", e)
