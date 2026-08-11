"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("아이디 또는 비밀번호가 올바르지 않습니다");
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
      </form>
    </div>
  );
}
