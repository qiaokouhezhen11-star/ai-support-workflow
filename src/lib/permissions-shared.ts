import type { UserRole } from "@/types/inquiry";

export const ROLE_COOKIE_NAME = "ai-support-role";
export const USER_ROLES: UserRole[] = ["ADMIN", "MANAGER", "AGENT", "VIEWER"];

export type AppPermission =
  | "createInquiry"
  | "editInquiry"
  | "manageKnowledge"
  | "manageTemplates"
  | "approveAiReply"
  | "manageAttachments"
  | "logAiEvaluation";

const ROLE_PERMISSIONS: Record<UserRole, AppPermission[]> = {
  ADMIN: [
    "createInquiry",
    "editInquiry",
    "manageKnowledge",
    "manageTemplates",
    "approveAiReply",
    "manageAttachments",
    "logAiEvaluation",
  ],
  MANAGER: [
    "createInquiry",
    "editInquiry",
    "manageKnowledge",
    "manageTemplates",
    "approveAiReply",
    "manageAttachments",
    "logAiEvaluation",
  ],
  AGENT: [
    "createInquiry",
    "editInquiry",
    "manageAttachments",
    "logAiEvaluation",
  ],
  VIEWER: [],
};

export function getRoleLabel(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "管理者";
    case "MANAGER":
      return "承認者";
    case "AGENT":
      return "担当者";
    case "VIEWER":
      return "閲覧のみ";
    default:
      return role;
  }
}

export function canRole(role: UserRole, permission: AppPermission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}
