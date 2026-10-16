import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// 화면이 불러올 수 있는 곳을 우리 서버와 4개 매체(기사 대표 이미지)로 제한한다.
// 페이지가 정적이라 nonce를 쓸 수 없어 script·style에는 'unsafe-inline'을 둔다 (개발 중에는 'unsafe-eval'도 필요).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.hankyung.com https://*.mk.co.kr https://*.sedaily.com https://*.asiae.co.kr",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  // 보안 헤더: 다른 사이트가 이 화면을 몰래 끼워 넣지 못하게 하고, 파일 형식을 속이지 못하게 한다
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: csp },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
