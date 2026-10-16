"use client";

// Design Ref: §2 ⑤ 공유용 글 미리보기와 복사 버튼
import { useState } from "react";

export default function SharePreview({ text }: { text: string }) {
  const [message, setMessage] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("복사했어요. 텔레그램에 붙여넣어 주세요.");
    } catch {
      // 복사 권한이 없는 브라우저에서는 아래 글을 직접 선택해 복사하도록 안내한다
      setMessage("복사하지 못했어요. 아래 글을 직접 선택해서 복사해 주세요.");
    }
  }

  return (
    <section className="flex flex-col gap-3 border-t-2 border-zinc-950 pt-6 dark:border-zinc-50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50">
          지원단에 공유하기
        </h2>
        <button
          type="button"
          onClick={copy}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
        >
          공유용 글 복사
        </button>
      </div>
      <p className="min-h-5 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
        {message}
      </p>
      <pre className="whitespace-pre-wrap break-words rounded-xl bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
        {text}
      </pre>
    </section>
  );
}
