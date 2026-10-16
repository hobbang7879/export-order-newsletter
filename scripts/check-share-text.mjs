// lib/share-text.ts 확인용 스크립트: 담당자가 직접 만든 양식(10건)과 글자 단위로 같은지 비교한다
// 실행: node scripts/check-share-text.mjs  (인터넷·API 키 없이 돌아감)
import assert from "node:assert/strict";
import { buildShareText, formatArticleDate } from "../lib/share-text.ts";

// 담당자 양식 예시의 10건. 날짜는 한국 시간 정오로 둔다.
const rows = [
  ["현대로템, K2 주축으로 첨단무기 수출… 유럽 넘어 중남미도 뚫었다", "2026-10-07", "매일경제", "https://www.mk.co.kr/news/special-edition/12170531"],
  ["KAI, 6G 저궤도위성 들고 안탈리아행…수출 고객 찾는다", "2026-10-07", "서울경제", "https://m.sedaily.com/article/20099071"],
  ["AI 순찰로봇·치안드론 한자리에…경찰, 국제치안산업대전 개최", "2026-10-07", "서울경제", "https://m.sedaily.com/article/20098952"],
  ["KT&G, 인도네시아 신공장 가동…해외 최대 생산기지로 키운다", "2026-10-07", "서울경제", "https://m.sedaily.com/article/20099046"],
  ["8월 경상수지 흑자 461억달러 ‘역대 2위’…반도체 수출호조 영향", "2026-10-08", "서울경제", "https://m.sedaily.com/article/20099334"],
  ["K바이오의약품 수출 66억弗 ‘최대’…유럽서 날았다", "2026-10-08", "서울경제", "https://m.sedaily.com/article/20099595"],
  ["해외 상품 팔던 백화점, 이제 K브랜드 싣고 세계로", "2026-10-09", "서울경제", "https://m.sedaily.com/article/20099866"],
  ["넷플릭스 타고…K드라마 수출 7년 새 3배", "2026-10-09", "한국경제", "https://www.hankyung.com/article/2026100928701"],
  ["일·중 홀린 프리미엄 군산 김…1억달러 수출 계약 성사", "2026-10-09", "한국경제", "https://www.hankyung.com/article/202610092706i"],
  ["\"립스틱 색깔마다 인증 받아야\"…코트라가 본 중국 수출 '복병'은", "2026-10-10", "한국경제", "https://www.hankyung.com/article/202610103537i"],
];

const articles = rows.map(([title, date, source, url], i) => ({
  id: String(i), title, url, source, publishedAt: `${date}T12:00:00+09:00`,
  hasNumber: false, isExpanded: false,
}));

// 담당자가 보낸 양식 그대로 (8번 기사의 줄바꿈만 한 줄로 맞춤)
const expected = `[수출•수주 동향 기사]
26.10.12. 월(10.7.-10.12. 오전)

1. 현대로템, K2 주축으로 첨단무기 수출… 유럽 넘어 중남미도 뚫었다 (26.10.7. 매일경제)
https://www.mk.co.kr/news/special-edition/12170531

2. KAI, 6G 저궤도위성 들고 안탈리아행…수출 고객 찾는다 (26.10.7. 서울경제)
https://m.sedaily.com/article/20099071

3. AI 순찰로봇·치안드론 한자리에…경찰, 국제치안산업대전 개최 (26.10.7. 서울경제)
https://m.sedaily.com/article/20098952

4. KT&G, 인도네시아 신공장 가동…해외 최대 생산기지로 키운다 (26.10.7. 서울경제)
https://m.sedaily.com/article/20099046

5. 8월 경상수지 흑자 461억달러 ‘역대 2위’…반도체 수출호조 영향 (26.10.8. 서울경제)
https://m.sedaily.com/article/20099334

6. K바이오의약품 수출 66억弗 ‘최대’…유럽서 날았다 (26.10.8. 서울경제)
https://m.sedaily.com/article/20099595

7. 해외 상품 팔던 백화점, 이제 K브랜드 싣고 세계로 (26.10.9. 서울경제)
https://m.sedaily.com/article/20099866

8. 넷플릭스 타고…K드라마 수출 7년 새 3배 (26.10.9. 한국경제)
https://www.hankyung.com/article/2026100928701

9. 일·중 홀린 프리미엄 군산 김…1억달러 수출 계약 성사 (26.10.9. 한국경제)
https://www.hankyung.com/article/202610092706i

10. "립스틱 색깔마다 인증 받아야"…코트라가 본 중국 수출 '복병'은 (26.10.10. 한국경제)
https://www.hankyung.com/article/202610103537i`;

let failed = 0;
function check(name, fn) {
  try { fn(); console.log(`✅ ${name}`); }
  catch (e) { failed += 1; console.log(`❌ ${name}\n   ${e.message}`); }
}

check("담당자 양식 10건과 글자 단위로 같다", () => {
  assert.equal(buildShareText("26.10.12. 월(10.7.-10.12. 오전)", articles), expected);
});
check("기사 날짜는 한국 시간 기준 YY.M.D. (0을 붙이지 않음)", () => {
  assert.equal(formatArticleDate("2026-10-07T12:00:00+09:00"), "26.10.7.");
  assert.equal(formatArticleDate("2026-01-05T08:00:00+09:00"), "26.1.5.");
});
check("UTC로 전날 밤인 기사도 한국 날짜로 쓴다 (UTC 10.6 16:00 = 한국 10.7 01:00)", () => {
  assert.equal(formatArticleDate("2026-10-06T16:00:00Z"), "26.10.7.");
});
check("요약·배지는 공유용 글에 들어가지 않는다", () => {
  const text = buildShareText("26.10.12. 월(10.6.-10.12. 오전)", [
    { ...articles[0], summary: "이건 요약입니다", isExpanded: true, snippet: "앞부분", sourceCount: 3 },
  ]);
  assert.ok(!text.includes("요약입니다") && !text.includes("앞부분") && !text.includes("확장"));
});
check("기사가 0건이어도 제목과 날짜 줄은 나온다", () => {
  assert.equal(buildShareText("26.10.12. 월(10.6.-10.12. 오전)", []), "[수출•수주 동향 기사]\n26.10.12. 월(10.6.-10.12. 오전)");
});

if (failed > 0) { console.log(`\n❌ ${failed}건 실패`); process.exit(1); }
console.log("\n모두 통과했어요.");
