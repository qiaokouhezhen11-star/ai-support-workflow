import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { UserRole } from "@/types/inquiry";
import {
  canRole,
  getRoleLabel,
  ROLE_COOKIE_NAME,
  USER_ROLES,
  type AppPermission,
} from "@/lib/permissions-shared";

export { canRole, getRoleLabel, ROLE_COOKIE_NAME, USER_ROLES };
export type { AppPermission };

export async function getCurrentUserRole(): Promise<UserRole> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ROLE_COOKIE_NAME)?.value;

  if (raw && USER_ROLES.includes(raw as UserRole)) {
    return raw as UserRole;
  }

  return "MANAGER";
}

export async function requirePermission(permission: AppPermission) {
  const role = await getCurrentUserRole();

  if (!canRole(role, permission)) {
    return {
      role,
      response: NextResponse.json(
        {
          error: `現在の権限（${getRoleLabel(role)}）ではこの操作はできません。`,
        },
        { status: 403 }
      ),
    };
  }

  return {
    role,
    response: null,
  };
}
