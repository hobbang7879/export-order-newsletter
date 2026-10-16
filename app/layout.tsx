import type { Metadata } from "next";
import "./globals.css";

const TITLE = "수출·수주 주간 뉴스레터";
const DESCRIPTION =
  "경제지 4곳의 수출·수주 기사 10건을 골라 쉬운 말로 풀어 주고, 공유용 글과 지원 안내까지 만들어 주는 주간 뉴스레터";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // 링크를 메신저(텔레그램·카카오톡 등)에 붙였을 때 보이는 제목과 설명
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: TITLE,
    locale: "ko_KR",
    type: "website",
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
  // 검색엔진에는 노출하지 않는다 (링크를 아는 사람이 직접 여는 용도)
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
