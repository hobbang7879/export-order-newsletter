// Design Ref: §3.1 단계 1, §8 module-1 — 날짜 줄과 수집 기간 계산
// Plan SC: 작업 2 — 공유일(월요일)·수집 기간·날짜 줄 계산

/**
 * 수집 기간이 시작하는 날은 "공유 월요일의 6일 전"(= 직전 월요일의 다음 날) 0시다.
 * 예: 10.12(월) 공유분은 10.6(화) 0시부터, 10.19(월) 공유분은 10.13(화) 0시부터.
 * 끝은 공유 월요일 오전 9시다. (10.12 오전 9시 ~ 밤 12시 기사는 어느 주에도 들어가지 않는다)
 */
const START_DAYS_BEFORE_SHARE_DAY = 6;

const DAY_MS = 24 * 60 * 60 * 1000;

export type Period = {
  /** 수집 기간 시작 (공유 월요일의 6일 전, 화요일 0시. 한국 시간) */
  start: Date;
  /** 수집 기간 끝 (공유 시각. 월요일) */
  end: Date;
  /** 공유 시각이 12시 전이면 "오전", 이후면 "오후" (공유 시각이 항상 월요일 오전 9시라 늘 "오전") */
  meridiem: "오전" | "오후";
  /** 예: "26.10.15. 목(10.8.-10.15. 오전)" */
  dateLine: string;
};

/** 한국 시간(Asia/Seoul) 기준으로 날짜·시각 조각을 꺼낸다 */
function getKoreaParts(date: Date) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "2-digit",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    weekday: pick("weekday"),
    hour: Number(pick("hour")),
  };
}

/** 한국 시간은 UTC보다 9시간 빠르다 (서머타임 없음) */
const KOREA_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 매주 월요일의 기간 마감 시각 (한국 시간 오전 9시) */
const DEFAULT_SHARE_HOUR = 9;

/**
 * 기간의 끝(공유 시각)을 정한다. 주간 뉴스레터는 매주 월요일에 보내고,
 * 그 주의 기사는 월요일 오전 9시까지로 한정한다.
 * - 오늘(한국 시간)이 월요일이면 오늘 오전 9시
 * - 월요일이 아니면 가장 최근 월요일 오전 9시
 * 예: 10.12(월)에 만든 뉴스레터는 10.6(화) 0시 ~ 10.12(월) 9시, 다음 주는 10.13(화) 0시 ~ 10.19(월) 9시
 */
export function getShareTime(now: Date): Date {
  const korea = new Date(now.getTime() + KOREA_OFFSET_MS); // UTC 메서드로 한국 시각을 읽기 위한 값
  const daysSinceMonday = (korea.getUTCDay() + 6) % 7; // 월=0, 화=1, … 일=6

  const koreaMidnight = Date.UTC(
    korea.getUTCFullYear(),
    korea.getUTCMonth(),
    korea.getUTCDate(),
  ) - KOREA_OFFSET_MS;
  return new Date(
    koreaMidnight - daysSinceMonday * DAY_MS + DEFAULT_SHARE_HOUR * 60 * 60 * 1000,
  );
}

/**
 * 현재 시각(now)을 받아 공유일(월요일) 기준의 수집 기간과 날짜 줄을 만든다.
 * - 앞부분: 공유 날짜(월요일)·요일
 * - 괄호: 직전 화요일 0시부터 공유 월요일 오전 9시까지의 수집 기간, 그리고 오전/오후
 */
export function getPeriod(now: Date = new Date()): Period {
  const shareTime = getShareTime(now);
  const shareDayMidnight = shareTime.getTime() - DEFAULT_SHARE_HOUR * 60 * 60 * 1000;
  const start = new Date(shareDayMidnight - START_DAYS_BEFORE_SHARE_DAY * DAY_MS);

  const end = getKoreaParts(shareTime);
  const begin = getKoreaParts(start);

  const meridiem = end.hour < 12 ? "오전" : "오후";

  // 담당자가 쓰던 양식: "26.10.12. 월(10.7.-10.12. 오전)"
  const dateLine =
    `${end.year}.${end.month}.${end.day}. ${end.weekday}` +
    `(${begin.month}.${begin.day}.-${end.month}.${end.day}. ${meridiem})`;

  return { start, end: shareTime, meridiem, dateLine };
}
