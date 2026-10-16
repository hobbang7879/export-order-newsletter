// API 남용 방지: 같은 사이트 화면에서 온 요청인지 확인하고, 호출 횟수에 상한을 둔다.
// 호출 횟수는 서버 메모리에 세므로 서버가 새로 뜨면 0으로 돌아간다(서버리스에서는 완전한 제한이 아님).
// 운영 주소 접근 보호(Vercel Deployment Protection)와 API 사용량 한도 설정이 함께 필요하다.

/** 같은 사이트(우리 화면)에서 보낸 요청이면 true. curl·다른 사이트의 몰래 호출은 막는다 */
export function isSameOriginRequest(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  // Sec-Fetch-Site를 보내지 않는 환경은 Origin이 접속한 주소(Host)와 같을 때만 허용한다
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export type Limiter = { tryAcquire: () => boolean; release: () => void };

/**
 * 호출 상한 + 동시 실행 제한.
 * - windowMs 동안 max번까지만 허용한다.
 * - maxConcurrent보다 많은 요청이 동시에 돌지 않게 한다.
 */
export function createLimiter(options: {
  max: number;
  windowMs: number;
  maxConcurrent: number;
}): Limiter {
  let windowStart = Date.now();
  let count = 0;
  let running = 0;
  return {
    tryAcquire() {
      const now = Date.now();
      if (now - windowStart >= options.windowMs) {
        windowStart = now;
        count = 0;
      }
      if (count >= options.max || running >= options.maxConcurrent) return false;
      count += 1;
      running += 1;
      return true;
    },
    release() {
      running = Math.max(0, running - 1);
    },
  };
}
