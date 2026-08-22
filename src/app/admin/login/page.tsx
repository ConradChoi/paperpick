"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const supabase = createClient();
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("아이디 또는 비밀번호가 올바르지 않습니다");
      setSubmitting(false);
      return;
    }

    // A confirmed-but-not-yet-approved signup (see /admin/signup) has no
    // admins row until their first successful login — this is where it
    // gets created, since that's the first point auth.uid() is available.
    const { data: adminRow } = await supabase
      .from("admins")
      .select("status")
      .eq("user_id", signInData.user.id)
      .maybeSingle();

    if (!adminRow) {
      await supabase
        .from("admins")
        .insert({ user_id: signInData.user.id, email, status: "pending" });
      setError(
        "가입 요청이 접수됐습니다. 최고관리자 승인 후 로그인해주세요.",
      );
      await supabase.auth.signOut();
      setSubmitting(false);
      return;
    }

    if (adminRow.status === "pending") {
      setError("가입 요청이 아직 승인 대기 중입니다.");
      await supabase.auth.signOut();
      setSubmitting(false);
      return;
    }

    if (adminRow.status === "rejected") {
      setError("가입 요청이 거절됐습니다. 최고관리자에게 문의해주세요.");
      await supabase.auth.signOut();
      setSubmitting(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-6 rounded-lg border border-line bg-surface p-8 shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-ink">Paper Pick Admin</h1>
          <p className="text-[13px] text-ink-muted">
            관리자 계정으로 로그인하세요
          </p>
        </div>

        <FormField
          label="아이디"
          name="email"
          type="email"
          placeholder="admin@paperpick.co.kr"
          required
        />
        <FormField
          label="비밀번호"
          name="password"
          type="password"
          placeholder="••••••••"
          required
        />

        {error && <p className="text-sm text-error">{error}</p>}

        <Button type="submit" size="lg" disabled={submitting}>
          로그인
        </Button>

        <Link
          href="/admin/signup"
          className="text-center text-[13px] text-ink-muted hover:text-ink"
        >
          운영자 가입 요청
        </Link>
      </form>
    </div>
  );
}
