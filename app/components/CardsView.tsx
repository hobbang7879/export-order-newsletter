"use client";

// 핸드폰 화면처럼 기사를 한 장씩 넘겨 보는 카드 화면. 카드를 누르면 원문 기사가 새 탭으로 열린다
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useArticleImages } from "@/lib/article-images";
import {
  getSavedNewsletterRaw,
  subscribeNewsletter,
} from "@/lib/saved-newsletter";
import type { ClientArticle, NewsletterResponse } from "@/lib/types";
import ExternalLink from "./ExternalLink";

const getServerRaw = () => null;
const SWIPE_PX = 50;

function formatDate(publishedAt: string): string {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(publishedAt));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("month")}.${pick("day")}.`;
}

function Card({ article, number, image }: { article: ClientArticle; number: number; image?: string }) {
  const [failed, setFailed] = useState(false);
  const { explain } = article;
  const title = explain?.easy ?? article.title;
  return (
    <div className="flex h-full w-full shrink-0 flex-col">
      <ExternalLink href={article.url} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700">
          {image && !failed ? (
            // 기사 페이지의 대표 이미지를 주소로만 연결한다 (저장하지 않음). 출처 차단을 피하려 referrer를 보내지 않는다
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setFailed(true)}
              className="size-full object-cover"
            />
          ) : (
            <span aria-hidden className="flex size-full items-center justify-center text-7xl">
              {explain?.emoji ?? "📰"}
            </span>
          )}
          <span className="absolute left-3 top-3 flex size-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {number}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {article.source} · {formatDate(article.publishedAt)}
            {article.isExpanded && " · 범위를 넓혀 채운 기사"}
          </p>
          <h2 className="text-xl font-extrabold leading-snug text-zinc-950 dark:text-zinc-50">
            {explain && <span aria-hidden className="mr-1.5">{explain.emoji}</span>}
            {title}
          </h2>
          {explain && (
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{explain.what}</p>
          )}
          <span className="mt-auto w-fit rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">
            원문 기사 보기 ↗
          </span>
        </div>
      </ExternalLink>
    </div>
  );
}

export default function CardsView() {
  const raw = useSyncExternalStore(subscribeNewsletter, getSavedNewsletterRaw, getServerRaw);
  const data = useMemo<NewsletterResponse | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as NewsletterResponse;
    } catch {
      return null;
    }
  }, [raw]);
  const articles = useMemo(() => data?.articles ?? [], [data]);

  const [index, setIndex] = useState(0);
  const images = useArticleImages(useMemo(() => articles.map((a) => a.url), [articles]));
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const last = articles.length - 1;
  const go = (next: number) => setIndex(Math.min(Math.max(next, 0), last));

  if (raw === null || articles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-zinc-50 p-8 text-center dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          아직 선별한 기사가 없어요. 목록 화면에서 &quot;기사 선별&quot;을 먼저 눌러 주세요.
        </p>
        <Link href="/" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
          목록으로 가서 기사 선별하기
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        옆으로 밀거나 화살표로 넘겨 보세요. 카드를 누르면 원문이 새 탭에서 열려요.
      </p>
      <div
        role="region"
        aria-roledescription="카드 넘기기"
        aria-label="기사 카드"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(index + 1);
          if (e.key === "ArrowLeft") go(index - 1);
        }}
        className="w-full max-w-[22rem] rounded-[2.5rem] border-[10px] border-zinc-900 bg-white shadow-xl dark:border-zinc-700"
      >
        <div
          className="h-[34rem] overflow-hidden rounded-[1.9rem]"
          onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStart === null) return;
            const diff = e.changedTouches[0].clientX - touchStart;
            if (diff <= -SWIPE_PX) go(index + 1);
            if (diff >= SWIPE_PX) go(index - 1);
            setTouchStart(null);
          }}
        >
          <div
            className="flex h-full transition-transform duration-300"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {articles.map((article, i) => (
              <Card key={article.id} article={article} number={i + 1} image={images[article.url]} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="이전 기사"
          className="flex size-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white hover:bg-blue-700 disabled:opacity-30"
        >
          ←
        </button>
        <span className="min-w-14 text-center text-sm font-bold">
          {index + 1} / {articles.length}
        </span>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === last}
          aria-label="다음 기사"
          className="flex size-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white hover:bg-blue-700 disabled:opacity-30"
        >
          →
        </button>
      </div>
    </>
  );
}
