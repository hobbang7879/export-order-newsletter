// Design Ref: §3.1 — 기사 수집부터 공유용 글까지 한 번에 묶는 흐름 (서버 쪽 코드에서만 사용)
// Plan SC: 작업 10 — 위 과정을 묶는 함수 (AI 요약은 작업 9에서 추가)
import { dedupeArticles } from "./dedupe.ts";
import {
  buildQueries,
  EVENT_KEYWORDS,
  fetchArticlesWithStats,
  takeWithFullTitles,
} from "./fetch-articles.ts";
import {
  EXPANDED_KEYWORDS,
  WORK_KEYWORDS,
  filterArticles,
  filterExpanded,
} from "./filter.ts";
import { AGENCIES, findAgencies } from "./agencies.ts";
import { explainArticles } from "./explain.ts";
import { getPeriod } from "./period.ts";
import { findRegion } from "./regions.ts";
import { findSupportGuides, SUPPORT_GUIDES } from "./support.ts";
import {
  articleKind,
  buildFillNotice,
  sortByDate,
  sortByPriority,
  TARGET_COUNT,
} from "./rank.ts";
import { buildShareText } from "./share-text.ts";
import type {
  Article,
  ClientArticle,
  Explainer,
  AgencySummary,
  NewsletterResponse,
  SupportSummary,
} from "./types.ts";

/** 화면으로 보내기 전에 서버 안에서만 쓰는 칸(snippet)을 빼고, 종류와 쉬운 말 해설을 붙인다 */
function toClientArticle(article: Article, explain?: Explainer): ClientArticle {
  const { snippet, ...rest } = article;
  void snippet;
  const supportIds = findSupportGuides(`${article.title} ${snippet ?? ""}`).map(
    (guide) => guide.id,
  );
  return {
    ...rest,
    kind: articleKind(article),
    supportIds,
    regionId: findRegion(`${article.title} ${snippet ?? ""}`)?.id ?? null,
    agencyIds: findAgencies(`${article.title} ${snippet ?? ""}`).map((agency) => agency.id),
    ...(explain ? { explain } : {}),
  };
}

/** 기사별 협력기관을 모아, 기관마다 관련 기사 번호를 붙인다 (관련 기사가 많은 기관부터) */
function summarizeAgencies(articles: ClientArticle[]): AgencySummary[] {
  const agencies = new Map<string, AgencySummary>();
  articles.forEach((article, index) => {
    for (const id of article.agencyIds) {
      const agency = AGENCIES.find((a) => a.id === id);
      if (!agency) continue;
      const entry = agencies.get(id) ?? { agency, articleNumbers: [] };
      entry.articleNumbers.push(index + 1);
      agencies.set(id, entry);
    }
  });
  return [...agencies.values()].sort(
    (a, b) => b.articleNumbers.length - a.articleNumbers.length,
  );
}

/** 기사별 관련 분야를 모아, 분야마다 관련 기사 번호를 붙인다 (관련 기사가 많은 분야부터) */
function summarizeSupport(articles: ClientArticle[]): SupportSummary[] {
  const guides = new Map<string, SupportSummary>();
  articles.forEach((article, index) => {
    for (const id of article.supportIds) {
      const guide = SUPPORT_GUIDES.find((g) => g.id === id);
      if (!guide) continue;
      const entry = guides.get(id) ?? { guide, articleNumbers: [] };
      entry.articleNumbers.push(index + 1);
      guides.set(id, entry);
    }
  });
  return [...guides.values()].sort(
    (a, b) => b.articleNumbers.length - a.articleNumbers.length,
  );
}

/**
 * 이번 주 뉴스레터를 만든다.
 * 수집 → 거르기(정확히 맞는 기사 + 확장 키워드 기사) → 중복 제거 → 우선순위 → 제목 보완 → 발행일 순 나열 → 공유용 글
 */
export async function buildNewsletter(
  now: Date = new Date(),
): Promise<NewsletterResponse> {
  const period = getPeriod(now);

  const queries = [
    ...buildQueries(["수출", "수주"]),
    ...buildQueries(EVENT_KEYWORDS),
    ...buildQueries(WORK_KEYWORDS),
    ...buildQueries(EXPANDED_KEYWORDS),
  ];
  const { articles: fetched, failedQueries } = await fetchArticlesWithStats(queries, period.start);

  const exact = filterArticles(fetched, period.start, period.end).kept;
  const expanded = filterExpanded(fetched, period.start, period.end);
  const unique = dedupeArticles([...exact, ...expanded]);

  const { taken, reserve } = await takeWithFullTitles(
    sortByPriority(unique),
    TARGET_COUNT,
  );
  const selected = sortByDate(taken);

  // 뉴닉 같은 쉬운 말 해설 (실패해도 기사 목록과 공유용 글은 그대로 나간다)
  const explainers = await explainArticles(selected);

  const notices: string[] = [];
  const fillNotice = buildFillNotice(selected);
  if (fillNotice) notices.push(fillNotice);
  if (failedQueries > 0) {
    notices.push(
      `일부 검색(${failedQueries}건)이 일시적으로 연결되지 않아 빠진 기사가 있을 수 있어요. 한 번 더 눌러 보세요.`,
    );
  }
  if (selected.length < TARGET_COUNT) {
    notices.push(`관련 기사를 ${selected.length}건만 찾았어요.`);
  }

  if (selected.length > 0 && explainers.size < selected.length) {
    notices.push(
      explainers.size === 0
        ? "쉬운 말 해설을 만들지 못했어요. 기사 제목과 원문 링크는 그대로 볼 수 있어요."
        : "일부 기사는 쉬운 말 해설을 만들지 못했어요.",
    );
  }

  const articles = selected.map((article, index) =>
    toClientArticle(article, explainers.get(index)),
  );

  return {
    dateLine: period.dateLine,
    articles,
    support: summarizeSupport(articles),
    agencies: summarizeAgencies(articles),
    reserve: reserve.map((article) => toClientArticle(article)),
    shareText: buildShareText(period.dateLine, selected),
    notice: notices.length > 0 ? notices.join(" ") : undefined,
  };
}
