import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "수출·수주 주간 뉴스레터",
  description: "수출플러스지원단 주간 뉴스 스크랩 도우미",
  // 내부용 도구이므로 검색엔진에 노출되지 않게 한다
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
