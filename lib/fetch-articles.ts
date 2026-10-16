// Design Ref: §3.1 단계 2, §5.4 — 뉴스 검색 API로 4개 경제지의 최근 기사를 가져온다 (서버 쪽 코드에서만 사용)
// Plan SC: 작업 3 — 4개 경제지에서 최근 7일 기사 목록 가져오기
//
// 이 파일은 서버에서만 부른다. 인증 값(NAVER_CLIENT_ID, NAVER_CLIENT_SECRET)을 읽기 때문이다.
import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import type { Article, Source } from "./types";

/** 허용 도메인: 이 주소의 기사만 쓴다 (https만). 아시아경제는 view.asiae.co.kr로 오는 기사가 있다 */
const ALLOWED_HOSTS: { host: string; source: Source }[] = [
  { host: "hankyung.com", source: "한국경제" },
  { host: "sedaily.com", source: "서울경제" },
  { host: "asiae.co.kr", source: "아시아경제" },
  { host: "mk.co.kr", source: "매일경제" },
];

// NAVER API HUB(네이버 클라우드)의 뉴스 검색 주소. 예전 openapi.naver.com 방식과 주소·헤더가 다르다
const NAVER_NEWS_URL = "https://naverapihub.apigw.ntruss.com/search/v1/news";
const PAGE_SIZE = 100; // 한 번에 가져올 수 있는 최대 건수
const MAX_PAGES = 5; // 검색어 하나당 최대 500건까지만 본다 (시간·비용 제한)
const REQUEST_TIMEOUT_MS = 5000; // 요청 하나당 5초 제한
const IMAGE_PARALLEL = 5; // 대표 이미지를 찾을 때 기사 페이지 접속은 5개씩
const MAX_PARALLEL_QUERIES = 6; // 검색어는 6개씩 나눠서 요청한다

/** 네이버 뉴스 검색 결과 한 건 (우리가 쓰는 칸만) */
export type NaverNewsItem = {
  title: string;
  originallink: string;
  description: string;
  pubDate: string;
};

/** 설정이 비어 있거나 수집에 실패했을 때 던지는 오류. 화면에는 message(한국어)만 보낸다 */
export class FetchArticlesError extends Error {}

/** 일시적인 연결 오류·시간 초과·서버 혼잡. 이 검색어만 건너뛰고 나머지로 계속한다 */
class TransientSearchError extends Error {}

const SEARCH_RETRIES = 2; // 일시적 오류는 두 번까지 다시 시도한다
const RETRY_DELAY_MS = 400;

/** 네이버 검색 한 번 요청. 연결 오류·시간 초과·429·5xx는 잠깐 쉬고 다시 시도한다 */
async function fetchSearchPage(
  url: string,
  headers: Record<string, string>,
): Promise<NaverNewsItem[]> {
  for (let attempt = 0; ; attempt += 1) {
    let transient = false;
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: "no-store",
      });
      if (res.ok) return ((await res.json()) as { items?: NaverNewsItem[] }).items ?? [];
      // 오류 내용(키 일부 등)은 그대로 내보내지 않고 상태 코드만 남긴다
      console.error(`뉴스 검색 실패: 상태 코드 ${res.status}`);
      if (res.status !== 429 && res.status < 500) {
        // 키·권한·요청 문제는 다시 해도 같으므로 바로 멈춘다
        throw new FetchArticlesError("뉴스 검색 연결 설정을 확인해 주세요.");
      }
      transient = true;
    } catch (error) {
      if (error instanceof FetchArticlesError) throw error;
      console.error("뉴스 검색 실패: 연결 오류 또는 시간 초과");
      transient = true;
    }
    if (transient && attempt >= SEARCH_RETRIES) throw new TransientSearchError();
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
  }
}

/** 제목·요약에 섞인 <b> 같은 태그를 없애고 HTML 글자 코드를 원래 글자로 바꾼다 */
export function cleanText(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

/** 주소가 https이고 허용 도메인(하위 주소 포함)이면 매체 이름을, 아니면 null을 돌려준다 */
export function getAllowedSource(link: string): Source | null {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  // https의 기본 포트(443)만 허용한다. 다른 포트·계정 정보가 섞인 주소는 막는다
  if (url.protocol !== "https:" || url.port !== "" || url.username || url.password) return null;
  const hostname = url.hostname.toLowerCase();
  const found = ALLOWED_HOSTS.find(
    ({ host }) => hostname === host || hostname.endsWith(`.${host}`),
  );
  return found ? found.source : null;
}

/** 수치 표현: 숫자 + 단위 (금액·물량·비율 등) */
const FIGURE_PATTERN =
  /\d[\d,.]*\s*(조|억|만|천|%|퍼센트|달러|弗|불|원|톤|대|기|척|건|배럴|GW|MW)/gi;
const EXPORT_PATTERN = /수출|수주/g;

/** 수치가 "수출·수주"와 이 글자 수 안쪽에 붙어 있으면 관련 수치로 본다 */
const RELATED_DISTANCE = 30;

/**
 * 수출·수주와 관련된 수치(경제 지표)가 들어간 기사인지 판단한다.
 * 숫자가 있기만 해서는 안 되고, 그 수치가 "수출"·"수주"라는 말 근처(30글자 안)에 있어야 한다.
 * 예: "반도체 수출 5.2% 증가" → 관련 수치, "기업가치 83%는 재무제표에 없다" → 아님
 */
export function hasRelatedFigure(title: string, snippet: string): boolean {
  const text = `${title} | ${snippet}`;
  const keywords = [...text.matchAll(EXPORT_PATTERN)].map((m) => m.index ?? 0);
  if (keywords.length === 0) return false;
  const figures = [...text.matchAll(FIGURE_PATTERN)].map((m) => m.index ?? 0);
  return figures.some((figure) =>
    keywords.some((keyword) => Math.abs(figure - keyword) <= RELATED_DISTANCE),
  );
}

/**
 * 주소 끝에 네이버가 붙인 추적 표시(?ref=naver)를 없앤다.
 * 다른 주소 값은 건드리지 않는다. 주소로 읽을 수 없으면 그대로 돌려준다.
 */
export function cleanUrl(link: string): string {
  try {
    const url = new URL(link);
    if (url.searchParams.get("ref") !== "naver") return link;
    url.searchParams.delete("ref");
    return url.toString();
  } catch {
    return link;
  }
}

/** 검색 결과 한 건을 Article로 바꾼다. 허용되지 않는 주소나 날짜 오류는 null */
export function toArticle(item: NaverNewsItem): Article | null {
  const url = cleanUrl(item.originallink);
  const source = getAllowedSource(url);
  if (!source) return null;

  const published = new Date(item.pubDate);
  if (Number.isNaN(published.getTime())) return null;

  const title = cleanText(item.title);
  if (!title) return null;

  const snippet = cleanText(item.description);
  return {
    id: createHash("sha1").update(url).digest("hex").slice(0, 16),
    title,
    url,
    source,
    publishedAt: published.toISOString(),
    hasNumber: hasRelatedFigure(title, snippet),
    isExpanded: false,
    snippet,
  };
}

/** 검색어 하나로 since(수집 시작 시각) 이후 기사를 모은다. 최신순이라 오래된 기사가 나오면 멈춘다 */
async function searchOne(query: string, since: Date): Promise<Article[]> {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) {
    throw new FetchArticlesError("뉴스 검색 연결 설정이 필요해요.");
  }

  const found: Article[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = new URLSearchParams({
      query,
      display: String(PAGE_SIZE),
      start: String(page * PAGE_SIZE + 1),
      sort: "date",
    });

    const items = await fetchSearchPage(`${NAVER_NEWS_URL}?${params}`, {
      "X-NCP-APIGW-API-KEY-ID": id,
      "X-NCP-APIGW-API-KEY": secret,
    });

    if (items.length === 0) break;

    for (const item of items) {
      const article = toArticle(item);
      if (article && new Date(article.publishedAt) >= since) found.push(article);
    }

    // 최신순이므로 이 쪽에서 가장 오래된 기사가 기간 밖이면 더 볼 필요가 없다
    const oldest = new Date(items[items.length - 1].pubDate);
    if (oldest < since) break;
  }
  return found;
}

/**
 * 키워드마다 매체 이름을 붙인 검색어를 만든다. 예: "수출 한국경제"
 * ("수출"만 검색하면 전체 언론사 최신 기사 500건이 하루도 안 되는 기간이라 7일치가 모이지 않는다)
 */
export function buildQueries(keywords: string[]): string[] {
  return keywords.flatMap((keyword) =>
    ALLOWED_HOSTS.map(({ source }) => `${keyword} ${source}`),
  );
}

/** 수출·금융 지원 행사 기사를 찾기 위한 검색 키워드 */
export const EVENT_KEYWORDS = [
  "수출 설명회",
  "수출 상담회",
  "금융 설명회",
  "무역사절단",
  "수출 박람회",
];

/**
 * 4개 경제지의 since 이후 기사 목록과, 일시적 오류로 건너뛴 검색어 수를 돌려준다.
 * 검색어마다 따로 찾은 뒤 같은 주소는 한 건으로 합친다. 중복 사건 제거는 작업 5에서 한다.
 * 일부 검색어만 실패하면 나머지 결과로 계속하고, 전부 실패하면 오류를 던진다.
 */
export async function fetchArticlesWithStats(
  queries: string[],
  since: Date,
): Promise<{ articles: Article[]; failedQueries: number }> {
  // 검색어가 많아도 한꺼번에 몰아서 요청하지 않는다 (네이버의 초당 호출 제한을 넘지 않게 6개씩)
  const results: Article[][] = [];
  let failedQueries = 0;
  for (let i = 0; i < queries.length; i += MAX_PARALLEL_QUERIES) {
    const batch = queries.slice(i, i + MAX_PARALLEL_QUERIES);
    const settled = await Promise.all(
      batch.map((q) =>
        searchOne(q, since).catch((error: unknown) => {
          if (error instanceof TransientSearchError) return null;
          throw error;
        }),
      ),
    );
    for (const found of settled) {
      if (found === null) failedQueries += 1;
      else results.push(found);
    }
  }
  if (queries.length > 0 && failedQueries === queries.length) {
    throw new FetchArticlesError(
      "기사를 가져오지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.",
    );
  }
  const byId = new Map<string, Article>();
  for (const article of results.flat()) byId.set(article.id, article);
  return {
    articles: [...byId.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    failedQueries,
  };
}

/** 기사 목록만 필요할 때 쓰는 간단한 형태 */
export async function fetchArticles(queries: string[], since: Date): Promise<Article[]> {
  return (await fetchArticlesWithStats(queries, since)).articles;
}

// ---------------------------------------------------------------------------
// 잘린 제목 채우기: 네이버 검색 결과는 긴 제목을 "..." 로 자르므로, 기사 페이지의 제목으로 되돌린다
// ---------------------------------------------------------------------------

const PAGE_TIMEOUT_MS = 5000; // 기사 페이지 요청 하나당 5초 제한
const PAGE_MAX_BYTES = 1024 * 1024; // 1MB까지만 읽는다
const PAGE_MAX_REDIRECTS = 3;

/** 제목이 "..." 또는 "…" 로 끝나면 검색 결과에서 잘린 제목으로 본다 */
export function isTruncatedTitle(title: string): boolean {
  return /(\.{2,}|…)\s*$/.test(title);
}

/** 글자·숫자만 남긴다 (제목이 같은 기사인지 느슨하게 비교할 때 쓴다) */
function lettersOnly(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, "");
}

/** 기사 페이지 HTML에서 제목(og:title)을 꺼낸다. 없으면 null */
export function extractPageTitle(html: string): string | null {
  const $ = cheerio.load(html);
  const title = $('meta[property="og:title"]').attr("content")?.trim();
  return title ? cleanText(title) : null;
}

/**
 * 잘린 제목(truncated)과 페이지 제목(full)이 같은 기사의 제목인지 확인한다.
 * 잘린 제목에서 끝의 "..."을 뺀 앞부분이 페이지 제목의 앞부분과 같으면 맞다.
 * (엉뚱한 페이지의 제목으로 바꿔 쓰는 것을 막기 위한 안전 확인)
 */
export function isSameTitle(truncated: string, full: string): boolean {
  const head = lettersOnly(truncated.replace(/(\.{2,}|…)\s*$/, ""));
  return head.length >= 5 && lettersOnly(full).startsWith(head);
}

/** 허용 도메인(https)의 기사 페이지만 읽는다. 다른 주소로 넘기면(리다이렉트) 그 주소도 검사하고, 크기·시간을 제한한다 */
async function fetchAllowedHtml(url: string): Promise<string | null> {
  let current = url;
  for (let hop = 0; hop <= PAGE_MAX_REDIRECTS; hop += 1) {
    if (!getAllowedSource(current)) return null;

    const res = await fetch(current, {
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
      cache: "no-store",
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return null;
      current = new URL(location, current).toString();
      continue;
    }
    if (!res.ok || !res.body) return null;
    if (!(res.headers.get("content-type") ?? "").includes("html")) return null;

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < PAGE_MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
    }
    await reader.cancel().catch(() => {});
    return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
  }
  return null;
}

/**
 * 제목이 잘린 기사는 기사 페이지의 제목으로 바꾼다. 가져오지 못하거나(예: 차단) 같은 기사로
 * 확인되지 않으면 잘린 제목을 그대로 둔다. 제목이 멀쩡한 기사는 페이지를 읽지 않는다.
 */
export async function completeTitles(articles: Article[]): Promise<Article[]> {
  return Promise.all(
    articles.map(async (article) => {
      if (!isTruncatedTitle(article.title)) return article;
      try {
        const html = await fetchAllowedHtml(article.url);
        const full = html ? extractPageTitle(html) : null;
        if (full && isSameTitle(article.title, full)) {
          return { ...article, title: full };
        }
      } catch {
        // 연결 오류·시간 초과는 조용히 넘기고 잘린 제목을 쓴다
      }
      return article;
    }),
  );
}

/**
 * 우선순위 순서로 정렬된 기사에서 count건을 고른다. 제목을 끝까지 가져오지 못한 기사
 * (예: 매일경제처럼 페이지가 막혀 잘린 제목 그대로인 기사)는 빼고, 그 자리는 다음 기사로 채운다.
 * - taken: 고른 기사 (제목이 온전한 것만)
 * - reserve: 아직 보지 않은 나머지 기사 (우선순위 순)
 */
export async function takeWithFullTitles(
  ordered: Article[],
  count: number,
): Promise<{ taken: Article[]; reserve: Article[] }> {
  const taken: Article[] = [];
  let next = 0;
  while (taken.length < count && next < ordered.length) {
    const batch = ordered.slice(next, next + (count - taken.length));
    next += batch.length;
    for (const article of await completeTitles(batch)) {
      if (!isTruncatedTitle(article.title)) taken.push(article);
    }
  }
  return { taken, reserve: ordered.slice(next) };
}

/** 기사 페이지의 대표 이미지(og:image) 주소를 찾는다. 허용한 4개 매체 도메인의 https 주소만 돌려주고, 없으면 null */
export function extractImageUrl(html: string, pageUrl: string): string | null {
  const $ = cheerio.load(html);
  const raw =
    $('meta[property="og:image"]').attr("content") ??
    $('meta[name="twitter:image"]').attr("content");
  if (!raw) return null;
  try {
    const url = new URL(raw.trim(), pageUrl);
    // 이미지도 허용한 4개 매체의 도메인일 때만 쓴다 (다른 사이트로 접속시키는 그림 주소는 버린다)
    return getAllowedSource(url.toString()) ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * 기사 주소별 대표 이미지 주소를 모아 돌려준다. 이미지 파일은 저장하지 않고 주소만 쓴다.
 * 허용된 4개 매체 주소만 읽고, 가져오지 못한 기사는 결과에서 빠진다(화면이 기본 그림을 보여 준다).
 */
export async function fetchImageUrls(urls: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  // 언론사 서버에 한꺼번에 몰리지 않게 5개씩 나눠서 접속한다
  for (let i = 0; i < urls.length; i += IMAGE_PARALLEL) {
    await Promise.all(
      urls.slice(i, i + IMAGE_PARALLEL).map(async (url) => {
        try {
          const html = await fetchAllowedHtml(url);
          const image = html ? extractImageUrl(html, url) : null;
          if (image) result[url] = image;
        } catch {
          // 연결 오류·시간 초과는 조용히 넘긴다
        }
      }),
    );
  }
  return result;
}
