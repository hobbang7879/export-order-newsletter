// lib/filter.ts 확인용 스크립트 (인터넷·API 키 없이 돌아감): node scripts/check-filter.mjs
import assert from "node:assert/strict";
import { EXPANDED_KEYWORDS, WORK_KEYWORDS, filterArticles, filterExpanded, hasKeyword, hasWorkKeyword, isExportEvent, isOpinion, isPolitical, keywordInTitle } from "../lib/filter.ts";

const since = new Date("2026-10-08T00:00:00Z");
const art = (title, extra = {}) => ({
  id: title, title, url: "https://www.mk.co.kr/n/1", source: "매일경제",
  publishedAt: "2026-10-14T00:00:00.000Z", hasNumber: false, isExpanded: false,
  snippet: "", ...extra,
});

let failed = 0;
function check(name, fn) {
  try { fn(); console.log(`✅ ${name}`); }
  catch (e) { failed += 1; console.log(`❌ ${name}\n   ${e.message}`); }
}

check("제목에 수출/수주가 있으면 키워드 통과", () => {
  assert.equal(hasKeyword(art("현대건설, 원전 수주")), true);
  assert.equal(hasKeyword(art("반도체 수출 최대")), true);
});
check("앞부분에서만 언급된 정도는 수치가 있어도 통과하지 못한다 (제목에 수출·수주가 있어야 함)", () => {
  assert.equal(hasKeyword(art("예멘 내전 격화", { snippet: "무기 수출 논란도 있다" })), false);
  assert.equal(hasKeyword(art("소득 4만달러 시대", { snippet: "1조달러 수출", hasNumber: true })), false);
});
check("until(기간 끝) 뒤에 나온 기사는 기간 밖", () => {
  const until = new Date("2026-10-13T00:00:00Z");
  const { kept, excluded } = filterArticles(
    [art("10일 수출", { publishedAt: "2026-10-10T00:00:00.000Z" }), art("14일 수출", { publishedAt: "2026-10-14T00:00:00.000Z" })],
    since, until);
  assert.deepEqual(kept.map((a) => a.title), ["10일 수출"]);
  assert.equal(excluded[0].reason, "기간 밖");
});
check("제목에 키워드가 있으면 확실한 후보, 앞부분에만 있으면 아님", () => {
  assert.equal(keywordInTitle(art("현대건설 원전 수주")), true);
  assert.equal(keywordInTitle(art("BYD 유럽 채용", { snippet: "수출 확대" })), false);
});
check("수출·금융 지원 행사(설명회·상담회·박람회)는 키워드 없이도 통과", () => {
  assert.equal(isExportEvent(art("경북도, 중소기업 금융 설명회 개최")), true);
  assert.equal(hasKeyword(art("대구 바이어 상담회 성황", { snippet: "해외시장 개척" })), true);
});
check("수출 간담회(제목에 수출·수주·무역)는 포함, 수출과 무관한 간담회는 제외", () => {
  assert.equal(isExportEvent(art("산업부, 수출기업 간담회 개최")), true);
  assert.equal(isExportEvent(art("무역 현장 간담회 열려")), true);
  assert.equal(isExportEvent(art("이형일 취임 후 첫 경제6단체 간담회", { snippet: "수출 현안을 논의했다" })), false);
});
check("막연한 행사는 수출 지원 행사로 보지 않는다", () => {
  assert.equal(isExportEvent(art("수출 지원 행사 개최")), false);
  assert.equal(isExportEvent(art("수출 설명회 개최")), true);
  assert.equal(isExportEvent(art("대구 수출 상담회 성황")), true);
  assert.equal(isExportEvent(art("중소기업 수출 박람회 열려")), true);
});
check("행사 말만 있고 수출·금융과 무관하면 행사 기사가 아님", () => {
  assert.equal(isExportEvent(art("신제품 발표 행사 열려")), false);
  assert.equal(hasKeyword(art("신제품 발표 행사 열려")), false);
});
check("수출·수주와 무관하면 키워드 없음", () => {
  assert.equal(hasKeyword(art("AI혁신의 역설", { snippet: "착시 지표" })), false);
});
check("[사설]·[OO칼럼]·[기자수첩]은 오피니언", () => {
  assert.equal(isOpinion("[사설] 수출 위기"), true);
  assert.equal(isOpinion("반도체 횡재의 남은 시간 [김세형칼럼]"), true);
  assert.equal(isOpinion("[기자수첩] 수주 경쟁"), true);
});
check("일반 대괄호([단독], [속보])는 오피니언이 아님", () => {
  assert.equal(isOpinion("[단독] 현대건설 원전 수주"), false);
  assert.equal(isOpinion("[속보] 수출 증가"), false);
});
check("정치 다툼 표현은 정치 견해", () => {
  assert.equal(isPolitical("여야, 수출 지원법 두고 공방"), true);
  assert.equal(isPolitical("국민의힘 '수출 대책' 촉구"), true);
});
check("경제 기사 제목은 정치로 보지 않음 (수출 수치 기사 포함)", () => {
  assert.equal(isPolitical("9월 수출 5.2% 증가…반도체 역대 최대"), false);
  assert.equal(isPolitical("트럼프 관세에 對美 수출 비상"), false);
});
check("기간 밖·키워드 없음·오피니언·정치를 이유와 함께 거른다", () => {
  const list = [
    art("9월 수출 5.2% 증가"),
    art("옛날 수출 기사", { publishedAt: "2026-10-01T00:00:00.000Z" }),
    art("AI 혁신의 역설"),
    art("[사설] 수출 위기"),
    art("여야, 수출 지원 공방"),
  ];
  const { kept, excluded } = filterArticles(list, since);
  assert.deepEqual(kept.map((a) => a.title), ["9월 수출 5.2% 증가"]);
  assert.deepEqual(excluded.map((e) => e.reason), ["기간 밖", "키워드 없음", "오피니언·칼럼", "정치 견해"]);
});

check("확장 키워드가 제목에 있고 수출·수주 기준엔 안 맞는 기사는 확장 후보(isExpanded 표시)", () => {
  const list = filterExpanded([art("LG에너지솔루션, 미국 현지 공장 증설")], since);
  assert.equal(list.length, 1);
  assert.equal(list[0].isExpanded, true);
});
check("이미 수출·수주 기준에 맞는 기사는 확장 후보에서 뺀다 (중복 방지)", () => {
  assert.equal(filterExpanded([art("해외 진출 위해 수출 늘린다")], since).length, 0);
});
check("확장 키워드가 제목에 없으면 후보가 아니다 (앞부분에만 있어도 안 됨)", () => {
  assert.equal(filterExpanded([art("삼성 신제품 발표", { snippet: "해외 진출 계획" })], since).length, 0);
});
check("확장 후보도 기간·오피니언·정치 규칙은 똑같이 적용한다", () => {
  const list = filterExpanded([
    art("옛날 해외 진출", { publishedAt: "2026-10-01T00:00:00.000Z" }),
    art("[사설] 해외 진출 논의"),
    art("여야 해외 진출 공방"),
    art("납품 계약 체결"),
  ], since);
  assert.deepEqual(list.map((a) => a.title), ["납품 계약 체결"]);
});
check("부고 같은 사업 소식이 아닌 기사는 '진출'이 있어도 확장 후보가 아니다", () => {
  assert.equal(filterExpanded([art("메조소프라노 최초 유럽 진출 김청자 별세")], since).length, 0);
});
check("지원단 업무 영역(수출금융·해외건설·방산·K푸드 등)은 제목에 수출·수주가 없어도 관련 기사", () => {
  assert.equal(hasWorkKeyword(art("한국무역보험공사, 중소기업 지원 확대")), true);
  assert.equal(hasKeyword(art("현대건설 해외건설 신기록")), true);
  assert.equal(hasKeyword(art("K푸드 인기 끌며 라면 판매 급증")), true);
  assert.equal(hasKeyword(art("K방산 수출 기지로 키운다")), true);
  assert.equal(hasKeyword(art("방산·반도체 테마형 레버리지 ETF")), false);
  assert.equal(hasWorkKeyword(art("삼성전자 신제품 발표")), false);
});
check("지원단 업무 키워드 목록", () => {
  for (const k of ["수출금융", "무역보험", "해외건설", "플랜트", "방산 수출", "K방산", "K푸드", "KOTRA"]) assert.ok(WORK_KEYWORDS.includes(k));
});
check("확장 키워드 목록에 진출·공급 계약·납품이 들어 있다", () => {
  for (const k of ["진출", "공급 계약", "납품"]) assert.ok(EXPANDED_KEYWORDS.includes(k));
});

if (failed > 0) { console.log(`\n❌ ${failed}건 실패`); process.exit(1); }
console.log("\n모두 통과했어요.");
