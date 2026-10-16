import CardsView from "../components/CardsView";
import SiteHeader from "../components/SiteHeader";

export default function CardsPage() {
  return (
    <div className="flex flex-1 flex-col bg-white font-sans text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-8 sm:px-6">
        <CardsView />
      </main>
    </div>
  );
}
