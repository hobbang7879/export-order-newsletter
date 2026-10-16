// lib/fetch-articles.ts 확인용 스크립트 (인터넷·API 키 없이 돌아감): node scripts/check-fetch-articles.mjs
import assert from "node:assert/strict";
import { fetchArticlesWithStats, extractImageUrl, buildQueries, cleanText, cleanUrl, extractPageTitle, getAllowedSource, hasRelatedFigure, isSameTitle, isTruncatedTitle, toArticle, takeWithFullTitles } from "../lib/fetch-articles.ts";

let failed = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`❌ ${name}\n   ${e.message}`);
  }
}

check("허용 도메인 4곳(https)은 매체 이름이 나온다", () => {
  assert.equal(getAllowedSource("https://www.hankyung.com/article/1"), "한국경제");
  assert.equal(getAllowedSource("https://www.sedaily.com/article/1"), "서울경제");
  assert.equal(getAllowedSource("https://www.asiae.co.kr/article/1"), "아시아경제");
  assert.equal(getAllowedSource("https://www.mk.co.kr/news/1"), "매일경제");
});
check("아시아경제 하위 주소(view.asiae.co.kr)도 허용된다", () => {
  assert.equal(getAllowedSource("https://view.asiae.co.kr/article/2026"), "아시아경제");
});
check("http 주소는 거른다", () => {
  assert.equal(getAllowedSource("http://www.hankyung.com/article/1"), null);
});
check("다른 도메인은 거른다", () => {
  assert.equal(getAllowedSource("https://www.example.com/a"), null);
});
check("이름만 비슷한 가짜 도메인은 거른다", () => {
  assert.equal(getAllowedSource("https://evilhankyung.com/a"), null);
  assert.equal(getAllowedSource("https://hankyung.com.evil.com/a"), null);
});
check("잘못된 주소는 거른다", () => {
  assert.equal(getAllowedSource("javascript:alert(1)"), null);
  assert.equal(getAllowedSource("not a url"), null);
});
check("제목의 태그와 글자 코드를 정리한다", () => {
  assert.equal(
    cleanText("<b>수출</b> 1조원 &quot;돌파&quot; &amp; 신기록"),
    '수출 1조원 "돌파" & 신기록',
  );
});
check("검색 결과 한 건이 기사로 바뀐다 (수치 포함 판단 포함)", () => {
  const a = toArticle({
    title: "현대건설, <b>수주</b> 2조원 규모 원전 계약",
    originallink: "https://www.mk.co.kr/news/economy/123",
    description: "설명",
    pubDate: "Mon, 17 Aug 2026 09:30:00 +0900",
  });
  assert.ok(a);
  assert.equal(a.title, "현대건설, 수주 2조원 규모 원전 계약");
  assert.equal(a.source, "매일경제");
  assert.equal(a.publishedAt, "2026-08-17T00:30:00.000Z");
  assert.equal(a.hasNumber, true);
  assert.equal(a.isExpanded, false);
  assert.equal(a.url, "https://www.mk.co.kr/news/economy/123");
});
check("같은 주소는 같은 id, 다른 주소는 다른 id", () => {
  const base = { title: "t", description: "", pubDate: "Mon, 17 Aug 2026 09:30:00 +0900" };
  const a = toArticle({ ...base, originallink: "https://www.mk.co.kr/news/1" });
  const b = toArticle({ ...base, originallink: "https://www.mk.co.kr/news/1" });
  const c = toArticle({ ...base, originallink: "https://www.mk.co.kr/news/2" });
  assert.equal(a.id, b.id);
  assert.notEqual(a.id, c.id);
});
check("날짜가 이상하거나 허용 안 되는 주소는 기사로 만들지 않는다", () => {
  assert.equal(toArticle({ title: "t", description: "", originallink: "https://www.mk.co.kr/n/1", pubDate: "엉터리" }), null);
  assert.equal(toArticle({ title: "t", description: "", originallink: "https://example.com/n/1", pubDate: "Mon, 17 Aug 2026 09:30:00 +0900" }), null);
});

check("검색어는 키워드 × 4개 매체로 8개가 만들어진다", () => {
  const q = buildQueries(["수출", "수주"]);
  assert.equal(q.length, 8);
  assert.ok(q.includes("수출 매일경제") && q.includes("수주 아시아경제"));
});

check("추적 표시 ?ref=naver 만 지우고 다른 주소 값은 그대로 둔다", () => {
  assert.equal(cleanUrl("https://www.sedaily.com/article/20099400?ref=naver"), "https://www.sedaily.com/article/20099400");
  assert.equal(cleanUrl("https://www.sedaily.com/article/1?ref=naver&page=2"), "https://www.sedaily.com/article/1?page=2");
  assert.equal(cleanUrl("https://www.hankyung.com/article/1?id=5"), "https://www.hankyung.com/article/1?id=5");
  assert.equal(cleanUrl("https://www.mk.co.kr/article/12173153"), "https://www.mk.co.kr/article/12173153");
  assert.equal(cleanUrl("엉터리"), "엉터리");
});
check("검색 결과의 ?ref=naver 가 기사 주소에서 빠지고 id도 주소 기준", () => {
  const base = { title: "t", description: "", pubDate: "Mon, 17 Aug 2026 09:30:00 +0900" };
  const a = toArticle({ ...base, originallink: "https://www.sedaily.com/article/1?ref=naver" });
  const b = toArticle({ ...base, originallink: "https://www.sedaily.com/article/1" });
  assert.equal(a.url, "https://www.sedaily.com/article/1");
  assert.equal(a.id, b.id);
});
check("수출·수주 근처의 수치만 관련 수치로 본다", () => {
  assert.equal(hasRelatedFigure("반도체 수출 5.2% 증가", ""), true);
  assert.equal(hasRelatedFigure("현대건설 원전 수주", "2조원 규모 계약"), true);
  assert.equal(hasRelatedFigure("1조달러 수출 시대", ""), true);
});
check("수출·수주와 상관없는 수치나, 수치 없는 수출 기사는 아님", () => {
  assert.equal(hasRelatedFigure("AI 시대 기업가치, 무형자산…83%는 재무제표에 없다", "삼성전자 시가총액 증가 " + "가".repeat(60) + " 수출 둔화"), false);
  assert.equal(hasRelatedFigure("K드라마 수출 급증", "넷플릭스 타고 인기"), false);
  assert.equal(hasRelatedFigure("코스피 3% 상승", "외국인 순매수"), false);
});
check("잘린 제목 판단: 끝이 ... 또는 …", () => {
  assert.equal(isTruncatedTitle("메모리 넘어 AI 부품…빅테크 줄섰..."), true);
  assert.equal(isTruncatedTitle("IMF, 한국 경제성장률 전망 3.3%로 '2연속 상향 조정'…6년 만에 세계 평..."), true);
  assert.equal(isTruncatedTitle("정상 제목입니다"), false);
});
check("페이지 제목(og:title)을 꺼낸다", () => {
  const html = '<html><head><meta property="og:title" content="[단독] 메모리 넘어 &quot;5년 계약&quot; 줄섰다"></head></html>';
  assert.equal(extractPageTitle(html), '[단독] 메모리 넘어 "5년 계약" 줄섰다');
  assert.equal(extractPageTitle("<html></html>"), null);
});
check("같은 기사의 제목일 때만 잘린 제목을 바꾼다", () => {
  assert.equal(isSameTitle("[단독] 메모리 넘어 AI 부품·전력기기 확보전…빅테크 '5년 계약' 줄섰...", "[단독] 메모리 넘어 AI 부품·전력기기 확보전…빅테크 '5년 계약' 줄섰다"), true);
  assert.equal(isSameTitle("[단독] 메모리 넘어 AI 부품·전력기기 확보전…빅테크 줄섰...", "전혀 다른 기사의 제목입니다 정말로"), false);
  assert.equal(isSameTitle("짧...", "짧은 제목"), false); // 앞부분이 너무 짧으면 믿지 않는다
});

const mk = (title, url = "https://example.com/x") => ({ id: title, title, url, source: "매일경제", publishedAt: "2026-10-14T00:00:00.000Z", hasNumber: false, isExpanded: false });
const t1 = await takeWithFullTitles([mk("온전한 제목 하나"), mk("잘린 제목이 끝나는 기사..."), mk("온전한 제목 둘"), mk("온전한 제목 셋")], 2);
check("takeWithFullTitles: 온전한 제목 2건만 고른다", () => {
  assert.deepEqual(t1.taken.map((a) => a.title), ["온전한 제목 하나", "온전한 제목 둘"]);
});
check("takeWithFullTitles: 잘린 제목 기사는 예비에도 넣지 않는다", () => {
  assert.deepEqual(t1.reserve.map((a) => a.title), ["온전한 제목 셋"]);
});
const t2 = await takeWithFullTitles([mk("잘린 하나..."), mk("잘린 둘…")], 2);
check("takeWithFullTitles: 모두 잘렸으면 빈 결과", () => {
  assert.equal(t2.taken.length, 0);
});

check("대표 이미지: og:image를 찾고 https만 쓴다", () => {
  const page = "https://www.hankyung.com/article/1";
  assert.equal(extractImageUrl('<meta property="og:image" content="https://img.hankyung.com/a.jpg">', page), "https://img.hankyung.com/a.jpg");
  assert.equal(extractImageUrl('<meta property="og:image" content="/a.jpg">', page), "https://www.hankyung.com/a.jpg");
  assert.equal(extractImageUrl('<meta property="og:image" content="https://evil.com/a.jpg">', page), null);
  assert.equal(extractImageUrl('<meta property="og:image" content="https://hankyung.com.evil.com/a.jpg">', page), null);
  assert.equal(extractImageUrl('<meta property="og:image" content="http://x.com/a.jpg">', page), null);
  assert.equal(extractImageUrl('<meta property="og:image" content="javascript:alert(1)">', page), null);
  assert.equal(extractImageUrl("<html></html>", page), null);
});

check("허용 주소: 포트·계정 정보가 붙은 주소는 막는다", () => {
  assert.equal(getAllowedSource("https://www.mk.co.kr/news/1"), "매일경제");
  assert.equal(getAllowedSource("https://www.mk.co.kr:8443/news/1"), null);
  assert.equal(getAllowedSource("https://mk.co.kr@evil.com/x"), null);
  assert.equal(getAllowedSource("https://user:pw@www.mk.co.kr/x"), null);
});

// --- 일시적 오류 처리 (네트워크를 가짜로 바꿔 시험한다) ---
async function acheck(name, fn) {
  try { await fn(); console.log(`✅ ${name}`); }
  catch (e) { failed += 1; console.log(`❌ ${name}\n   ${e.message}`); }
}
process.env.NAVER_CLIENT_ID = "test";
process.env.NAVER_CLIENT_SECRET = "test";
const realFetch = globalThis.fetch;
const since = new Date("2026-10-06T00:00:00+09:00");
const okBody = () => new Response(JSON.stringify({ items: [] }), { status: 200 });

await acheck("한 번 실패해도 다시 시도해 성공한다", async () => {
  let calls = 0;
  globalThis.fetch = async () => (++calls === 1 ? Promise.reject(new Error("timeout")) : okBody());
  const r = await fetchArticlesWithStats(["수출 한국경제"], since);
  assert.equal(r.failedQueries, 0);
  assert.equal(calls, 2);
});
await acheck("일부 검색어만 계속 실패하면 나머지로 계속하고 실패 수를 알려 준다", async () => {
  globalThis.fetch = async (url) =>
    String(url).includes(encodeURIComponent("수주")) ? Promise.reject(new Error("x")) : okBody();
  const r = await fetchArticlesWithStats(["수출 한국경제", "수주 한국경제"], since);
  assert.equal(r.failedQueries, 1);
});
await acheck("전부 실패하면 오류를 던진다", async () => {
  globalThis.fetch = async () => Promise.reject(new Error("x"));
  await assert.rejects(() => fetchArticlesWithStats(["수출 한국경제"], since), /가져오지 못했어요/);
});
await acheck("키 오류(401)는 다시 시도하지 않고 바로 멈춘다", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return new Response("{}", { status: 401 }); };
  await assert.rejects(() => fetchArticlesWithStats(["수출 한국경제"], since), /설정/);
  assert.equal(calls, 1);
});
globalThis.fetch = realFetch;

if (failed > 0) {
  console.log(`\n❌ ${failed}건 실패`);
  process.exit(1);
}
console.log("\n모두 통과했어요.");
