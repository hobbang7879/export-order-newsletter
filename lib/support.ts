// Design Ref: §2 — 기사와 관련된 수출 플러스 지원단 지원 페이지 안내
// 지원단 누리집(export119.go.kr)의 "수출 지원 프로그램", "서비스 분야 수출 지원", "농수산식품 수출 지원" 페이지와
// 메뉴에 실제로 있는 주소만 사용한다. 기사 속 단어로 관련 분야를 찾는 규칙 방식이라 AI가 주소를 지어낼 수 없다.

const SITE = "https://www.export119.go.kr/?menucode=";

/** 지원단 누리집의 페이지 주소 (메뉴 번호는 누리집 메뉴에서 확인한 값) */
export const SUPPORT_PAGES = {
  programs: `${SITE}300100&tmenu=page`, // 수출 지원 프로그램
  service: `${SITE}20400&tmenu=content`, // 서비스 분야 수출 지원 프로그램
  agri: `${SITE}600700&tmenu=page`, // 농수산식품 수출 지원 프로그램
  trouble: `${SITE}10100&tmenu=bbs`, // 애로사항 접수
  events: `${SITE}20301&tmenu=bbs`, // 수출지원 사업·행사 실시간
  country: `${SITE}301000&tmenu=bbs`, // 국가별 법률·조세·바이어 정보
  order: `${SITE}80200&tmenu=content`, // 수주 지원 프로그램
  bids: `${SITE}20202&tmenu=bbs`, // 해외사업 발주·입찰정보
} as const;

export type SupportLink = { label: string; url: string };

export type SupportGuide = {
  id: string;
  emoji: string;
  title: string;
  /** 어떤 지원인지 쉬운 말 한 줄 (누리집 안내 기준) */
  description: string;
  links: SupportLink[];
  /** 기사의 제목·앞부분에 이 말이 있으면 관련 분야로 본다 */
  keywords: string[];
};

export const SUPPORT_GUIDES: SupportGuide[] = [
  {
    id: "agri",
    emoji: "🌾",
    title: "농수산식품 수출 지원",
    description: "K-푸드, 농산물, 수산식품 수출을 돕는 종합 지원 시스템으로 연결돼요.",
    links: [
      { label: "농수산식품 수출 지원 프로그램", url: SUPPORT_PAGES.agri },
      { label: "농산업수출종합지원시스템", url: "https://www.agroex.or.kr" },
      { label: "수산식품 수출지원 플랫폼", url: "https://www.k-seafoodtrade.kr/index.do" },
    ],
    keywords: ["K푸드", "K-푸드", "식품", "농산물", "농식품", "수산", "신선", "과일", "냉동", "베이커리", "라면", "쌀", "축산", "간편식", "한우", "인삼", "aT"],
  },
  {
    id: "finance",
    emoji: "💰",
    title: "정책금융 · 무역보험",
    description: "수출신용보증, 단기수출보험, 환변동보험, 수출입은행 수출자금 대출 등을 안내해요.",
    links: [{ label: "수출 지원 프로그램 (정책금융)", url: SUPPORT_PAGES.programs }],
    keywords: ["금융", "보증", "보험", "환율", "환변동", "대출", "정책자금", "수출입은행", "수은", "무역보험", "무보", "K-SURE", "신용보증"],
  },
  {
    id: "local",
    emoji: "🗺️",
    title: "지방정부 수출지원",
    description: "경기·강원·충북·충남·전북·전남·경북·경남·제주의 수출지원 사업과 신청 사이트를 모아 안내해요.",
    links: [{ label: "수출 지원 프로그램 (지방정부 수출지원)", url: SUPPORT_PAGES.programs }],
    keywords: ["경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주", "충청", "전라", "경상", "지자체", "지방정부", "산업단지", "산단", "지역 수출"],
  },
  {
    id: "buyer",
    emoji: "🤝",
    title: "바이어 매칭 · 전시회 · 수출바우처",
    description: "바이코리아, 해외지사화 사업, 글로벌 전시포털, 수출바우처 등 판로 개척 지원을 안내해요.",
    links: [{ label: "수출 지원 프로그램 (바이어·전시·바우처)", url: SUPPORT_PAGES.programs }],
    keywords: ["바이어", "상담회", "박람회", "전시회", "전시", "수출바우처", "바우처", "해외 마케팅", "온라인 수출", "해외지사", "무역사절단", "판로"],
  },
  {
    id: "service",
    emoji: "🎬",
    title: "서비스 분야 수출 지원",
    description: "콘텐츠, 정보보호, 핀테크, 에듀테크, 프랜차이즈 등 서비스 기업의 해외진출 지원 기관으로 연결돼요.",
    links: [{ label: "서비스 분야 수출 지원 프로그램", url: SUPPORT_PAGES.service }],
    keywords: ["콘텐츠", "드라마", "게임", "웹툰", "핀테크", "에듀테크", "프랜차이즈", "정보보호", "보안", "헬스케어", "서비스 수출", "서비스수출", "한류", "K콘텐츠", "K-콘텐츠", "영화", "K팝", "K-팝"],
  },
  {
    id: "rules",
    emoji: "🧭",
    title: "인증 · 물류 · FTA · 방산 정보",
    description: "해외 인증, 물류, FTA, 전략물자, 방산 수출 지원 정보를 테마별로 모아 안내해요.",
    links: [{ label: "수출 지원 프로그램 (테마별 주요 정보)", url: SUPPORT_PAGES.programs }],
    keywords: ["인증", "비관세", "관세", "물류", "운송", "선박", "FTA", "통관", "전략물자", "방산", "무기", "방위", "K2"],
  },
  {
    id: "order",
    emoji: "🏗️",
    title: "해외 수주 지원",
    description: "수주 지원 프로그램, 해외사업 발주·입찰정보, 수주 이후 애로를 돕는 해외건설협회 헬프데스크를 안내해요.",
    links: [
      { label: "수주 지원 프로그램", url: SUPPORT_PAGES.order },
      { label: "해외사업 발주·입찰정보", url: SUPPORT_PAGES.bids },
      { label: "해외건설협회 원스톱 헬프데스크", url: "https://www.icak.or.kr/board/main.php?bod=99" },
    ],
    keywords: ["수주", "해외건설", "플랜트", "건설", "원전", "입찰", "발주", "EPC", "인프라"],
  },
  {
    id: "country",
    emoji: "🌏",
    title: "국가별 법률 · 조세 · 바이어 정보",
    description: "진출하려는 나라의 법률, 세금, 바이어 정보를 게시판에서 찾아볼 수 있어요.",
    links: [{ label: "국가별 법률·조세·바이어 정보", url: SUPPORT_PAGES.country }],
    keywords: ["러시아", "중국", "미국", "일본", "베트남", "인도", "유럽", "중동", "사우디", "인도네시아", "말레이시아", "중남미", "브라질", "멕시코", "아세안", "태국", "폴란드", "호주"],
  },
  {
    id: "trouble",
    emoji: "🆘",
    title: "수출 애로사항 접수",
    description: "수출·수주 중 겪는 어려움(규제, 장벽, 제도 문제 등)을 지원단에 접수하고 해소를 요청할 수 있어요.",
    links: [{ label: "애로사항 접수", url: SUPPORT_PAGES.trouble }],
    keywords: ["애로", "장벽", "피해", "규제", "제도 개선", "제도개선", "관세 부과", "관세 폭탄"],
  },
];

/** 항상 보여 주는 지원단 바로가기 */
export const SUPPORT_SHORTCUTS: SupportLink[] = [
  { label: "수출 플러스 지원단 누리집", url: "https://www.export119.go.kr/" },
  { label: "애로사항 접수", url: SUPPORT_PAGES.trouble },
  { label: "수출지원 사업·행사 실시간", url: SUPPORT_PAGES.events },
  { label: "수출 지원 프로그램", url: SUPPORT_PAGES.programs },
  { label: "수주 지원 프로그램", url: SUPPORT_PAGES.order },
];

/** 지원단 대표전화 (누리집 하단 안내) */
export const SUPPORT_PHONE = "02-6000-5778";

/** 영어·숫자 약어("aT", "FTA")는 다른 영어 단어의 일부가 아닐 때만 맞는 것으로 본다 */
export function includesKeyword(text: string, keyword: string): boolean {
  if (/^[A-Za-z0-9-]+$/.test(keyword)) {
    const escaped = keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    return new RegExp(`(^|[^A-Za-z])${escaped}([^A-Za-z]|$)`).test(text);
  }
  return text.includes(keyword);
}

/** 기사 한 건과 관련된 지원 분야를 찾는다. 맞는 말이 많은 분야부터 최대 limit개 */
export function findSupportGuides(text: string, limit = 3): SupportGuide[] {
  return SUPPORT_GUIDES.map((guide, order) => ({
    guide,
    order,
    hits: guide.keywords.filter((keyword) => includesKeyword(text, keyword)).length,
  }))
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits || a.order - b.order)
    .slice(0, limit)
    .map((entry) => entry.guide);
}
