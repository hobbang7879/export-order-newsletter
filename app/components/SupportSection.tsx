"use client";

// Design Ref: §2 — 이번 주 기사와 관련된 공유·지원 안내. 탭(공유용 글 / 지원 안내 / 협력기관 / 바로가기)으로 나눠 보여 준다
import { useState } from "react";
import { SUPPORT_PHONE, SUPPORT_SHORTCUTS } from "@/lib/support";
import type { AgencySummary, SupportSummary } from "@/lib/types";
import ExternalLink from "./ExternalLink";
import SharePreview from "./SharePreview";
import Tabs from "./Tabs";

const linkClass = "text-sm font-bold text-blue-600 hover:underline dark:text-blue-300";
const empty = "rounded-xl bg-zinc-50 p-5 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300";

export default function SupportSection({
  shareText,
  support,
  agencies,
}: {
  shareText: string;
  support: SupportSummary[];
  agencies: AgencySummary[];
}) {
  const [tab, setTab] = useState("share");

  return (
    <Tabs
      label="공유와 지원 안내"
      value={tab}
      onChange={setTab}
      tabs={[
        { id: "share", label: "공유용 글", icon: "✉️" },
        { id: "guides", label: `지원 안내 ${support.length}`, icon: "🧰" },
        { id: "agencies", label: `협력기관 ${agencies.length}`, icon: "🏛️" },
        { id: "shortcuts", label: "바로가기", icon: "🔗" },
      ]}
    >
      {tab === "share" && <SharePreview text={shareText} />}

      {tab === "guides" &&
        (support.length === 0 ? (
          <p className={empty}>
            이번 기사들과 바로 이어지는 지원 분야는 찾지 못했어요. &quot;바로가기&quot; 탭에서 필요한 지원을 찾아보세요.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {support.map(({ guide, articleNumbers }) => (
              <li
                key={guide.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-blue-400 dark:border-zinc-800 dark:hover:border-blue-500"
              >
                <p className="font-bold text-zinc-950 dark:text-zinc-50">
                  <span aria-hidden className="mr-1.5">
                    {guide.emoji}
                  </span>
                  {guide.title}
                  <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                    관련 기사 {articleNumbers.join(", ")}번
                  </span>
                </p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{guide.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {guide.links.map((link) => (
                    <ExternalLink key={link.url + link.label} href={link.url} className={linkClass}>
                      {link.label}
                    </ExternalLink>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ))}

      {tab === "agencies" &&
        (agencies.length === 0 ? (
          <p className={empty}>이번 기사에 나온 협력기관은 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {agencies.map(({ agency, articleNumbers }) => (
              <li
                key={agency.id}
                className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-700 transition-colors hover:border-blue-400 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-blue-500"
              >
                <ExternalLink href={agency.url} className={linkClass}>
                  {agency.name}
                </ExternalLink>
                <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                  관련 기사 {articleNumbers.join(", ")}번
                </span>
                <br />
                {agency.description}
              </li>
            ))}
          </ul>
        ))}

      {tab === "shortcuts" && (
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">수출 플러스 지원단 바로가기</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {SUPPORT_SHORTCUTS.map((link) => (
              <ExternalLink key={link.url} href={link.url} className={linkClass}>
                {link.label}
              </ExternalLink>
            ))}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">대표전화 {SUPPORT_PHONE}</p>
        </div>
      )}
    </Tabs>
  );
}
