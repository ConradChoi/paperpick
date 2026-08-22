"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import type {
  AdminMenu,
  OperatorGroup,
  OperatorGroupPermission,
} from "@/types/database";

const MENUS: { key: AdminMenu; label: string }[] = [
  { key: "products", label: "상품 관리" },
  { key: "inquiries", label: "리드 관리" },
];
const ACTIONS = [
  { key: "canCreate", label: "등록" },
  { key: "canRead", label: "조회" },
  { key: "canUpdate", label: "수정" },
  { key: "canDelete", label: "삭제" },
] as const;

type PermissionState = Record<
  AdminMenu,
  { canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean }
>;

function emptyPermissions(): PermissionState {
  return {
    products: { canCreate: false, canRead: false, canUpdate: false, canDelete: false },
    inquiries: { canCreate: false, canRead: false, canUpdate: false, canDelete: false },
  };
}

function toPermissionState(rows: OperatorGroupPermission[]): PermissionState {
  const state = emptyPermissions();
  for (const row of rows) {
    state[row.menu] = {
      canCreate: row.can_create,
      canRead: row.can_read,
      canUpdate: row.can_update,
      canDelete: row.can_delete,
    };
  }
  return state;
}

function toPayload(state: PermissionState) {
  return MENUS.map(({ key }) => ({ menu: key, ...state[key] }));
}

function PermissionTable({
  value,
  onChange,
}: {
  value: PermissionState;
  onChange: (next: PermissionState) => void;
}) {
  return (
    <table className="text-sm">
      <thead>
        <tr className="text-xs text-ink-muted">
          <th className="px-2 py-1 text-left font-medium">메뉴</th>
          {ACTIONS.map((a) => (
            <th key={a.key} className="px-2 py-1 font-medium">
              {a.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {MENUS.map((menu) => (
          <tr key={menu.key} className="border-t border-line">
            <td className="px-2 py-1.5 text-ink">{menu.label}</td>
            {ACTIONS.map((a) => (
              <td key={a.key} className="px-2 py-1.5 text-center">
                <input
                  type="checkbox"
                  checked={value[menu.key][a.key]}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      [menu.key]: { ...value[menu.key], [a.key]: e.target.checked },
                    })
                  }
                  className="h-4 w-4 rounded border-line text-brand accent-brand"
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function OperatorGroupsManager({
  groups,
}: {
  groups: (OperatorGroup & { operator_group_permissions: OperatorGroupPermission[] })[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          onChanged={() => router.refresh()}
        />
      ))}

      {adding ? (
        <NewGroupForm
          onDone={() => {
            setAdding(false);
            router.refresh();
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="w-fit"
          onClick={() => setAdding(true)}
        >
          + 그룹 추가
        </Button>
      )}
    </div>
  );
}

function GroupCard({
  group,
  onChanged,
}: {
  group: OperatorGroup & { operator_group_permissions: OperatorGroupPermission[] };
  onChanged: () => void;
}) {
  const [permissions, setPermissions] = useState<PermissionState>(() =>
    toPermissionState(group.operator_group_permissions),
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/operator-groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: toPayload(permissions) }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "저장 중 문제가 발생했습니다");
      return;
    }
    onChanged();
  }

  async function handleDelete() {
    if (!confirm(`'${group.name}' 그룹을 삭제하시겠습니까? 이 그룹에 속한 운영자는 그룹이 해제됩니다.`)) {
      return;
    }
    setDeleting(true);
    const res = await fetch(`/api/admin/operator-groups/${group.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (res.ok) onChanged();
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-ink">{group.name}</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-error hover:underline disabled:opacity-50"
        >
          그룹 삭제
        </button>
      </div>
      <div className="overflow-x-auto">
        <PermissionTable value={permissions} onChange={setPermissions} />
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      <Button
        type="button"
        size="sm"
        className="w-fit"
        disabled={saving}
        onClick={handleSave}
      >
        권한 저장
      </Button>
    </div>
  );
}

function NewGroupForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<PermissionState>(emptyPermissions);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/admin/operator-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, permissions: toPayload(permissions) }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "저장 중 문제가 발생했습니다");
      return;
    }
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-dashed border-line p-4"
    >
      <FormField
        label="그룹명"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="max-w-xs"
      />
      <div className="overflow-x-auto">
        <PermissionTable value={permissions} onChange={setPermissions} />
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          추가
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
          취소
        </Button>
      </div>
    </form>
  );
}
