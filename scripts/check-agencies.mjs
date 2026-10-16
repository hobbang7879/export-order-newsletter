// lib/agencies.ts 확인용 스크립트 (인터넷 없이 돌아감): node scripts/check-agencies.mjs
import assert from "node:assert/strict";
import { AGENCIES, findAgencies } from "../lib/agencies.ts";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log(`✅ ${name}`); }
  catch (e) { failed += 1; console.log(`❌ ${name}\n   ${e.message}`); }
}
const ids = (t) => findAgencies(t).map((a) => a.id);

check("aT가 나온 기사 → 한국농수산식품유통공사", () => {
  assert.deepEqual(ids("aT, K푸드와 신선과일·냉동베이커리로 러시아 입맛 공략"), ["at"]);
});
check("KOTRA·코트라·무역협회가 나오면 각 기관", () => {
  assert.deepEqual(ids("코트라가 본 중국 수출 복병은"), ["kotra"]);
  assert.ok(ids("무역협회와 KOTRA, 공동 수출 상담회").includes("kita"));
  assert.ok(ids("무역협회와 KOTRA, 공동 수출 상담회").includes("kotra"));
});
check("무역보험공사·수출입은행·중진공 → 수출금융기관", () => {
  const found = ids("무역보험공사, 수출입은행, 중진공이 함께 지원");
  assert.deepEqual(found.sort(), ["koreaexim", "kosmes", "ksure"].sort());
});
check("기관 이름이 없으면 빈 목록", () => {
  assert.deepEqual(ids("반도체 수출 증가"), []);
});
check("영어 약어는 다른 영어 단어 속에서는 맞지 않는다", () => {
  assert.deepEqual(ids("Seattle chat"), []);
});
check("기관 id가 겹치지 않고 모든 주소는 https", () => {
  assert.equal(new Set(AGENCIES.map((a) => a.id)).size, AGENCIES.length);
  for (const a of AGENCIES) assert.ok(a.url.startsWith("https://"), a.url);
});

if (failed > 0) { console.log(`\n❌ ${failed}건 실패`); process.exit(1); }
console.log("\n모두 통과했어요.");
