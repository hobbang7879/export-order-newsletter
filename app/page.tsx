import SiteHeader from "./components/SiteHeader";
import NewsletterApp from "./components/NewsletterApp";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white font-sans text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pb-16 pt-10 sm:px-6">
        <NewsletterApp />
      </main>
      <footer className="mx-auto w-full max-w-5xl border-t border-zinc-200 px-4 py-8 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 sm:px-6">
        매일경제·한국경제·서울경제·아시아경제 기사의 제목과 링크만 사용해요. 해설은 AI가 쓴 것이니 공유 전에 원문과 맞는지 한 번 확인해 주세요.
      </footer>
    </div>
  );
}
