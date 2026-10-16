"use client";

// 파랑으로 선택 표시가 미끄러지듯 옮겨 가는 탭. 탭 너비를 똑같이 나눠서 표시 위치를 계산 없이 정한다.
// 접근성: 화살표 키(←/→)로 옮기고, 선택한 탭만 Tab 키로 들어갈 수 있다 (표준 탭 동작)
import { useId, useRef, type ReactNode } from "react";

export type TabItem = { id: string; label: string; icon?: string };

export default function Tabs({
  tabs,
  value,
  onChange,
  variant = "pill",
  label,
  children,
}: {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  /** pill: 파란 알약이 미끄러짐 / underline: 파란 밑줄이 미끄러짐 */
  variant?: "pill" | "underline";
  label: string;
  /** 선택한 탭의 내용. 탭이 바뀔 때마다 살짝 떠오르며 나타난다 */
  children: ReactNode;
}) {
  const uid = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(0, tabs.findIndex((t) => t.id === value));
  const width = `${100 / tabs.length}%`;

  function move(next: number) {
    const target = (next + tabs.length) % tabs.length;
    onChange(tabs[target].id);
    refs.current[target]?.focus();
  }

  const pill = variant === "pill";

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label={label}
        className={
          pill
            ? "relative grid rounded-full bg-zinc-100 p-1 dark:bg-zinc-800"
            : "relative grid border-b border-zinc-200 dark:border-zinc-800"
        }
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {/* 선택 표시: 탭을 옮길 때마다 부드럽게 미끄러진다 */}
        <span
          aria-hidden
          className={`tab-indicator pointer-events-none absolute transition-transform duration-300 ease-out ${
            pill
              ? "inset-y-1 left-1 rounded-full bg-blue-600 shadow-sm"
              : "bottom-0 left-0 h-0.5 bg-blue-600"
          }`}
          style={{
            width: pill ? `calc((100% - 0.5rem) / ${tabs.length})` : width,
            transform: `translateX(${index * 100}%)`,
          }}
        />
        {tabs.map((tab, i) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") move(i + 1);
                if (e.key === "ArrowLeft") move(i - 1);
              }}
              className={`relative z-10 px-3 text-sm font-bold transition-colors duration-200 active:scale-[0.97] ${
                pill ? "rounded-full py-2" : "pb-3 pt-1"
              } ${
                selected
                  ? pill
                    ? "text-white"
                    : "text-blue-600 dark:text-blue-300"
                  : "text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-300"
              }`}
            >
              {tab.icon && (
                <span aria-hidden className="mr-1">
                  {tab.icon}
                </span>
              )}
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        key={value}
        role="tabpanel"
        id={`${uid}-panel`}
        aria-labelledby={`${uid}-tab-${value}`}
        className="tab-panel-in"
      >
        {children}
      </div>
    </div>
  );
}
