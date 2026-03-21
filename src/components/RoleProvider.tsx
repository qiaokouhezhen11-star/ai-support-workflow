"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  canRole,
  getRoleLabel,
  type AppPermission,
} from "@/lib/permissions-shared";
import type { UserRole } from "@/types/inquiry";

type RoleContextValue = {
  role: UserRole;
  roleLabel: string;
  can: (permission: AppPermission) => boolean;
  setRole: (role: UserRole) => Promise<void>;
  switching: boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({
  initialRole,
  children,
}: {
  initialRole: UserRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [role, setRoleState] = useState<UserRole>(initialRole);
  const [switching, setSwitching] = useState(false);

  const setRole = useCallback(async (nextRole: UserRole) => {
    setSwitching(true);

    try {
      const res = await fetch("/api/session/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: nextRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ロール切り替えに失敗しました。");
      }

      setRoleState(nextRole);
      router.refresh();
    } finally {
      setSwitching(false);
    }
  }, [router]);

  const value = useMemo<RoleContextValue>(
    () => ({
      role,
      roleLabel: getRoleLabel(role),
      can: (permission) => canRole(role, permission),
      setRole,
      switching,
    }),
    [role, setRole, switching]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);

  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }

  return context;
}
