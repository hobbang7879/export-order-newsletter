"use client";

// 첫 화면 머리글(바게트 뉴스레터 구조): 로고 상자 → 큰 일러스트(선박 이모지) + 굵은 한 줄 → 날짜·보내는 사람 → 시작 버튼
import DateLine from "./DateLine";

export default function Hero({
  loading,
  onRun,
}: {
  loading: boolean;
  onRun: () => void;
}) {
  return (
    <section aria-labelledby="hero-title" className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">오늘의 항구에는 수출·수주 소식이 들어왔어요</p>

      <div className="rounded-2xl border-2 border-zinc-900 px-8 py-3 dark:border-zinc-100">
        <h1
          id="hero-title"
          className="text-3xl font-extrabold tracking-[0.12em] sm:text-4xl"
          style={{ fontFamily: "Futura, 'Century Gothic', 'SUIT Variable', sans-serif" }}
        >
          EXPORT LETTER
        </h1>
      </div>

      {/* 선박 이모지가 하나로 이어진 파도 위에 떠 있는 일러스트. 화면 낭독에서는 읽지 않는다 */}
      <div
        aria-hidden
        className="relative w-full overflow-hidden rounded-3xl bg-[#eef5fd] pt-8 dark:bg-[#182a47]"
      >
        <div className="flex items-end justify-center gap-3 pb-2 sm:gap-6">
          <span className="text-4xl sm:text-5xl">⚓</span>
          <span className="text-4xl sm:text-5xl">📦</span>
          <span className="ship-bob text-7xl sm:text-8xl">🚢</span>
          <span className="text-4xl sm:text-5xl">🏗️</span>
          <span className="text-4xl sm:text-5xl">🛳️</span>
        </div>
        {/* 이어진 파도: 🌊 이모지처럼 말려 올라가는 물마루와 흰 거품을 그리고, 옆으로 이어 붙인다.
            이모지 아랫부분을 살짝 덮어서 물에 떠 있는 것처럼 보이게 한다 */}
        <svg width="100%" height="110" className="relative -mt-9 block" focusable="false">
          <defs>
            <linearGradient id="wave-deep" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3b8cf0" />
              <stop offset="1" stopColor="#0f3f9c" />
            </linearGradient>
            <linearGradient id="wave-back" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8dbdf6" />
              <stop offset="1" stopColor="#3d7fd6" />
            </linearGradient>
            <pattern id="wave-back-tile" width="260" height="110" patternUnits="userSpaceOnUse" x="-70">
              <path
                d="M0 110 V50 C20 36 44 20 86 18 C122 16 146 32 142 50 C140 60 128 62 122 56 C118 51 124 46 130 48 C150 54 170 56 195 52 C225 47 245 52 260 56 V110 Z"
                fill="url(#wave-back)"
              />
            </pattern>
            <pattern id="wave-front-tile" width="200" height="110" patternUnits="userSpaceOnUse">
              <path
                d="M0 110 V66 C16 48 38 22 80 20 C114 18 140 36 136 58 C134 70 118 74 110 66 C104 60 110 52 118 54 C140 62 168 72 200 66 V110 Z"
                fill="url(#wave-deep)"
              />
              <path
                d="M52 30 C84 16 126 22 133 46"
                fill="none"
                stroke="#ffffff"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.95"
              />
              <path
                d="M136 58 C134 70 118 74 110 66"
                fill="none"
                stroke="#e8f2ff"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="146" cy="64" r="3" fill="#ffffff" />
              <circle cx="158" cy="72" r="2" fill="#ffffff" />
              <circle cx="30" cy="62" r="2.5" fill="#d8e9ff" />
              <path d="M0 92 C30 86 60 98 100 92 C140 86 170 98 200 92" fill="none" stroke="#5aa2f4" strokeWidth="2" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="110" y="0" fill="url(#wave-back-tile)" />
          <rect width="100%" height="110" y="14" fill="url(#wave-front-tile)" />
        </svg>
      </div>

      <p className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
        We <span className="text-blue-600 dark:text-blue-400">SHIP NEWS</span> for you
      </p>
      <p className="-mt-2 self-end text-xs text-zinc-500 dark:text-zinc-400">from 수출플러스지원단</p>

      <div className="flex w-full flex-col items-center gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          이번 호 · <DateLine />
        </p>
        <button
          type="button"
          onClick={onRun}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? "기사를 모으는 중이에요…" : "이번 주 기사 선별"}
        </button>
      </div>
    </section>
  );
}
