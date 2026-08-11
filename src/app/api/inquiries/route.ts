import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ApiError, errorResponse } from "@/lib/api/error";
import { parseJsonBody } from "@/lib/api/parse-body";
import { getClientIp, isRateLimited } from "@/lib/api/rate-limit";

const inquirySchema = z.object({
  type: z.enum(["general", "reservation", "newsletter"]),
  name: z.string().trim().min(1, "이름을 입력해주세요").max(100),
  contact: z.string().trim().min(1, "연락처 또는 이메일을 입력해주세요").max(200),
  message: z.string().trim().max(2000).optional(),
  productId: z.string().uuid().nullable().optional(),
  locale: z.enum(["ko", "en"]),
  consent: z.literal(true, "개인정보 수집 및 이용에 동의해주세요"),
  consentVersion: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      throw new ApiError(429, "RATE_LIMITED", "잠시 후 다시 시도해주세요");
    }

    const body = await parseJsonBody(request);
    const parsed = inquirySchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      if (first?.path[0] === "consent") {
        throw new ApiError(400, "CONSENT_REQUIRED", first.message);
      }
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        first?.message ?? "입력값을 확인해주세요",
      );
    }

    const { type, name, contact, message, productId, locale, consentVersion } =
      parsed.data;

    // Generate the id ourselves and skip `.select()` (= no RETURNING).
    // `inquiries` has no public SELECT policy — only admins can read rows
    // back — so an anon INSERT ... RETURNING would fail RLS on the
    // read-back step even though the insert itself is permitted. Anon stays
    // insert-only, least-privilege, no need to widen the SELECT policy.
    const id = crypto.randomUUID();

    const supabase = await createClient();
    const { error } = await supabase.from("inquiries").insert({
      id,
      type,
      name,
      contact,
      message: message ?? null,
      product_id: productId ?? null,
      locale,
      consent_at: new Date().toISOString(),
      consent_version: consentVersion,
    });

    if (error) throw error;

    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
