"use client";

import type { ReactNode } from "react";

function isHttps(href: string): boolean {
  try {
    return new URL(href).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * 새 탭으로 여는 링크. 화면의 모든 바깥 링크는 이 부품을 쓴다.
 * 기본 설정(target="_blank")에 더해, 눌렀을 때 window.open으로 새 탭을 직접 열어
 * 환경에 따라 현재 탭에서 열리는 일을 막는다. 현재 뉴스레터 탭은 그대로 남는다.
 */
export default function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={(event) => {
        // https 주소만 직접 연다. 그 밖의 주소(javascript: 등)는 열지 않는다
        event.preventDefault();
        if (isHttps(href)) window.open(href, "_blank", "noopener,noreferrer");
      }}
    >
      {children}
    </a>
  );
}
