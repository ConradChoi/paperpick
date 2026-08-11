import { ApiError } from "@/lib/api/error";

// `request.json()` throws on malformed/empty bodies. Left unguarded, that
// throw was falling through to the generic 500 handler even though a bad
// request body is a client error, not a server fault.
export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "요청 본문을 읽을 수 없습니다");
  }
}
