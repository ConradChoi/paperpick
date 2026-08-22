import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminPermission } from "@/lib/api/admin-guard";
import { ApiError, errorResponse } from "@/lib/api/error";
import { parseJsonBody } from "@/lib/api/parse-body";

const statusSchema = z.object({
  status: z.enum(["new", "in_progress", "done"]),
});

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/inquiries/[id]">,
) {
  try {
    const { supabase } = await requireAdminPermission("inquiries", "update");
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", "status 값을 확인해주세요");
    }

    const { data, error } = await supabase
      .from("inquiries")
      .update({ status: parsed.data.status })
      .eq("id", id)
      .select("id, status")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new ApiError(404, "INQUIRY_NOT_FOUND", "문의를 찾을 수 없습니다");
    }

    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}
