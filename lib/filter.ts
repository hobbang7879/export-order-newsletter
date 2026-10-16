// Design Ref: §3.1 단계 3·4 — 기간·키워드 거르기, 정치 견해·무관한 기사 제외
// Plan SC: 작업 4 — "수출"·"수주" 키워드가 제목·본문에 있는 기사만 걸러내기
import type { Article } from "./types";

/** 기사에 반드시 있어야 하는 키워드 */
export const KEYWORDS = ["수출", "수주"] as const;

/**
 * 오피니언 글 표시. 제목의 [대괄호] 안에 이런 말이 있으면 기자 보도가 아니라
 * 글쓴이의 견해를 담은 글로 보고 뺀다. 예: [사설], [김세형칼럼], [기자수첩]
 */
const OPINION_MARKERS = [
  "사설",
  "칼럼",
  "기고",
  "시론",
  "논단",
  "오피니언",
  "만평",
  "기자수첩",
  "데스크",
  "여적",
  "초동시각",
];

/**
 * 정치·견해가 섞일 여지가 있는 말. 제목이나 기사 앞부분에 하나라도 있으면 뺀다.
 * 정책 기사 자체는 빼지 않고, 정치 다툼·선거·정당과 얽힌 기사만 빼서 문제가 될 여지를 없앤다.
 */
const POLITICAL_WORDS = [
  "여당",
  "야당",
  "여야",
  "국민의힘",
  "더불어민주당",
  "민주당",
  "정당",
  "정치권",
  "정치인",
  "정권",
  "대선",
  "총선",
  "선거",
  "탄핵",
  "특검",
  "국정감사",
  "국감",
  "국회의원",
  "국회의장",
  "여론조사",
  "지지율",
  "개헌",
  "새정부",
  "새 정부",
  "김건희",
];

export type ExcludeReason =
  | "기간 밖"
  | "키워드 없음"
  | "오피니언·칼럼"
  | "정치 견해";

export type FilterResult = {
  /** 남은 기사 */
  kept: Article[];
  /** 빠진 기사와 이유 (왜 빠졌는지 담당자가 확인할 수 있게 남긴다) */
  excluded: { article: Article; reason: ExcludeReason }[];
};

/**
 * 수출 지원 행사를 뜻하는 말. 설명회·상담회·박람회처럼 기업이 수출·금융 도움을 직접 받는 자리를 넣는다.
 * "간담회"는 별도 규칙(isExportEvent)으로 다룬다. 막연한 "행사"는 수출과 상관없는 모임에도 쓰여서 일부러 뺐다.
 */
const EVENT_WORDS = [
  "설명회",
  "상담회",
  "박람회",
  "세미나",
  "로드쇼",
  "무역사절단",
];

/** 위 행사 말과 함께 있어야 수출·금융 지원 행사로 보는 말 */
const EVENT_CONTEXT = ["수출", "금융", "무역", "수주", "바이어"];

/**
 * 수출·금융 설명회, 수출 상담회, 박람회 같은 수출 지원 행사를 다룬 기사인지.
 * (수출플러스지원단이 기업의 수출·수주 애로를 돕기 위해 여는 행사와 같은 종류의 기사)
 */
export function isExportEvent(article: Article): boolean {
  const text = `${article.title} ${article.snippet ?? ""}`;
  if (
    EVENT_WORDS.some((word) => text.includes(word)) &&
    EVENT_CONTEXT.some((word) => text.includes(word))
  ) {
    return true;
  }
  // 간담회는 수출과 상관없는 모임(예: 경제단체 간담회)이 많아서, 제목에 수출·수주·무역이 직접 있을 때만 인정한다
  return (
    article.title.includes("간담회") &&
    ["수출", "수주", "무역"].some((word) => article.title.includes(word))
  );
}

/**
 * 지원단 업무 영역의 말: 수출금융, 무역보험, 해외건설·플랜트 수주, 방산·K-푸드·K-뷰티 같은 주력 수출 분야,
 * 수출 협력기관 이름. 제목에 이런 말이 있으면 "수출"·"수주"라는 단어가 없어도 지원단 업무와 관련된 기사로 본다.
 */
export const WORK_KEYWORDS = [
  "수출금융",
  "무역금융",
  "무역보험",
  "수출보험",
  "수출바우처",
  "수출입은행",
  "해외건설",
  "플랜트",
  "해외수주",
  "해외 수주",
  "방산 수출",
  "방산수출",
  "K방산",
  "K-방산",
  "K푸드",
  "K-푸드",
  "K뷰티",
  "K-뷰티",
  "KOTRA",
  "코트라",
  "무역협회",
  "무역보험공사",
  "중진공",
];

/** 제목에 지원단 업무 영역의 말이 있는지 */
export function hasWorkKeyword(article: Article): boolean {
  return WORK_KEYWORDS.some((word) => article.title.includes(word));
}

/**
 * 수출·수주와 직접 관련 있는 기사인지. 담당자가 만든 양식 예시(10건)의 기사들처럼
 * 제목에 "수출"·"수주"가 있거나, 수출·금융 지원 행사(설명회·상담회·박람회, 수출 간담회) 기사이거나,
 * 지원단 업무 영역(수출금융·해외건설·방산 등)의 말이 제목에 있어야 통과한다.
 * 앞부분에서 "수출"이 스치듯 언급된 정도의 기사는 통과하지 못한다.
 */
export function hasKeyword(article: Article): boolean {
  return keywordInTitle(article) || isExportEvent(article) || hasWorkKeyword(article);
}

/**
 * 제목에 "수출"·"수주"가 직접 있는지. 제목에 있으면 수출·수주가 주제인 확실한 후보이고,
 * 앞부분에만 있으면 스치듯 언급된 기사일 수 있어 우선순위를 뒤로 한다 (작업 6의 정렬에서 사용)
 */
export function keywordInTitle(article: Article): boolean {
  return KEYWORDS.some((keyword) => article.title.includes(keyword));
}

/** 제목에 오피니언 표시([사설], [OO칼럼] 등)가 있는지 */
export function isOpinion(title: string): boolean {
  const brackets = title.match(/\[[^\]]*\]/g) ?? [];
  return brackets.some((bracket) =>
    OPINION_MARKERS.some((marker) => bracket.includes(marker)),
  );
}

/** 제목 또는 기사 앞부분에 정치와 얽힌 말이 있는지 */
export function isPolitical(text: string): boolean {
  return POLITICAL_WORDS.some((word) => text.includes(word));
}

/**
 * 기간·키워드·성격으로 기사를 거른다.
 * - since~until이 수집 기간이다. until은 월요일이 아닌 날 실행해 공유 시각이 과거일 때 그 뒤 기사를 빼려고 쓴다.
 * - 수출·수주와 관련된 수치(경제 지표) 기사는 키워드가 있으면 그대로 남긴다.
 * - 한 기사가 여러 이유에 걸리면 앞의 이유 하나만 적는다.
 */
export function filterArticles(
  articles: Article[],
  since: Date,
  until?: Date,
): FilterResult {
  const kept: Article[] = [];
  const excluded: FilterResult["excluded"] = [];

  for (const article of articles) {
    let reason: ExcludeReason | null = null;
    const published = new Date(article.publishedAt);
    if (published < since || (until && published > until)) reason = "기간 밖";
    else if (!hasKeyword(article)) reason = "키워드 없음";
    else if (isOpinion(article.title)) reason = "오피니언·칼럼";
    else if (isPolitical(`${article.title} ${article.snippet ?? ""}`))
      reason = "정치 견해";

    if (reason) excluded.push({ article, reason });
    else kept.push(article);
  }
  return { kept, excluded };
}

/**
 * 확장 키워드: "수출"·"수주"가 제목에 없어도 수출·수주 소식에 자주 쓰이는 말.
 * 정확히 맞는 기사가 10건에 모자랄 때만 이 말이 제목에 든 기사로 부족분을 채운다.
 */
export const EXPANDED_KEYWORDS = [
  "진출",
  "납품",
  "공급 계약",
  "공급계약",
  "해외 공략",
  "해외 시장",
  "해외시장",
  "현지 공장",
  "현지 법인",
  "바이어",
  "수출길",
  "글로벌 시장",
];

/** 사업 소식이 아닌 기사(부고·사건 등)에 쓰이는 말. "진출" 같은 말이 우연히 들어가도 확장 후보에서 뺀다 */
const NON_BUSINESS_WORDS = ["별세", "영면", "부고", "사망", "숨진", "결혼", "열애"];

/**
 * 확장 키워드로 채울 후보를 고른다. (정확히 맞는 기사는 filterArticles의 몫이라 여기서 뺀다)
 * - 기간 안, 오피니언·정치 기사 아님, "수출·수주" 기준에는 안 맞지만 제목에 확장 키워드가 있음
 * - 돌려주는 기사에는 isExpanded: true 표시를 단다 (화면과 안내 문구에서 구분하기 위해)
 */
export function filterExpanded(
  articles: Article[],
  since: Date,
  until?: Date,
): Article[] {
  return articles
    .filter((article) => {
      const published = new Date(article.publishedAt);
      if (published < since || (until && published > until)) return false;
      if (hasKeyword(article)) return false;
      if (!EXPANDED_KEYWORDS.some((keyword) => article.title.includes(keyword))) {
        return false;
      }
      if (isOpinion(article.title)) return false;
      if (isPolitical(`${article.title} ${article.snippet ?? ""}`)) return false;
      if (NON_BUSINESS_WORDS.some((word) => article.title.includes(word))) return false;
      return true;
    })
    .map((article) => ({ ...article, isExpanded: true }));
}
