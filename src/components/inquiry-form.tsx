"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/app/[lang]/dictionaries";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";

// Placeholder until privacy-security-officer finalizes the actual policy —
// bump this string whenever the privacy policy content changes so past
// consent records stay tied to the version the user actually agreed to.
const CONSENT_VERSION = "1.0";

type InquiryType = "general" | "reservation" | "newsletter";

type Dict = {
  typeLabel: string;
  typeGeneral: string;
  typeReservation: string;
  typeNewsletter: string;
  nameLabel: string;
  namePlaceholder: string;
  contactLabel: string;
  contactPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  consentLabel: string;
  policyLine: string;
  submit: string;
  selectedProduct: string;
  successTitle: string;
  successBody: string;
  errorConsent: string;
  errorGeneric: string;
};

export function InquiryForm({
  lang,
  dict,
  productId,
  productName,
  defaultType = "general",
  defaultMessage,
}: {
  lang: Locale;
  dict: Dict;
  productId?: string;
  productName?: string;
  defaultType?: InquiryType;
  defaultMessage?: string;
}) {
  const [type, setType] = useState<InquiryType>(defaultType);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const typeOptions: { value: InquiryType; label: string }[] = [
    { value: "general", label: dict.typeGeneral },
    { value: "reservation", label: dict.typeReservation },
    { value: "newsletter", label: dict.typeNewsletter },
  ];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const consent = form.get("consent") === "on";

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: form.get("name"),
          contact: form.get("contact"),
          message: form.get("message") || undefined,
          productId: productId ?? null,
          locale: lang,
          consent,
          consentVersion: CONSENT_VERSION,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const code = body?.error?.code;
        if (code === "CONSENT_REQUIRED") {
          setErrors({ consent: dict.errorConsent });
        } else if (code === "VALIDATION_ERROR" && body?.error?.message) {
          setErrors({ form: body.error.message });
        } else {
          setErrors({ form: dict.errorGeneric });
        }
        return;
      }

      setSubmitted(true);
    } catch {
      setErrors({ form: dict.errorGeneric });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg bg-brand-tint p-8 text-center">
        <p className="text-lg font-bold text-ink">{dict.successTitle}</p>
        <p className="text-sm text-ink-muted">{dict.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {productName && (
        <div className="rounded-lg bg-brand-tint px-4 py-3 text-[13px] font-medium text-brand">
          {dict.selectedProduct}: {productName}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-ink">
          {dict.typeLabel}
        </span>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                type === opt.value
                  ? "bg-brand text-white"
                  : "border border-line bg-surface text-ink-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <FormField label={dict.nameLabel} name="name" placeholder={dict.namePlaceholder} required />
      <FormField
        label={dict.contactLabel}
        name="contact"
        placeholder={dict.contactPlaceholder}
        required
      />
      <TextAreaField
        label={dict.messageLabel}
        name="message"
        placeholder={dict.messagePlaceholder}
        defaultValue={defaultMessage}
      />

      <div className="flex flex-col gap-1">
        <Checkbox label={dict.consentLabel} name="consent" required />
        {errors.consent && (
          <p className="text-xs text-error">{errors.consent}</p>
        )}
        <p className="text-xs text-ink-faint">{dict.policyLine}</p>
      </div>

      {errors.form && <p className="text-sm text-error">{errors.form}</p>}

      <Button type="submit" size="lg" disabled={submitting}>
        {dict.submit}
      </Button>
    </form>
  );
}
