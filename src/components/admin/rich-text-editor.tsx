"use client";

import { useCallback, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Image as ImageIcon, List, Loader2, Redo2, Undo2 } from "lucide-react";
import { looksLikeHtml, escapePlainTextAsHtml } from "@/lib/sanitize";

type RichTextEditorProps = {
  value?: string | null;
  onChange: (html: string) => void;
  placeholder?: string;
};

// Existing rows may hold plain text (no HTML tags) written before this
// editor existed, rather than HTML. A bare `<` in prose (e.g. "80g < 90g")
// is not a reliable signal — see looksLikeHtml for why a naive check would
// let the parser misinterpret plain text as a real tag and corrupt it.
function toInitialContent(raw: string | null | undefined): string {
  if (!raw) return "";
  if (looksLikeHtml(raw)) return raw;
  return escapePlainTextAsHtml(raw);
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: toInitialContent(value),
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "px-4 py-3 text-sm text-ink min-h-40 max-h-[480px] overflow-y-auto focus:outline-none",
      },
    },
  });

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !editor) return;

      setError(null);
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: form,
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.error?.message ?? "이미지 업로드에 실패했습니다");
        }
        editor.chain().focus().setImage({ src: body.url as string }).run();
      } catch (err) {
        setError(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다");
      } finally {
        setUploading(false);
      }
    },
    [editor],
  );

  return (
    <div className="rounded-md border border-line transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-tint">
      <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
        <ToolbarButton
          label="실행 취소"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="다시 실행"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="굵게"
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="글머리 목록"
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton label="이미지 삽입" onClick={handleImageButtonClick} disabled={uploading}>
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="sr-only"
          tabIndex={-1}
        />
      </div>
      <EditorContent editor={editor} />
      {error && <p className="px-4 pb-2 text-xs text-error">{error}</p>}
    </div>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />;
}

function ToolbarButton({
  label,
  onClick,
  active,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded transition-colors disabled:pointer-events-none disabled:opacity-40 ${
        active ? "bg-brand-tint text-brand" : "text-ink-muted hover:bg-surface-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
