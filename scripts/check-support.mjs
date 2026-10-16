// lib/support.ts 확인용 스크립트 (인터넷 없이 돌아감): node scripts/check-support.mjs
import assert from "node:assert/strict";
import { SUPPORT_GUIDES, SUPPORT_SHORTCUTS, findSupportGuides } from "../lib/support.ts";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log(`✅ ${name}`); }
  catch (e) { failed += 1; console.log(`❌ ${name}\n   ${e.message}`); }
}
const ids = (text) => findSupportGuides(text).map((g) => g.id);

check("담당자 예시: 'aT, K푸드와 신선과일·냉동베이커리로 러시아 입맛 공략' → 농수산식품 + 국가별 정보", () => {
  const found = ids("aT, K푸드와 신선과일·냉동베이커리로 러시아 입맛 공략");
  assert.ok(found.includes("agri"));
  assert.ok(found.includes("country"));
  assert.equal(found[0], "agri"); // 맞는 말이 가장 많은 분야가 먼저
});
check("수주·해외건설 기사 → 해외 수주 지원", () => {
  assert.ok(ids("현대건설, 사우디 플랜트 수주 확정").includes("order"));
});
check("금융·무역보험 기사 → 정책금융", () => {
  assert.ok(ids("무역보험공사, 중소기업 수출 보증 확대").includes("finance"));
});
check("K콘텐츠·드라마 수출 → 서비스 분야 수출 지원", () => {
  assert.ok(ids("넷플릭스 타고…K드라마 수출 7년 새 3배").includes("service"));
});
check("수출 설명회·상담회 기사 → 바이어·전시·바우처", () => {
  assert.ok(ids("대구서 수출 상담회 열려…바이어 100여 곳 참가").includes("buyer"));
});
check("영어 약어는 다른 단어 속에서는 맞지 않는다 (예: aT가 'chat' 속에 있는 경우)", () => {
  assert.ok(!ids("chat service").includes("agri"));
  assert.ok(ids("한국 aT 공사 발표").includes("agri"));
});
check("관련 말이 없으면 빈 목록", () => {
  assert.deepEqual(ids("오늘의 날씨는 맑음"), []);
});
check("한 기사에 최대 3개까지만", () => {
  assert.ok(findSupportGuides("러시아 K푸드 금융 보증 바이어 상담회 경북 수주").length <= 3);
});
check("모든 안내 링크는 https 주소다 (지원단 누리집 또는 안내 페이지에 실제 있던 주소)", () => {
  const all = [...SUPPORT_GUIDES.flatMap((g) => g.links), ...SUPPORT_SHORTCUTS];
  for (const link of all) assert.ok(link.url.startsWith("https://"), link.url);
  const export119 = all.filter((l) => l.url.includes("export119.go.kr"));
  assert.ok(export119.length >= 8);
});
check("분야 id가 겹치지 않는다", () => {
  assert.equal(new Set(SUPPORT_GUIDES.map((g) => g.id)).size, SUPPORT_GUIDES.length);
});

if (failed > 0) { console.log(`\n❌ ${failed}건 실패`); process.exit(1); }
console.log("\n모두 통과했어요.");
