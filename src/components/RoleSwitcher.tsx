"use client";

import { USER_ROLES } from "@/lib/permissions-shared";
import { useRole } from "@/components/RoleProvider";

export default function RoleSwitcher() {
  const { role, roleLabel, setRole, switching } = useRole();

  return (
    <div className="border-b border-slate-200 bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            権限モード
          </p>
          <p className="mt-1 text-sm">
            現在: <span className="font-semibold text-white">{roleLabel}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {USER_ROLES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRole(item)}
              disabled={switching || role === item}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                role === item
                  ? "bg-white text-slate-950"
                  : "border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {item === "ADMIN"
                ? "管理者"
                : item === "MANAGER"
                  ? "承認者"
                  : item === "AGENT"
                    ? "担当者"
                    : "閲覧のみ"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
