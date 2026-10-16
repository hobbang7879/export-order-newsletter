import type { Agency } from "./agencies.ts";
import type { SupportGuide } from "./support.ts";

// Design Ref: §3.4 — 화면과 서버가 함께 쓰는 데이터 모양 (기사 처리 코드의 기초)
// Plan SC: 작업 1 — 기사 한 건의 데이터 모양 정하기

/** 수집 대상 경제지 4곳 (PRD 6번에서 확정, 추가 매체는 만들지 않는다) */
export const SOURCES = [
  "매일경제",
  "한국경제",
  "서울경제",
  "아시아경제",
] as const;

export type Source = (typeof SOURCES)[number];

/** 기사 한 건 */
export type Article = {
  /** 링크를 기준으로 만든 고유값 (중복·교체 때 같은 기사인지 구분) */
  id: string;
  /** 기사 제목. 원문 그대로 쓰고 바꾸거나 줄이지 않는다 */
  title: string;
  /** 실제 기사 원문 주소. 만들어 내지 않는다 */
  url: string;
  source: Source;
  /** 발행 시각 (ISO 8601 문자열) */
  publishedAt: string;
  /** 수출·수주와 관련된 수치(금액·물량·비율 등)가 들어간 기사인지 */
  hasNumber: boolean;
  /** "수출"·"수주" 대신 확장 키워드로 채운 기사인지 */
  isExpanded: boolean;
  /** 같은 사건을 다룬 매체 수 (중복 제거 뒤에 채워진다. "여러 매체가 다룬 기사" 우선순위에 쓴다) */
  sourceCount?: number;
  /** 검색 결과에 딸려 온 기사 앞부분 (키워드 확인용). 서버 안에서만 쓰고 화면으로 보내지 않는다 */
  snippet?: string;
  /** 화면에 보여 줄 요약 (2문장·100자 이내). 공유용 글에는 넣지 않는다 */
  summary?: string;
};

/** 기사 종류: 수출 지원 행사 / 수출·수주 관련 수치(지표) / 그 밖의 수출·수주 소식 */
export type ArticleKind = "event" | "figure" | "other";

/** 기사 한 건에 붙이는 쉬운 말 해설 (뉴닉 같은 구성). AI가 제목과 기사 앞부분만 보고 쓴다 */
export type Explainer = {
  /** 기사 분위기에 맞는 이모지 */
  emoji: string;
  /** 쉬운 말로 풀어 쓴 한 줄 제목 */
  easy: string;
  /** "뭐라고?" — 무슨 내용인지 */
  what: string;
  /** "왜 중요해?" — 수출·수주 기업을 돕는 입장에서 왜 눈여겨볼지 */
  why: string;
  /** 원문 보기 옆에 보여 주는 한 줄 요약(핵심 사실만). 검사를 통과하지 못하면 없다 */
  summary?: string;
};

/** 화면으로 보내는 기사. 서버 안에서만 쓰는 snippet(기사 앞부분)은 빼고, 종류와 해설을 붙인다 */
export type ClientArticle = Omit<Article, "snippet"> & {
  kind: ArticleKind;
  /** 해설을 만들지 못했으면 없다 */
  explain?: Explainer;
  /** 이 기사와 관련된 지원단 지원 분야 (SupportGuide.id). 관련 분야가 없으면 빈 배열 */
  supportIds: string[];
  /** 기사에 이름이 나온 협력기관 (Agency.id). 없으면 빈 배열 */
  agencyIds: string[];
  /** 기사 속 지역으로 찾은 권역 (Region.id). 지역을 찾지 못하면 null */
  regionId: string | null;
};

/** 이번 뉴스레터 기사에 이름이 나온 협력기관 한 곳과, 관련된 기사 번호 */
export type AgencySummary = {
  agency: Agency;
  articleNumbers: number[];
};

/** 이번 뉴스레터 기사들과 관련된 지원 안내 한 분야와, 관련된 기사 번호 */
export type SupportSummary = {
  guide: SupportGuide;
  /** 공유용 글의 기사 번호와 같은 번호 */
  articleNumbers: number[];
};

/** 기사 선별 API(POST /api/newsletter)의 응답 */
export type NewsletterResponse = {
  /** 예: "26.10.15. 목(10.8.-10.15. 오전)" */
  dateLine: string;
  /** 선별된 기사 (최대 10건, 발행이 이른 순서) */
  articles: ClientArticle[];
  /** 교체용 예비 기사 (요약 없음) */
  reserve: ClientArticle[];
  /** 기사와 관련된 지원단 지원 안내 (기사 수가 많은 분야부터) */
  support: SupportSummary[];
  /** 기사에 이름이 나온 협력기관 (기사 수가 많은 기관부터) */
  agencies: AgencySummary[];
  /** 공유용 글 (텔레그램에 붙여넣을 내용) */
  shareText: string;
  /** "8건만 찾았어요" 같은 안내 문구 */
  notice?: string;
};

/** 요약 API(POST /api/summarize)의 요청 */
export type SummarizeRequest = {
  title: string;
  url: string;
};

/** 요약 API의 응답 */
export type SummarizeResponse = {
  summary: string;
};

/** API 오류 응답. error에는 사용자에게 보여 줄 한국어 안내 문구를 담는다 */
export type ApiError = {
  error: string;
};
