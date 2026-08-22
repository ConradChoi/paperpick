import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/api/admin-guard";
import { ApiError, errorResponse } from "@/lib/api/error";
import { parseJsonBody } from "@/lib/api/parse-body";
import { createAdminClient } from "@/lib/supabase/admin";

const MENUS = ["products", "inquiries"] as const;

const permissionSchema = z.object({
  menu: z.enum(MENUS),
  canCreate: z.boolean().optional(),
  canRead: z.boolean().optional(),
  canUpdate: z.boolean().optional(),
  canDelete: z.boolean().optional(),
});

const groupSchema = z.object({
  name: z.string().trim().min(1),
  permissions: z.array(permissionSchema).optional(),
});

export async function GET() {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("operator_groups")
      .select("*, operator_group_permissions(*)")
      .order("created_at", { ascending: true });
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient();
    const body = await parseJsonBody(request);
    const parsed = groupSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "입력값을 확인해주세요",
      );
    }
    const v = parsed.data;

    const { data: group, error: groupError } = await admin
      .from("operator_groups")
      .insert({ name: v.name })
      .select()
      .single();
    if (groupError) throw groupError;

    if (v.permissions?.length) {
      const { error: permError } = await admin
        .from("operator_group_permissions")
        .insert(
          v.permissions.map((p) => ({
            group_id: group.id,
            menu: p.menu,
            can_create: p.canCreate ?? false,
            can_read: p.canRead ?? false,
            can_update: p.canUpdate ?? false,
            can_delete: p.canDelete ?? false,
          })),
        );
      if (permError) throw permError;
    }

    return NextResponse.json({ data: group }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
