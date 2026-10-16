// Design Ref: §3.5 — POST /api/newsletter: 이번 주 뉴스레터(기사 10건 + 공유용 글)를 만들어 돌려준다
import { FetchArticlesError } from "@/lib/fetch-articles";
import { buildNewsletter } from "@/lib/newsletter";
import { createLimiter, isSameOriginRequest } from "@/lib/security";

// 한 번에 네이버 검색 수백 건과 AI 호출이 일어나므로 하루 20번, 동시에 1번까지만 허용한다
const limiter = createLimiter({ max: 20, windowMs: 24 * 60 * 60 * 1000, maxConcurrent: 1 });

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  }
  if (!limiter.tryAcquire()) {
    return Response.json(
      { error: "요청이 너무 많거나 이미 만드는 중이에요. 잠시 뒤 다시 눌러 주세요." },
      { status: 429 },
    );
  }
  try {
    return Response.json(await buildNewsletter());
  } catch (error) {
    // 화면에는 미리 정해 둔 한국어 문구만 보내고, 로그에는 오류 종류만 남긴다 (키·내부 정보 노출 방지)
    const message =
      error instanceof FetchArticlesError
        ? error.message
        : "뉴스레터를 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.";
    console.error(
      `뉴스레터 만들기 실패: ${error instanceof Error ? error.name : "알 수 없음"}`,
    );
    return Response.json({ error: message }, { status: 500 });
  } finally {
    limiter.release();
  }
}
