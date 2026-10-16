// POST /api/images: 기사 주소 목록을 받아 기사별 대표 이미지 주소를 돌려준다 (카드 넘기기 화면용)
import { fetchImageUrls, getAllowedSource } from "@/lib/fetch-articles";
import { createLimiter, isSameOriginRequest } from "@/lib/security";

const MAX_URLS = 20;
// 서버가 언론사에 대신 접속하므로 한 시간 30번, 동시에 2번까지만 허용한다
const limiter = createLimiter({ max: 30, windowMs: 60 * 60 * 1000, maxConcurrent: 2 });

const badRequest = () =>
  Response.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
  }
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
    return badRequest();
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest();
  }
  const urls = (body as { urls?: unknown } | null)?.urls;
  if (
    !Array.isArray(urls) ||
    urls.length > MAX_URLS ||
    !urls.every((u) => typeof u === "string" && u.length < 500)
  ) {
    return badRequest();
  }
  // 같은 주소는 한 번만, 허용된 4개 매체의 https 주소만 읽는다 (다른 주소로 서버가 접속하지 않게)
  const allowed = [...new Set(urls as string[])].filter((u) => getAllowedSource(u));

  if (!limiter.tryAcquire()) {
    return Response.json(
      { error: "요청이 너무 많아요. 잠시 뒤 다시 시도해 주세요." },
      { status: 429 },
    );
  }
  try {
    return Response.json({ images: await fetchImageUrls(allowed) });
  } finally {
    limiter.release();
  }
}
