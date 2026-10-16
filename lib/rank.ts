// Design Ref: §3.1 단계 6·8 — 우선순위로 10건 고르기, 나머지는 교체용 예비
// Plan SC: 작업 6 — 구성(수치 기사 최대 2건, 수출 지원 행사 기사 우선) + 최신 → 여러 매체 → 신규 사례, 고른 뒤 발행일 이른 순 나열
import type { Article, ArticleKind } from "./types.ts";
import { isExportEvent } from "./filter.ts";

/** 한 번에 고르는 기사 수 */
export const TARGET_COUNT = 10;

/** 수출·수주 관련 수치(%, 금액 등) 기사는 이 건수까지만 먼저 고른다 (나머지 자리는 다른 기사로 채운다) */
export const FIGURE_LIMIT = 2;

/** 수출 지원 행사 기사를 가장 먼저, 그다음 수치 기사로 보고 나머지는 "기타"로 둔다 */
export function articleKind(article: Article): ArticleKind {
  if (isExportEvent(article)) return "event";
  return article.hasNumber ? "figure" : "other";
}

/** 신규 사례(첫 진출·최초 수주 등)를 뜻하는 말. 제목에 있으면 신규 사례로 본다 */
const NEW_CASE_PATTERN = /첫|최초|처음|신규\s?(진출|수주|계약|수출)/;

/** 제목으로 신규 사례인지 판단한다 */
export function isNewCase(title: string): boolean {
  return NEW_CASE_PATTERN.test(title);
}

/** 발행일을 한국 시간 기준 "YYYY-MM-DD"로 바꾼다 (같은 날 기사끼리 묶기 위해) */
function koreaDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

const flag = (value: boolean) => (value ? 1 : 0);

/**
 * 같은 종류 안에서의 우선순위 비교 (앞에 올 기사가 음수).
 * ① 최신 기사가 먼저 (같은 날이면 같은 순위. 그래야 아래 기준이 힘을 가진다)
 * ② 여러 매체가 다룬 기사가 먼저
 * ③ 신규 사례가 먼저
 * ④ 제목에 "수출"·"수주"가 직접 있는 기사가 먼저
 * ⑤ 발행 시각이 늦은(최신) 기사가 먼저
 */
function compare(a: Article, b: Article): number {
  const dayA = koreaDay(a.publishedAt);
  const dayB = koreaDay(b.publishedAt);
  if (dayA !== dayB) return dayA < dayB ? 1 : -1;

  const bySources = (b.sourceCount ?? 1) - (a.sourceCount ?? 1);
  if (bySources !== 0) return bySources;

  const byNewCase = flag(isNewCase(b.title)) - flag(isNewCase(a.title));
  if (byNewCase !== 0) return byNewCase;

  const byTitleKeyword =
    flag(/수출|수주/.test(b.title)) - flag(/수출|수주/.test(a.title));
  if (byTitleKeyword !== 0) return byTitleKeyword;

  return b.publishedAt.localeCompare(a.publishedAt);
}

export type RankResult = {
  /** 고른 기사 (최대 count건, 발행이 이른 순서. 화면과 공유용 글에 이 순서로 쓴다) */
  selected: Article[];
  /** 남은 기사 (우선순위 순). 기사 1건 교체할 때 앞에서부터 쓴다 */
  reserve: Article[];
};

/**
 * 고르는 순서(우선순위)로 정렬한 새 배열을 돌려준다. 원래 배열은 바꾸지 않는다.
 * 1) 수치 기사는 FIGURE_LIMIT(2)건까지만 먼저
 * 2) 수출 지원 행사 기사 (설명회·상담회·박람회 등)
 * 3) 그 밖의 수출·수주 소식
 * 4) 확장 키워드로 채운 기사 (정확히 맞는 기사가 모자랄 때만 들어간다)
 * 5) 남은 수치 기사 (그래도 자리가 모자랄 때만 마지막에 채운다)
 * 각 묶음 안에서는 compare() 순서를 따른다.
 */
export function sortByPriority(articles: Article[]): Article[] {
  const groups: Record<ArticleKind, Article[]> = { event: [], figure: [], other: [] };
  const expanded: Article[] = [];
  for (const article of [...articles].sort(compare)) {
    if (article.isExpanded) expanded.push(article);
    else groups[articleKind(article)].push(article);
  }
  return [
    ...groups.figure.slice(0, FIGURE_LIMIT),
    ...groups.event,
    ...groups.other,
    ...expanded,
    ...groups.figure.slice(FIGURE_LIMIT),
  ];
}

/**
 * 고른 기사 중 확장 키워드로 채운 기사가 있으면 화면에 보여 줄 안내 문구를 만든다. 없으면 undefined.
 * 예: "7건은 키워드에 정확히 맞는 기사이고, 나머지 3건은 범위를 넓혀 채웠어요."
 */
export function buildFillNotice(selected: Article[]): string | undefined {
  const expandedCount = selected.filter((article) => article.isExpanded).length;
  if (expandedCount === 0) return undefined;
  return `${selected.length - expandedCount}건은 키워드에 정확히 맞는 기사이고, 나머지 ${expandedCount}건은 범위를 넓혀 채웠어요.`;
}

/** 발행이 이른 순서로 정렬한 새 배열을 돌려준다. 발행 시각이 같으면 원래 순서를 지킨다 */
export function sortByDate(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
}

/**
 * 우선순위로 앞 count건을 "고르고", 고른 기사는 발행이 이른 순서로 "보여 준다".
 * (담당자 양식은 날짜가 이른 기사부터 나열한다.) 나머지는 우선순위 순서의 예비로 둔다.
 * 원래 배열은 바꾸지 않는다.
 */
export function rankArticles(
  articles: Article[],
  count: number = TARGET_COUNT,
): RankResult {
  const byPriority = sortByPriority(articles);
  return {
    selected: sortByDate(byPriority.slice(0, count)),
    reserve: byPriority.slice(count),
  };
}
