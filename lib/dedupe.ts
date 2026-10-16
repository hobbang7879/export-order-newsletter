// Design Ref: §3.1 단계 5 — 같은 사건을 다룬 기사는 1건만 남긴다
// Plan SC: 작업 5 — 같은 사건 중복 기사 제거하기
import type { Article } from "./types";

/**
 * 제목이 이 값 이상 비슷하면 같은 사건으로 본다 (0~1).
 * 실제 기사 63건으로 0.3/0.35/0.4/0.5를 비교해 정했다. 0.5는 같은 사건도 못 묶었고(제목 표현이 매체마다 달라서),
 * 0.3은 다른 사건까지 묶었다. 가끔 다른 사건이 묶일 수 있어 담당자의 교체 기능이 보완한다.
 */
export const SIMILARITY_THRESHOLD = 0.35;

/** 제목에서 [말머리], 따옴표, 기호를 없애고 공백도 없앤 글자 */
export function normalizeTitle(title: string): string {
  return title
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
}

/** 글자 두 개씩 묶음. 예: "수출증가" → 수출, 출증, 증가 (조사가 달라도 비슷하게 잡히도록) */
function bigrams(text: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < text.length - 1; i += 1) set.add(text.slice(i, i + 2));
  return set;
}

/** 두 제목이 얼마나 비슷한지 (0~1). 두 묶음에 공통으로 든 비율 */
export function titleSimilarity(a: string, b: string): number {
  const setA = bigrams(normalizeTitle(a));
  const setB = bigrams(normalizeTitle(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let common = 0;
  for (const gram of setA) if (setB.has(gram)) common += 1;
  return (2 * common) / (setA.size + setB.size);
}

/** 수치(금액·물량·비율 등)가 몇 군데 들어 있는지 */
function countFigures(text: string): number {
  const matches = text.match(
    /\d[\d,.]*\s*(조|억|만|천|%|퍼센트|달러|원|톤|대|기|척|건|배럴|GW|MW)/gi,
  );
  return matches ? matches.length : 0;
}

/**
 * 기사 내용이 얼마나 구체적인지 점수로 만든다. (높을수록 구체적)
 * - 관련 자료: 수치가 들어간 곳 하나당 20점
 * - 길이: 제목과 기사 앞부분의 글자 수
 */
export function specificity(article: Article): number {
  const text = `${article.title} ${article.snippet ?? ""}`;
  return countFigures(text) * 20 + text.length;
}

/** 구체성이 높은 쪽이 앞. 같으면 먼저 발행된 쪽이 앞 */
function compareRepresentative(a: Article, b: Article): number {
  // 키워드에 정확히 맞는 기사가 있으면 확장 키워드로 모은 기사보다 먼저 남긴다
  if (a.isExpanded !== b.isExpanded) return a.isExpanded ? 1 : -1;
  const diff = specificity(b) - specificity(a);
  if (diff !== 0) return diff;
  return a.publishedAt.localeCompare(b.publishedAt);
}

/**
 * 같은 사건을 다룬 기사끼리 묶어, 묶음마다 1건만 남긴다.
 * - 남기는 기사: 내용이 가장 구체적인 기사 (같으면 먼저 발행된 기사). 단, 키워드에 정확히 맞는 기사가 있으면 그쪽을 먼저 남긴다
 * - 남긴 기사의 sourceCount에는 그 사건을 다룬 매체 수를 적는다 (작업 6의 "여러 매체" 우선순위에 쓴다)
 * - 같은 매체가 같은 사건을 두 번 쓴 경우도 하나로 합친다
 */
export function dedupeArticles(articles: Article[]): Article[] {
  const parent = articles.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };

  for (let i = 0; i < articles.length; i += 1) {
    for (let j = i + 1; j < articles.length; j += 1) {
      if (
        titleSimilarity(articles[i].title, articles[j].title) >=
        SIMILARITY_THRESHOLD
      ) {
        parent[find(j)] = find(i);
      }
    }
  }

  const groups = new Map<number, Article[]>();
  articles.forEach((article, i) => {
    const root = find(i);
    groups.set(root, [...(groups.get(root) ?? []), article]);
  });

  const result: Article[] = [];
  for (const group of groups.values()) {
    const best = [...group].sort(compareRepresentative)[0];
    const sourceCount = new Set(group.map((a) => a.source)).size;
    result.push({ ...best, sourceCount });
  }
  return result;
}
