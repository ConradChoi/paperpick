import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/api/admin-guard";
import { ApiError, errorResponse } from "@/lib/api/error";
import { parseJsonBody } from "@/lib/api/parse-body";
import { createAdminClient } from "@/lib/supabase/admin";

const operatorUpdateSchema = z.object({
  groupId: z.string().uuid().nullable(),
});

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/operators/[id]">,
) {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient();
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    const parsed = operatorUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", "groupId 값을 확인해주세요");
    }

    const { data: target } = await admin
      .from("admins")
      .select("is_super_admin")
      .eq("user_id", id)
      .maybeSingle();
    if (!target) {
      throw new ApiError(404, "OPERATOR_NOT_FOUND", "운영자를 찾을 수 없습니다");
    }
    if (target.is_super_admin) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "최고관리자 계정은 그룹을 변경할 수 없습니다",
      );
    }

    const { data, error } = await admin
      .from("admins")
      .update({ group_id: parsed.data.groupId })
      .eq("user_id", id)
      .select()
      .maybeSingle();
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/admin/operators/[id]">,
) {
  try {
    const { user: caller } = await requireSuperAdmin();
    const admin = createAdminClient();
    const { id } = await ctx.params;

    if (id === caller.id) {
      throw new ApiError(
        400,
        "CANNOT_DELETE_SELF",
        "본인 계정은 삭제할 수 없습니다",
      );
    }

    const { data: target } = await admin
      .from("admins")
      .select("is_super_admin")
      .eq("user_id", id)
      .maybeSingle();
    if (!target) {
      throw new ApiError(404, "OPERATOR_NOT_FOUND", "운영자를 찾을 수 없습니다");
    }
    if (target.is_super_admin) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "최고관리자 계정은 이 화면에서 삭제할 수 없습니다",
      );
    }

    const { error: deleteRowError } = await admin
      .from("admins")
      .delete()
      .eq("user_id", id);
    if (deleteRowError) throw deleteRowError;

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(id);
    if (deleteUserError) throw deleteUserError;

    return NextResponse.json({ data: { id } });
  } catch (error) {
    return errorResponse(error);
  }
}
