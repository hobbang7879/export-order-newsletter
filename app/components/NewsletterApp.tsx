"use client";

// Design Ref: §2 ②~⑤ — 배너(기사 선별 버튼), 상태 안내, 탭(기사 / 공유·유관 기관), 기사 격자
import { useMemo, useState } from "react";
import { saveNewsletter } from "@/lib/saved-newsletter";
import { NO_REGION_NAME, REGIONS } from "@/lib/regions";
import type { ClientArticle, NewsletterResponse } from "@/lib/types";
import ArticleCard, { articleAnchor } from "./ArticleCard";
import Hero from "./Hero";
import Tabs from "./Tabs";
import SupportSection from "./SupportSection";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; data: NewsletterResponse };

type Tab = "articles" | "share";

type Item = { article: ClientArticle; number: number };
type Group = { id: string; title: string; items: Item[] };

/** 기사를 권역별로 묶는다. 지역을 찾지 못한 기사는 마지막 칸에 둔다 */
function groupByRegion(items: Item[]): Group[] {
  const groups: Group[] = REGIONS.map((region) => ({
    id: region.id,
    title: region.name,
    items: items.filter(({ article }) => article.regionId === region.id),
  }));
  groups.push({
    id: "none",
    title: NO_REGION_NAME,
    items: items.filter(
      ({ article }) =>
        !article.regionId || !REGIONS.some((region) => region.id === article.regionId),
    ),
  });
  return groups.filter((group) => group.items.length > 0);
}

export default function NewsletterApp() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [tab, setTab] = useState<Tab>("articles");
  // 기본은 한 장의 격자. "권역별로 묶기"를 켜면 기사를 지역(권역)별로 묶어 보여 준다
  const [byRegion, setByRegion] = useState(false);

  async function run() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/newsletter", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setState({
          status: "error",
          message: body.error ?? "뉴스레터를 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.",
        });
        return;
      }
      saveNewsletter(body as NewsletterResponse);
      setTab("articles");
      setState({ status: "done", data: body as NewsletterResponse });
    } catch {
      setState({
        status: "error",
        message: "서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.",
      });
    }
  }

  const loading = state.status === "loading";
  const articles = useMemo(
    () => (state.status === "done" ? state.data.articles : []),
    [state],
  );

  const numbered: Item[] = articles.map((article, index) => ({ article, number: index + 1 }));
  const groups: Group[] = byRegion
    ? groupByRegion(numbered)
    : [{ id: "all", title: "", items: numbered }];

  return (
    <>
      <Hero loading={loading} onRun={run} />

      {state.status === "idle" && (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          &quot;이번 주 기사 선별&quot;을 누르면 20초쯤 뒤에 기사가 나와요.
        </p>
      )}

      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
        >
          {state.message}
        </p>
      )}

      {state.status === "done" && (
        <>
          {state.data.notice && (
            <p
              role="status"
              className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-100"
            >
              {state.data.notice}
            </p>
          )}

          <Tabs
            variant="underline"
            label="화면 나누기"
            value={tab}
            onChange={(id) => setTab(id as Tab)}
            tabs={[
              { id: "articles", label: `이번 주 기사 ${articles.length}`, icon: "🚢" },
              { id: "share", label: "공유 · 유관 기관", icon: "⚓" },
            ]}
          >
          {tab === "articles" &&
            (articles.length === 0 ? (
              <p className="rounded-2xl bg-zinc-50 p-6 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                이번 기간에 찾은 기사가 없어요.
              </p>
            ) : (
              <section className="mx-auto flex w-full max-w-2xl flex-col gap-10" >
                {/* 목차: 바게트 뉴스레터의 "빵 나오는 순서"처럼 이번 호 기사를 먼저 훑어 보게 한다 */}
                <nav aria-label="이번 호 목차" className="flex flex-col gap-3">
                  <h2 className="text-xl font-extrabold">배 들어오는 순서</h2>
                  <ol className="flex flex-col gap-1.5 text-[15px]">
                    {numbered.map(({ article, number }) => (
                      <li key={article.id}>
                        <a
                          href={`#${articleAnchor(number)}`}
                          className="hover:text-blue-600 hover:underline dark:hover:text-blue-300"
                        >
                          <span className="mr-1 font-bold text-blue-600 dark:text-blue-300">#{number}</span>
                          {article.explain && <span aria-hidden className="mr-1">{article.explain.emoji}</span>}
                          {article.explain?.easy ?? article.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                  <label className="mt-1 flex w-fit items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={byRegion}
                      onChange={(e) => setByRegion(e.target.checked)}
                      className="size-4 accent-blue-600"
                    />
                    권역별로 묶어 보기
                  </label>
                </nav>

                {groups.map((group) => (
                  <div key={group.id} className="flex flex-col gap-6">
                    {group.title && (
                      <h2 className="text-lg font-extrabold">
                        {group.title}
                        <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
                          {group.items.length}건
                        </span>
                      </h2>
                    )}
                    <ul className="flex flex-col gap-10">
                      {group.items.map(({ article, number }) => (
                        <ArticleCard key={article.id} article={article} number={number} />
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))}

          {tab === "share" && (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
              <SupportSection
                shareText={state.data.shareText}
                support={state.data.support ?? []}
                agencies={state.data.agencies ?? []}
              />
            </div>
          )}
          </Tabs>
        </>
      )}
    </>
  );
}
