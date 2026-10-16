// Design Ref: §10 지역별 보기 — 기사를 권역별로 묶는다
// 기사 제목·앞부분의 지역 이름(시·도, 대표 시·군)으로 권역을 찾는 규칙이다. AI가 지역 사실을 만들지 않는다.
// 권역별 주력 수출 품목·애로 대응 자료는 설명회 이후 담당자가 정리해 담을 예정이라 아직 넣지 않았다.
import { includesKeyword } from "./support.ts";

export type Region = {
  id: string;
  /** 화면에 보이는 이름 */
  name: string;
  /** 기사에 이 말이 있으면 이 권역으로 본다 (시·도 이름과 대표 시·군) */
  aliases: string[];
};

/**
 * 7개 권역. "서울", "경기", "광주"처럼 다른 뜻으로 자주 쓰이는 말은 일부러 뺐다
 * (서울경제 같은 매체 이름, "경기 침체", 경기도 광주시와 광주광역시 혼동).
 */
export const REGIONS: Region[] = [
  { id: "capital", name: "수도권", aliases: ["서울시", "서울특별시", "경기도", "인천", "수원", "성남", "화성", "평택", "용인", "안산", "고양", "부천", "시흥", "파주", "동탄", "판교", "포천", "의정부", "양주", "남양주", "하남", "광명", "안양", "군포", "이천", "김포", "안성", "양평", "가평"] },
  { id: "chungcheong", name: "충청권", aliases: ["대전", "세종시", "충북", "충청북도", "충남", "충청남도", "충청", "청주", "충주", "천안", "아산", "당진", "서산"] },
  { id: "honam", name: "호남권", aliases: ["광주광역시", "전북", "전라북도", "전남", "전라남도", "호남", "전주", "군산", "익산", "목포", "여수", "순천", "광양"] },
  { id: "daegyeong", name: "대경권", aliases: ["대구", "경북", "경상북도", "포항", "구미", "안동", "경주", "영주"] },
  { id: "dongnam", name: "동남권", aliases: ["부산", "울산", "경남", "경상남도", "창원", "거제", "김해", "진주", "양산", "통영"] },
  { id: "gangwon", name: "강원권", aliases: ["강원", "춘천", "원주", "강릉", "속초", "동해시", "평창"] },
  { id: "jeju", name: "제주권", aliases: ["제주"] },
];

/** 지역을 찾지 못한 기사를 모아 두는 이름 */
export const NO_REGION_NAME = "전국 · 지역 구분 없음";

/**
 * 기사 글에서 권역을 찾는다. 여러 권역의 말이 나오면 글에서 가장 먼저 나온 권역으로 본다.
 * 찾지 못하면 null.
 */
export function findRegion(text: string): Region | null {
  let best: { region: Region; index: number } | null = null;
  for (const region of REGIONS) {
    for (const alias of region.aliases) {
      if (!includesKeyword(text, alias)) continue;
      const index = text.indexOf(alias);
      if (index >= 0 && (best === null || index < best.index)) {
        best = { region, index };
      }
    }
  }
  return best ? best.region : null;
}
