import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/api/admin-guard";
import { ApiError, errorResponse } from "@/lib/api/error";
import { parseJsonBody } from "@/lib/api/parse-body";

const MENUS = ["products", "inquiries"] as const;

const permissionSchema = z.object({
  menu: z.enum(MENUS),
  canCreate: z.boolean().optional(),
  canRead: z.boolean().optional(),
  canUpdate: z.boolean().optional(),
  canDelete: z.boolean().optional(),
});

const groupUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  permissions: z.array(permissionSchema).optional(),
});

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/operator-groups/[id]">,
) {
  try {
    const { supabase: admin } = await requireSuperAdmin();
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    const parsed = groupUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "입력값을 확인해주세요",
      );
    }
    const { name, permissions } = parsed.data;

    if (name !== undefined) {
      const { error } = await admin
        .from("operator_groups")
        .update({ name })
        .eq("id", id);
      if (error) throw error;
    }

    if (permissions !== undefined) {
      const { error: deleteError } = await admin
        .from("operator_group_permissions")
        .delete()
        .eq("group_id", id);
      if (deleteError) throw deleteError;

      if (permissions.length > 0) {
        const { error: insertError } = await admin
          .from("operator_group_permissions")
          .insert(
            permissions.map((p) => ({
              group_id: id,
              menu: p.menu,
              can_create: p.canCreate ?? false,
              can_read: p.canRead ?? false,
              can_update: p.canUpdate ?? false,
              can_delete: p.canDelete ?? false,
            })),
          );
        if (insertError) throw insertError;
      }
    }

    const { data, error } = await admin
      .from("operator_groups")
      .select("*, operator_group_permissions(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new ApiError(404, "GROUP_NOT_FOUND", "그룹을 찾을 수 없습니다");
    }

    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/admin/operator-groups/[id]">,
) {
  try {
    const { supabase: admin } = await requireSuperAdmin();
    const { id } = await ctx.params;

    // Operators in this group become group-less (on delete set null on
    // admins.group_id) — losing all menu access until reassigned, which is
    // the safe default rather than silently keeping stale permissions.
    const { data, error } = await admin
      .from("operator_groups")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new ApiError(404, "GROUP_NOT_FOUND", "그룹을 찾을 수 없습니다");
    }

    return NextResponse.json({ data: { id } });
  } catch (error) {
    return errorResponse(error);
  }
}
