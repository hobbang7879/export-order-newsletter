// lib/regions.ts 확인용 스크립트 (인터넷 없이 돌아감): node scripts/check-regions.mjs
import assert from "node:assert/strict";
import { REGIONS, findRegion } from "../lib/regions.ts";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log(`✅ ${name}`); }
  catch (e) { failed += 1; console.log(`❌ ${name}\n   ${e.message}`); }
}
const id = (t) => findRegion(t)?.id ?? null;

check("경북·포항·구미 → 대경권", () => {
  assert.equal(id("경북 포항 수출 상담회 개최"), "daegyeong");
  assert.equal(id("구미 반도체 기업 수주"), "daegyeong");
});
check("부산·울산·창원·거제 → 동남권", () => {
  assert.equal(id("부산항 수출 물동량 증가"), "dongnam");
  assert.equal(id("거제 조선소 수주 확대"), "dongnam");
});
check("경기도·동탄·인천 → 수도권", () => {
  assert.equal(id("“리투오 연내 美 진출…동탄에 글로벌 생산거점 구축”"), "capital");
  assert.equal(id("인천 송도 바이오 수출"), "capital");
});
check("포천·의정부 같은 경기 도시도 수도권", () => {
  assert.equal(id("백영현 포천시장 K방위산업 수출기지로 키우겠다"), "capital");
});
check("충북·충남·대전·세종시 → 충청권, 전남·전북 → 호남권, 강원·제주", () => {
  assert.equal(id("충북 청주 수출 설명회"), "chungcheong");
  assert.equal(id("전남 여수 수출 기지"), "honam");
  assert.equal(id("강원 춘천 수출"), "gangwon");
  assert.equal(id("제주 감귤 수출"), "jeju");
});
check("서울경제 같은 매체 이름이나 '경기 침체'는 지역으로 보지 않는다", () => {
  assert.equal(id("서울경제 보도: 경기 침체 우려 속 수출 증가"), null);
  assert.equal(id("서울에서 열린 수출 설명회"), null);
});
check("지역 말이 여러 개면 글에서 가장 먼저 나온 권역", () => {
  assert.equal(id("대구 기업, 부산항으로 수출"), "daegyeong");
  assert.equal(id("부산항을 통해 대구 기업이 수출"), "dongnam");
});
check("지역이 없으면 null", () => {
  assert.equal(id("한국 HBM 수출 200배 뛴 말레이시아…이유는?"), null);
});
check("권역 id와 이름이 겹치지 않는다", () => {
  assert.equal(new Set(REGIONS.map((r) => r.id)).size, REGIONS.length);
  assert.equal(new Set(REGIONS.map((r) => r.name)).size, REGIONS.length);
});

if (failed > 0) { console.log(`\n❌ ${failed}건 실패`); process.exit(1); }
console.log("\n모두 통과했어요.");
