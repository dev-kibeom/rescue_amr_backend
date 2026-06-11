import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://amr_flask_server:8001',
        changeOrigin: true,
      },
      // 💡 [근본 해결]: 도커 내부 리액트가 호스트 PC의 생(Standalone) WebRTC 노드와 통신할 수 있는 포탈 개설
      '/webrtc': {
        target: 'http://host.docker.internal:8002', // 호스트 PC 로컬의 8002번 포트 바인딩 타겟팅
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/webrtc/, '') // /webrtc 문자열을 날리고 뒤의 /offer 구문만 토스
      }
    }
  }
})