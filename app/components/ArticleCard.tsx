// Design Ref: §2 ④ 기사 칸 — 바게트 뉴스레터처럼 파란 띠 제목("#1 이모지 제목") 아래에 본문을 둔다.
// 범위를 넓혀 채운 기사는 노란 띠로 구분하고, 지원 칩은 본문 맨 아래에 작게 둔다
import { AGENCIES } from "@/lib/agencies";
import { SUPPORT_GUIDES } from "@/lib/support";
import type { ClientArticle } from "@/lib/types";
import ExternalLink from "./ExternalLink";

/** "2026-10-07T..." → "2026.10.07" (한국 시간 기준) */
function formatDate(publishedAt: string): string {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(publishedAt));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}.${pick("month")}.${pick("day")}`;
}

const KIND_LABEL = { figure: "숫자", event: "현장", other: "기업" } as const;
/** 기사 종류마다 다른 선박·화물 이모지 (수출은 컨테이너, 행사는 닻, 수주는 배) */
export const KIND_EMOJI = { figure: "📦", event: "⚓", other: "🚢" } as const;

/** 기사 제목 아래에 붙는 번호표 id. 목차에서 이 칸으로 이동할 때 쓴다 */
export const articleAnchor = (number: number) => `article-${number}`;

function Explain({ label, text }: { label: string; text: string }) {
  return (
    <p className="text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">
      <span className="mr-2 font-bold text-blue-600 dark:text-blue-300">{label}</span>
      {text}
    </p>
  );
}

export default function ArticleCard({
  article,
  number,
}: {
  article: ClientArticle;
  /** 공유용 글의 기사 번호와 같은 번호 */
  number: number;
}) {
  const { explain } = article;
  // 화면을 연 채로 앱 코드가 바뀌면 예전 결과에 없는 칸이 있을 수 있어, 없으면 빈 목록으로 본다
  const supportIds = article.supportIds ?? [];
  const agencyIds = article.agencyIds ?? [];
  const guides = SUPPORT_GUIDES.filter((guide) => supportIds.includes(guide.id));
  const agencies = AGENCIES.filter((agency) => agencyIds.includes(agency.id));
  const title = explain?.easy ?? article.title;
  // 색만으로 구분하면 알아보기 어려운 사람도 있어서 "범위를 넓혀 채운 기사" 글자 표시도 함께 붙인다
  const band = article.isExpanded
    ? "bg-yellow-300 text-yellow-950"
    : "bg-blue-600 text-white";

  return (
    <li id={articleAnchor(number)} className="scroll-mt-20 list-none">
      <h3 className={`px-4 py-3 text-base font-bold leading-snug sm:text-lg ${band}`}>
        <span className="mr-2">#{number}</span>
        {explain && (
          <span aria-hidden className="mr-1">
            {explain.emoji}
          </span>
        )}
        {title}
      </h3>

      <div className="flex flex-col gap-3 px-1 py-5">
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-5xl leading-tight">
            {KIND_EMOJI[article.kind]}
          </span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-bold text-blue-600 dark:text-blue-300">
              {article.isExpanded ? "범위를 넓혀 채움" : KIND_LABEL[article.kind]}
            </span>
            {" · "}
            {article.source} · {formatDate(article.publishedAt)}
          </p>
        </div>

        {explain && (
          <>
            <Explain label="뭐라고?" text={explain.what} />
            <Explain label="왜 중요해?" text={explain.why} />
            <p className="text-xs text-zinc-400 dark:text-zinc-500">원문 제목: {article.title}</p>
          </>
        )}

        {(guides.length > 0 || agencies.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {guides.map((guide) => (
              <ExternalLink
                key={guide.id}
                href={guide.links[0].url}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <span aria-hidden>{guide.emoji}</span> 관련 지원: {guide.title}
              </ExternalLink>
            ))}
            {agencies.map((agency) => (
              <ExternalLink
                key={agency.id}
                href={agency.url}
                className="rounded-full border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-950/50"
              >
                <span aria-hidden>🏛️</span> 협력기관: {agency.name}
              </ExternalLink>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <ExternalLink
            href={article.url}
            className="w-fit shrink-0 rounded-lg border border-zinc-900 px-4 py-2 text-sm font-bold hover:bg-zinc-900 hover:text-white dark:border-zinc-100 dark:hover:bg-zinc-100 dark:hover:text-zinc-900"
          >
            원문 보기 ↗
          </ExternalLink>
          {/* 버튼 옆 한 줄 요약: 이 기사가 무슨 내용인지 눌러 보기 전에 알 수 있게 한다 */}
          {explain?.summary && (
            <p className="min-w-0 flex-1 basis-56 text-sm leading-snug text-zinc-600 dark:text-zinc-300">
              <span className="mr-1.5 font-bold text-zinc-900 dark:text-zinc-50">요약</span>
              {explain.summary}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
