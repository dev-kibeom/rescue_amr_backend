const isDev = import.meta.env.DEV;

export const logger = {
  info: (...args) => isDev && console.log("📘 [ARES-INFO]:", ...args),
  warn: (...args) => isDev && console.warn("🟠 [ARES-WARN]:", ...args),
  error: (...args) => console.error("🔴 [ARES-CRITICAL]:", ...args), // 에러는 프로덕션에서도 전송/출력하도록 보존
};