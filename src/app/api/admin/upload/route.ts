import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/api/admin-guard";
import { ApiError, errorResponse } from "@/lib/api/error";

// Generic image upload used by the product form (representative + up to 4
// additional images) and, per spec, reusable as-is for images inserted
// inside the rich-text description editor — it has no dependency on a
// product id, so it also covers uploading images before a product row
// exists yet (new-product flow uses a uuid-based Storage path, not the
// product id).

const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

// Client-declared `accept`/File.type is not trustworthy on its own — this is
// the server-side re-validation the spec calls for. It's still a
// client-declared MIME type (not a magic-byte sniff), but combined with the
// Storage bucket's own `allowed_mime_types`/`file_size_limit` (see
// 20260811120000_product_images.sql) it's a second, independent check.
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdminPermission("products", [
      "create",
      "update",
    ]);

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new ApiError(400, "INVALID_FORM_DATA", "요청 본문을 읽을 수 없습니다");
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "NO_FILE", "업로드할 파일이 없습니다");
    }

    const ext = ALLOWED_MIME_TYPES[file.type];
    if (!ext) {
      throw new ApiError(
        400,
        "INVALID_FILE_TYPE",
        "JPEG, PNG, WebP 형식의 이미지만 업로드할 수 있습니다",
      );
    }

    if (file.size > MAX_BYTES) {
      throw new ApiError(
        413,
        "FILE_TOO_LARGE",
        "파일 크기는 5MB를 초과할 수 없습니다",
      );
    }

    const buffer = await file.arrayBuffer();
    // Re-check the real byte length rather than trusting `file.size` alone.
    if (buffer.byteLength > MAX_BYTES) {
      throw new ApiError(
        413,
        "FILE_TOO_LARGE",
        "파일 크기는 5MB를 초과할 수 없습니다",
      );
    }
    if (buffer.byteLength === 0) {
      throw new ApiError(400, "NO_FILE", "업로드할 파일이 없습니다");
    }

    const path = `${randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new ApiError(
        502,
        "UPLOAD_FAILED",
        "이미지 업로드에 실패했습니다. 잠시 후 다시 시도해주세요",
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ url: publicUrl }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
