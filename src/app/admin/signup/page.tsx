"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

export default function AdminSignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<"confirm-email" | "pending" | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message || "가입 요청 중 문제가 발생했습니다");
      setSubmitting(false);
      return;
    }

    // With email confirmation required, signUp() returns no session yet —
    // there's no auth.uid() to insert the pending admins row under until
    // they confirm and log in, so the login page does that check instead.
    if (!data.session) {
      setDone("confirm-email");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("admins")
      .insert({ user_id: data.user!.id, email, status: "pending" });
    // A duplicate-row error here just means this account already has an
    // admins row (e.g. a retry) — not a real failure from the user's POV.
    if (insertError && insertError.code !== "23505") {
      setError("가입 요청 등록 중 문제가 발생했습니다. 다시 시도해주세요");
      setSubmitting(false);
      return;
    }

    setDone("pending");
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-line bg-surface p-8 text-center shadow-sm">
          <h1 className="text-lg font-bold text-ink">가입 요청이 접수됐어요</h1>
          <p className="text-sm text-ink-muted">
            {done === "confirm-email"
              ? "입력하신 이메일로 인증 메일을 보내드렸어요. 인증 완료 후 로그인하시면 가입 요청이 등록됩니다."
              : "최고관리자 승인 후 로그인하실 수 있습니다."}
          </p>
          <Link href="/admin/login" className="text-sm font-medium text-brand hover:underline">
            로그인 화면으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-6 rounded-lg border border-line bg-surface p-8 shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-ink">운영자 가입 요청</h1>
          <p className="text-[13px] text-ink-muted">
            이메일과 비밀번호를 입력하시면, 최고관리자 승인 후 운영자로
            이용하실 수 있습니다.
          </p>
        </div>

        <FormField
          label="이메일"
          name="email"
          type="email"
          placeholder="operator@example.com"
          required
        />
        <FormField
          label="비밀번호"
          name="password"
          type="password"
          placeholder="••••••••"
          helperText="8자 이상"
          minLength={8}
          required
        />

        {error && <p className="text-sm text-error">{error}</p>}

        <Button type="submit" size="lg" disabled={submitting}>
          가입 요청 보내기
        </Button>

        <Link
          href="/admin/login"
          className="text-center text-[13px] text-ink-muted hover:text-ink"
        >
          이미 계정이 있으신가요? 로그인
        </Link>
      </form>
    </div>
  );
}
