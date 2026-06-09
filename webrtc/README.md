# webrtc/ — 라이브 평면(WebRTC + 시그널링) 재사용 베이스

기존 검증 자산에서 가져온 **시작점**. 수정 가이드: [docs/WEBRTC_REUSE.md](../docs/WEBRTC_REUSE.md) · 방식: [docs/COMMUNICATION.md](../docs/COMMUNICATION.md) §8.

| 파일 | 역할 | 즉시 수정 |
| --- | --- | --- |
| `signaling_server.py` | Flask HTTP 폴링 시그널링(`/offer`·`/answer`·`/clear`) | 🟢 그대로 동작 → **로그인 게이트 추가** + Railway 배포 |
| `webrtc_vision_server.py` | 영상+박스 송신(aiortc) | 🟡 카메라 `/annotated_frame`(RealSense) → **로봇 카메라 토픽**, bbox 포맷 → **track_id·source_w/h**, room 이름 |
| `webrtc_server.py` | DataChannel 송신 | 🔴 제스처·음성·`get_current_posx` 제거 → **pose(`/tf`)·지도(`/map`) DataChannel** |
| `jarvis_helpers.sh` | 대기 헬퍼 | 🟢 그대로 |
| `jarvis_ros.sh` | ROS 기동 | 🟡 RealSense launch → **로봇 센서 launch(D4)**, `jarvis_bringup`→`rescue_bringup` |
| `jarvis_web.sh` | 웹서버 기동 | 🟡 서버 파일명·Vite 경로 |
| `jarvis_start.sh` | 전체 기동 | 🟡 pkill 패턴·노드명 rescue로 |

> ICE_SERVERS(STUN + Open Relay TURN:80/:443)는 두 서버에 그대로 유지. `*.sh`는 추후 `rescue_*`로 리네임 예정.
