// Design Ref: §2 — 기사에 이름이 나온 수출 협력기관을 찾아 해당 기관의 지원사업 사이트로 연결한다
// 지원단 누리집의 협력기관 목록(협력기관 협의체, Fin-ex, 서비스 수출 협의체)에 있는 기관만 담았다.
// 기관 이름은 규칙(단어 찾기)으로 찾으므로 AI가 기관이나 주소를 지어낼 수 없다.
import { includesKeyword } from "./support.ts";

export type Agency = {
  id: string;
  name: string;
  /** 어떤 지원을 하는 기관인지 쉬운 말 한 줄 */
  description: string;
  url: string;
  /** 기사에 이 이름이 나오면 이 기관으로 본다 */
  aliases: string[];
};

export const AGENCIES: Agency[] = [
  { id: "kotra", name: "KOTRA", description: "바이어 매칭(바이코리아), 해외지사화, 수출바우처, 해외시장 정보를 지원해요.", url: "https://www.kotra.or.kr", aliases: ["KOTRA", "코트라", "대한무역투자진흥공사"] },
  { id: "kita", name: "한국무역협회", description: "무역현장컨설팅, TradePro 1:1 상담, 무역통계를 제공해요.", url: "https://www.kita.net", aliases: ["무역협회", "KITA"] },
  { id: "ksure", name: "한국무역보험공사", description: "수출신용보증, 단기수출보험, 환변동보험 등 무역보험을 지원해요.", url: "https://www.ksure.or.kr", aliases: ["무역보험공사", "K-SURE", "무보"] },
  { id: "koreaexim", name: "한국수출입은행", description: "수출자금 대출, 수출금융 보증, 외국환 업무를 지원해요.", url: "https://www.koreaexim.go.kr", aliases: ["수출입은행", "수은"] },
  { id: "kosmes", name: "중소벤처기업진흥공단", description: "중소벤처기업의 수출·해외진출 정책자금과 온라인 수출 플랫폼을 지원해요.", url: "https://www.kosmes.or.kr", aliases: ["중소벤처기업진흥공단", "중진공"] },
  { id: "kodit", name: "신용보증기금", description: "수출 중소기업의 신용보증을 지원하는 수출금융기관이에요.", url: "https://www.kodit.co.kr", aliases: ["신용보증기금", "신보"] },
  { id: "kibo", name: "기술보증기금", description: "기술력 있는 수출 기업의 보증을 지원하는 수출금융기관이에요.", url: "https://www.kibo.or.kr", aliases: ["기술보증기금", "기보"] },
  { id: "at", name: "한국농수산식품유통공사(aT)", description: "K-푸드 등 농수산식품 수출을 지원해요.", url: "https://www.at.or.kr", aliases: ["aT", "한국농수산식품유통공사", "농수산식품유통공사"] },
  { id: "kobc", name: "한국해양진흥공사", description: "해운·조선 분야 금융과 해양산업 지원을 해요.", url: "https://www.kobc.or.kr", aliases: ["해양진흥공사"] },
  { id: "icak", name: "해외건설협회", description: "해외건설 수주 활동과 수주 이후 애로를 돕는 원스톱 헬프데스크를 운영해요.", url: "https://www.icak.or.kr", aliases: ["해외건설협회"] },
  { id: "kdia", name: "한국방위산업진흥회", description: "방산 수출을 지원해요.", url: "https://www.kdia.or.kr", aliases: ["방위산업진흥회", "방산진흥회"] },
  { id: "krit", name: "국방기술진흥연구소", description: "국방기술 관리와 방산 수출 지원 연구를 해요.", url: "https://www.krit.re.kr", aliases: ["국방기술진흥연구소"] },
  { id: "khidi", name: "한국보건산업진흥원", description: "보건산업의 해외진출과 관세·수출피해를 지원해요.", url: "https://www.khidi.or.kr", aliases: ["보건산업진흥원"] },
  { id: "kocca", name: "한국콘텐츠진흥원", description: "콘텐츠 수출 마케팅(Welcon)과 해외비즈니스센터를 운영해요.", url: "https://www.kocca.kr", aliases: ["콘텐츠진흥원"] },
  { id: "nipa", name: "정보통신산업진흥원", description: "ICT 기업의 해외진출을 지원해요.", url: "https://www.nipa.kr", aliases: ["정보통신산업진흥원", "NIPA"] },
  { id: "kisa", name: "한국인터넷진흥원", description: "정보보호 기업의 해외진출을 지원해요.", url: "https://www.kisa.or.kr", aliases: ["인터넷진흥원", "KISA"] },
  { id: "fintech", name: "핀테크지원센터", description: "핀테크 기업의 해외진출 컨설팅을 지원해요.", url: "https://fintech.or.kr", aliases: ["핀테크지원센터"] },
];

/** 기사 글에 이름이 나온 협력기관을 찾는다 (이름이 나온 순서가 아니라 목록 순서) */
export function findAgencies(text: string): Agency[] {
  return AGENCIES.filter((agency) =>
    agency.aliases.some((alias) => includesKeyword(text, alias)),
  );
}
