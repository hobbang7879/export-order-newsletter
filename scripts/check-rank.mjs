// lib/rank.ts 확인용 스크립트 (인터넷·API 키 없이 돌아감): node scripts/check-rank.mjs
import assert from "node:assert/strict";
import { articleKind, buildFillNotice, isNewCase, rankArticles, sortByPriority } from "../lib/rank.ts";

let n = 0;
const art = (title, publishedAt, extra = {}) => ({
  id: String(n++), title, url: `https://example/${n}`, source: "매일경제", publishedAt,
  hasNumber: false, isExpanded: false, sourceCount: 1, snippet: "", ...extra,
});
const figure = (title, day) => art(title, `2026-10-${day}T05:00:00Z`, { hasNumber: true });
const other = (title, day) => art(title, `2026-10-${day}T05:00:00Z`);
const event = (title, day) => art(title, `2026-10-${day}T05:00:00Z`);

let failed = 0;
function check(name, fn) {
  try { fn(); console.log(`✅ ${name}`); }
  catch (e) { failed += 1; console.log(`❌ ${name}\n   ${e.message}`); }
}
const titles = (list) => list.map((a) => a.title);

check("신규 사례 판단: 첫·최초·처음·신규 진출", () => {
  assert.equal(isNewCase("KT&G, 인도네시아 첫 공장 가동"), true);
  assert.equal(isNewCase("세계 최초 수주"), true);
  assert.equal(isNewCase("반도체 수출 증가"), false);
});
check("기사 종류: 수출 지원 행사 / 수치 / 기타", () => {
  assert.equal(articleKind(event("경북 수출 설명회 개최", "10")), "event");
  assert.equal(articleKind(art("금융 설명회 열려 기업 지원", "2026-10-10T05:00:00Z")), "event");
  assert.equal(articleKind(figure("반도체 수출 5% 증가", "10")), "figure");
  assert.equal(articleKind(other("현대건설 원전 수주", "10")), "other");
});
check("수치 기사는 2건까지만 먼저 고르고 나머지 자리는 다른 기사로 채운다", () => {
  const list = [
    figure("수치1 수출 5%", "14"), figure("수치2 수출 3%", "13"), figure("수치3 수출 2%", "12"),
    other("기타1 수주", "11"), other("기타2 수주", "10"), other("기타3 수주", "09"),
  ];
  const selected = sortByPriority(list).slice(0, 5);
  assert.equal(selected.filter((a) => a.hasNumber).length, 2);
  assert.deepEqual(titles(selected), ["수치1 수출 5%", "수치2 수출 3%", "기타1 수주", "기타2 수주", "기타3 수주"]);
});
check("자리가 남으면 뒤에서 남은 수치 기사로 채운다", () => {
  const list = [figure("수치1 수출 5%", "14"), figure("수치2 수출 3%", "13"), figure("수치3 수출 2%", "12"), other("기타1 수주", "11")];
  assert.deepEqual(titles(sortByPriority(list)), ["수치1 수출 5%", "수치2 수출 3%", "기타1 수주", "수치3 수출 2%"]);
});
check("수출 지원 행사 기사가 기타 기사보다 먼저", () => {
  const list = [other("기타 최신 수주", "14"), event("경북 수출 상담회 개최", "09")];
  assert.equal(sortByPriority(list)[0].title, "경북 수출 상담회 개최");
});
check("수치 2건 + 행사 + 기타 순으로 선택된다", () => {
  const list = [
    figure("수치1 수출 5%", "14"), figure("수치2 수출 3%", "13"), figure("수치3 수출 2%", "12"),
    event("대구 수출 설명회", "11"), other("기타1 수주", "10"),
  ];
  assert.deepEqual(titles(sortByPriority(list).slice(0, 4)), ["수치1 수출 5%", "수치2 수출 3%", "대구 수출 설명회", "기타1 수주"]);
});
check("같은 종류 안에서는 최신 날짜가 먼저", () => {
  const sorted = sortByPriority([other("10일 수출", "10"), other("14일 수출", "14")]);
  assert.equal(sorted[0].title, "14일 수출");
});
check("같은 날이면 여러 매체가 다룬 기사가 먼저", () => {
  const sorted = sortByPriority([
    art("한 곳만 다룬 수출", "2026-10-14T08:00:00Z", { sourceCount: 1 }),
    art("세 곳이 다룬 수출", "2026-10-14T01:00:00Z", { sourceCount: 3 }),
  ]);
  assert.equal(sorted[0].title, "세 곳이 다룬 수출");
});
check("같은 날·같은 매체 수면 신규 사례가 먼저", () => {
  const sorted = sortByPriority([art("평범한 수출 기사", "2026-10-14T08:00:00Z"), art("첫 해외 진출 수출", "2026-10-14T01:00:00Z")]);
  assert.equal(sorted[0].title, "첫 해외 진출 수출");
});
check("나머지가 같으면 제목에 키워드가 있는 기사, 그다음 최신 시각", () => {
  const sorted = sortByPriority([art("키워드 없는 제목", "2026-10-14T09:00:00Z"), art("제목에 수주 있음", "2026-10-14T01:00:00Z")]);
  assert.equal(sorted[0].title, "제목에 수주 있음");
});
check("10건을 고르고 나머지는 예비로 남기며, 보여 주는 순서는 발행이 이른 순", () => {
  const list = Array.from({ length: 13 }, (_, i) => other(`수출 기사 ${i}`, String(1 + i).padStart(2, "0")));
  const { selected, reserve } = rankArticles(list);
  assert.equal(selected.length, 10);
  assert.equal(reserve.length, 3);
  const dates = selected.map((a) => a.publishedAt);
  assert.deepEqual(dates, [...dates].sort());
});
check("고르는 기준은 우선순위, 나열은 발행이 이른 순 (담당자 양식)", () => {
  const list = [figure("수치 10일 수출 5%", "10"), figure("수치 8일 수주 2조원", "08"), other("기타 14일 수출", "14"), other("기타 12일 수주", "12")];
  const { selected, reserve } = rankArticles(list, 3);
  assert.deepEqual(titles(selected), ["수치 8일 수주 2조원", "수치 10일 수출 5%", "기타 14일 수출"]);
  assert.deepEqual(titles(reserve), ["기타 12일 수주"]);
});
check("후보가 10건보다 적으면 있는 만큼만 고른다", () => {
  const { selected, reserve } = rankArticles([other("수출 하나", "14")]);
  assert.equal(selected.length, 1);
  assert.equal(reserve.length, 0);
});
check("원래 배열의 순서는 바꾸지 않는다", () => {
  const list = [other("b 수출", "10"), other("a 수출", "14")];
  rankArticles(list);
  assert.equal(list[0].title, "b 수출");
});

const expanded = (title, day) => ({ ...art(title, `2026-10-${day}T05:00:00Z`), isExpanded: true });
check("확장 키워드 기사는 정확히 맞는 기사 뒤, 남은 수치 기사 앞에 들어간다", () => {
  const list = [
    figure("수치1 수출 5%", "14"), figure("수치2 수출 3%", "13"), figure("수치3 수출 2%", "12"),
    other("기타1 수주", "11"), expanded("확장1 해외 진출", "14"),
  ];
  assert.deepEqual(titles(sortByPriority(list)), ["수치1 수출 5%", "수치2 수출 3%", "기타1 수주", "확장1 해외 진출", "수치3 수출 2%"]);
});
check("정확히 맞는 기사가 10건을 채우면 확장 기사는 쓰이지 않는다", () => {
  const strict = Array.from({ length: 10 }, (_, i) => other(`기타 수출 ${i}`, String(1 + i).padStart(2, "0")));
  const { selected } = rankArticles([...strict, expanded("확장 해외 진출", "14")]);
  assert.equal(selected.filter((a) => a.isExpanded).length, 0);
});
check("안내 문구: 확장으로 채웠을 때만 '○건은 정확히 맞고 나머지 ○건은 범위를 넓혀 채웠어요'", () => {
  const sel = [other("a 수출", "10"), other("b 수주", "11"), expanded("c 납품", "12")];
  assert.equal(buildFillNotice(sel), "2건은 키워드에 정확히 맞는 기사이고, 나머지 1건은 범위를 넓혀 채웠어요.");
  assert.equal(buildFillNotice([other("a 수출", "10")]), undefined);
});

if (failed > 0) { console.log(`\n❌ ${failed}건 실패`); process.exit(1); }
console.log("\n모두 통과했어요.");
