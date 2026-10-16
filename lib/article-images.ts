"use client";

// 기사 대표 이미지 주소를 서버(/api/images)에서 받아 와 목록 화면과 카드 화면이 함께 쓴다.
// 한 번 받은 주소는 화면을 오가도 다시 요청하지 않는다. 이미지 파일은 저장하지 않고 주소만 가진다.
import { useEffect, useSyncExternalStore } from "react";

let images: Record<string, string> = {};
const asked = new Set<string>();
const listeners = new Set<() => void>();

const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};
const getSnapshot = () => images;
const getServerSnapshot = () => images;

async function load(urls: string[]) {
  const missing = urls.filter((url) => !asked.has(url));
  if (missing.length === 0) return;
  missing.forEach((url) => asked.add(url));
  try {
    const res = await fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: missing }),
    });
    const body = res.ok ? await res.json() : null;
    if (body?.images) {
      images = { ...images, ...body.images };
      listeners.forEach((callback) => callback());
    }
  } catch {
    // 실패하면 기본 그림이 보인다
  }
}

/** 기사 주소별 대표 이미지 주소. 아직 없거나 못 찾은 기사는 빠져 있다 */
export function useArticleImages(urls: string[]): Record<string, string> {
  const key = urls.join("\n");
  useEffect(() => {
    void load(key ? key.split("\n") : []);
  }, [key]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
