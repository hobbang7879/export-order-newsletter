"use client";

// Design Ref: §2 ② 기간 안내 — 공유 날짜 줄(오전/오후, 7일 수집 기간)을 화면에 보여 준다
import { useSyncExternalStore } from "react";
import { getPeriod } from "@/lib/period";

// 시각은 화면을 연 뒤에 바뀌지 않는 값으로 보고 구독은 하지 않는다
const subscribe = () => () => {};
const getBrowserDateLine = () => getPeriod().dateLine;
// 서버에서는 계산하지 않는다 (서버와 브라우저의 시각이 달라 생기는 불일치를 피함)
const getServerDateLine = () => null;

export default function DateLine() {
  const dateLine = useSyncExternalStore(
    subscribe,
    getBrowserDateLine,
    getServerDateLine,
  );

  return (
    <span
      className="inline min-h-7 font-bold"
      aria-live="polite"
    >
      {dateLine ?? "날짜를 계산하는 중이에요…"}
    </span>
  );
}
