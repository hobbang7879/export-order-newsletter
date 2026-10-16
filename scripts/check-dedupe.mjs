// lib/dedupe.ts 확인용 스크립트 (인터넷·API 키 없이 돌아감): node scripts/check-dedupe.mjs
import assert from "node:assert/strict";
import { dedupeArticles, normalizeTitle, specificity, titleSimilarity } from "../lib/dedupe.ts";

let n = 0;
const art = (title, source, publishedAt, snippet = "") => ({
  id: String(n++), title, url: `https://example/${n}`, source, publishedAt,
  hasNumber: false, isExpanded: false, snippet,
});

let failed = 0;
function check(name, fn) {
  try { fn(); console.log(`✅ ${name}`); }
  catch (e) { failed += 1; console.log(`❌ ${name}\n   ${e.message}`); }
}

check("[말머리]·따옴표·공백을 없애고 비교한다", () => {
  assert.equal(normalizeTitle('[단독] 현대건설 "원전" 수주!'), "현대건설원전수주");
});
check("같은 사건의 다른 표현 제목은 비슷하다고 본다", () => {
  assert.ok(titleSimilarity('IMF, 올해 한국 성장률 3.3%로 상향', '석달만에 … IMF, 올 韓성장률 3.3%로 상향') >= 0.35);
});
check("다른 사건 제목은 비슷하지 않다", () => {
  assert.ok(titleSimilarity("현대건설, 빌게이츠와 원전 8기 수주", "삼성전자 반도체 수출 최대") < 0.35);
});
check("같은 사건은 1건만 남고, 다른 사건은 그대로 남는다", () => {
  const list = [
    art("IMF, 올해 한국 성장률 3.3%로 상향", "매일경제", "2026-10-14T01:00:00Z"),
    art("석달만에 … IMF, 올 韓성장률 3.3%로 상향", "한국경제", "2026-10-14T02:00:00Z"),
    art("현대건설, 빌게이츠와 원전 8기 수주", "서울경제", "2026-10-14T03:00:00Z"),
  ];
  assert.equal(dedupeArticles(list).length, 2);
});
check("구체성(수치·길이)이 높은 기사를 남긴다", () => {
  const plain = art("IMF, 한국 성장률 3.3%로 상향", "매일경제", "2026-10-14T01:00:00Z", "짧은 내용");
  const rich = art("IMF, 한국 성장률 3.3%로 상향 전망", "한국경제", "2026-10-14T05:00:00Z", "반도체 수출 호조로 2.6%에서 3.3%로 올렸다. 수출 1,200억달러 돌파, 무역수지 흑자 80억달러");
  const [kept] = dedupeArticles([plain, rich]);
  assert.equal(kept.id, rich.id);
  assert.ok(specificity(rich) > specificity(plain));
});
check("구체성이 같으면 먼저 발행된 기사를 남긴다", () => {
  const late = art("IMF 한국 성장률 3.3% 상향", "매일경제", "2026-10-14T09:00:00Z", "내용");
  const early = art("IMF 한국 성장률 3.3% 상향", "한국경제", "2026-10-14T01:00:00Z", "내용");
  const [kept] = dedupeArticles([late, early]);
  assert.equal(kept.id, early.id);
});
check("sourceCount는 그 사건을 다룬 매체 수", () => {
  const list = [
    art("IMF 한국 성장률 3.3% 상향", "매일경제", "2026-10-14T01:00:00Z"),
    art("IMF 한국 성장률 3.3% 상향 전망", "한국경제", "2026-10-14T02:00:00Z"),
    art("IMF 한국 성장률 3.3% 상향 조정", "한국경제", "2026-10-14T03:00:00Z"),
  ];
  const [kept] = dedupeArticles(list);
  assert.equal(kept.sourceCount, 2); // 매일경제, 한국경제 (한국경제 2건은 1곳으로 센다)
});
check("같은 사건이면 정확히 맞는 기사를 확장 기사보다 먼저 남긴다", () => {
  const strict = art("IMF 한국 성장률 3.3% 상향", "매일경제", "2026-10-14T09:00:00Z", "짧음");
  const expanded = { ...art("IMF 한국 성장률 3.3% 상향 전망 해외 시장", "한국경제", "2026-10-14T01:00:00Z", "훨씬 더 길고 구체적인 내용 3조원 5% 2억달러"), isExpanded: true };
  const [kept] = dedupeArticles([expanded, strict]);
  assert.equal(kept.id, strict.id);
});
check("원래 배열은 바꾸지 않는다", () => {
  const list = [art("A 수출 증가 기록", "매일경제", "2026-10-14T01:00:00Z")];
  dedupeArticles(list);
  assert.equal(list[0].sourceCount, undefined);
});

if (failed > 0) { console.log(`\n❌ ${failed}건 실패`); process.exit(1); }
console.log("\n모두 통과했어요.");
