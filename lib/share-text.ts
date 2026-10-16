// Design Ref: §3.1 단계 10 — 공유용 글(텔레그램에 붙여넣을 내용) 만들기
// Plan SC: 작업 8 — 담당자 양식 그대로 번호·제목·(날짜 매체)·링크를 조립한다
import type { Article } from "./types";

/** 공유용 글 맨 위 제목 줄 (가운뎃점 • 을 쓴다) */
export const SHARE_TITLE = "[수출•수주 동향 기사]";

/** 기사 발행일을 한국 시간 기준 "YY.M.D." 로 바꾼다. 예: 26.10.7. */
export function formatArticleDate(publishedAt: string): string {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "2-digit",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(publishedAt));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}.${pick("month")}.${pick("day")}.`;
}

/**
 * 공유용 글을 만든다. 형식:
 *
 *   [수출•수주 동향 기사]
 *   26.10.12. 월(10.6.-10.12. 오전)
 *
 *   1. 기사 제목 (26.10.7. 매일경제)
 *   https://기사-원문-주소
 *
 *   2. ...
 *
 * - 기사는 받은 순서대로 번호를 붙인다 (순서는 rank.ts가 정한다).
 * - 제목은 원문 그대로 쓰고, 링크는 기사에 담긴 원문 주소 그대로 쓴다.
 * - 요약·배지는 넣지 않는다 (화면에서만 보인다).
 */
export function buildShareText(dateLine: string, articles: Article[]): string {
  const items = articles.map(
    (article, index) =>
      `${index + 1}. ${article.title} (${formatArticleDate(article.publishedAt)} ${article.source})\n${article.url}`,
  );
  const header = [SHARE_TITLE, dateLine];
  return items.length === 0
    ? header.join("\n")
    : [...header, "", items.join("\n\n")].join("\n");
}
