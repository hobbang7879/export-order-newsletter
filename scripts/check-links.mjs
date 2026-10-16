// 화면의 모든 링크(<a>)가 새 탭으로 열리는지 소스에서 확인한다: node scripts/check-links.mjs
import { readdirSync, readFileSync } from "node:fs";

const dir = new URL("../app/components/", import.meta.url);
let total = 0;
let bad = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".tsx"))) {
  // 같은 페이지 안에서 움직이는 목차 링크(href="#…")는 새 탭이 아니라 현재 화면에서 이동하는 것이 맞아서 검사에서 뺀다
  const source = readFileSync(new URL(file, dir), "utf-8").replace(/<a\b[^>]*href=\{`#[\s\S]*?<\/a>/g, "");
  // 바깥 링크는 ExternalLink 부품만 쓴다. 그냥 <a>는 ExternalLink.tsx 안에서만 허용
  if (file !== "ExternalLink.tsx" && /<a\b/.test(source)) {
    bad += 1;
    console.log(`❌ ${file}: <a>를 직접 쓰지 말고 ExternalLink를 쓰세요`);
  }
  for (const match of source.matchAll(/<a\b[\s\S]*?>/g)) {
    total += 1;
    const tag = match[0];
    const ok = tag.includes('target="_blank"') && tag.includes('rel="noopener noreferrer"') && source.includes("window.open(");
    if (!ok) {
      bad += 1;
      console.log(`❌ ${file}: 새 탭(target="_blank" + rel="noopener noreferrer")이 빠진 링크\n   ${tag.replace(/\s+/g, " ").slice(0, 100)}`);
    }
  }
}
if (bad > 0) { console.log(`\n❌ ${bad}/${total}개 링크가 새 탭 설정이 없어요`); process.exit(1); }
console.log(`✅ 링크 ${total}곳 모두 새 탭으로 열려요 (target="_blank", rel="noopener noreferrer")\n\n모두 통과했어요.`);
