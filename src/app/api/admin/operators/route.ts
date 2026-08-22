import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/api/admin-guard";
import { ApiError, errorResponse } from "@/lib/api/error";
import { parseJsonBody } from "@/lib/api/parse-body";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { supabase } = await requireSuperAdmin();

    const { data, error } = await supabase
      .from("admins")
      .select(
        "user_id, email, is_super_admin, group_id, status, created_at, operator_groups(name)",
      )
      .order("created_at", { ascending: true });
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

const operatorSchema = z.object({
  email: z.string().trim().email("올바른 이메일을 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  groupId: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    // Service role is unavoidable here — auth.admin.createUser() has no
    // RLS-governed equivalent. This is now the only reason
    // SUPABASE_SERVICE_ROLE_KEY needs to be configured at all; everything
    // else in the admin panel works without it (see admin-access.ts).
    const admin = createAdminClient();
    const body = await parseJsonBody(request);
    const parsed = operatorSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "입력값을 확인해주세요",
      );
    }
    const { email, password, groupId } = parsed.data;

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    if (createError) {
      throw new ApiError(
        409,
        "USER_CREATE_FAILED",
        createError.message || "운영자 계정 생성에 실패했습니다",
      );
    }

    const { data: adminRow, error: insertError } = await admin
      .from("admins")
      .insert({
        user_id: created.user.id,
        email,
        is_super_admin: false,
        group_id: groupId ?? null,
        status: "approved",
      })
      .select()
      .single();
    if (insertError) {
      // Roll back the auth user so a failed admins-insert doesn't leave a
      // login-capable account with no admin row (and no way to reach it
      // again through this same form, since the email is now taken).
      await admin.auth.admin.deleteUser(created.user.id);
      throw insertError;
    }

    return NextResponse.json({ data: adminRow }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
