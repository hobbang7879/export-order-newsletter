// 브라우저(세션)에 이번 뉴스레터 결과를 잠깐 보관해, 목록 화면과 카드 화면이 같은 기사를 쓰게 한다.
// 탭을 닫으면 사라지고, 서버로는 보내지 않는다.
import type { NewsletterResponse } from "./types";

const KEY = "newsletter-result";
const EVENT = "newsletter-result-change";

export function saveNewsletter(data: NewsletterResponse): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // 보관하지 못해도 목록 화면은 그대로 쓸 수 있다
  }
}

export function subscribeNewsletter(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

/** 보관된 글자(JSON)를 그대로 돌려준다. 없으면 null. (같은 값이면 같은 글자라 화면이 불필요하게 다시 그려지지 않는다) */
export function getSavedNewsletterRaw(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}
