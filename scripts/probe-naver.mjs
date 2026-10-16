// 뉴스 검색 연결 확인: 키를 .env에 넣은 뒤 `node --env-file=.env scripts/probe-naver.mjs`
// 4개 경제지에서 최근 7일 기사가 매체별로 몇 건 모이는지만 보여 준다 (키 값은 출력하지 않는다)
import { buildQueries, fetchArticles } from "../lib/fetch-articles.ts";
import { filterArticles } from "../lib/filter.ts";

const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

try {
  const articles = await fetchArticles(buildQueries(["수출", "수주"]), since);
  const bySource = {};
  for (const a of articles) bySource[a.source] = (bySource[a.source] ?? 0) + 1;

  console.log(`최근 7일 기사: 모두 ${articles.length}건`);
  for (const name of ["매일경제", "한국경제", "서울경제", "아시아경제"]) {
    console.log(`- ${name}: ${bySource[name] ?? 0}건`);
  }
  const dates = articles.map((a) => a.publishedAt).sort();
  if (dates.length) console.log(`가장 오래된 기사: ${dates[0]} / 가장 최근 기사: ${dates.at(-1)}`);
  const { kept, excluded } = filterArticles(articles, since);
  const reasons = {};
  for (const e of excluded) reasons[e.reason] = (reasons[e.reason] ?? 0) + 1;
  console.log(`\n거른 뒤: ${kept.length}건 남음 / 제외 ${excluded.length}건 ${JSON.stringify(reasons)}`);
  console.log("제외 예시:");
  for (const e of excluded.slice(0, 8)) console.log(`  (${e.reason}) [${e.article.source}] ${e.article.title}`);
  console.log("\n예시 5건:");
  for (const a of articles.slice(0, 5)) console.log(`${a.publishedAt.slice(0, 10)} [${a.source}] ${a.title}`);
} catch (e) {
  console.log(`❌ ${e.message}`);
  process.exit(1);
}
