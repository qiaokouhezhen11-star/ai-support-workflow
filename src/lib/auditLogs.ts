import type { InquiryAuditAction } from "@/types/inquiry";

export function getAuditActionLabel(action: InquiryAuditAction) {
  switch (action) {
    case "CREATED":
      return "問い合わせ登録";
    case "AI_ANALYZED":
      return "AI解析";
    case "STATUS_UPDATED":
      return "ステータス更新";
    case "ASSIGNEE_UPDATED":
      return "担当者更新";
    case "AI_RESULT_SAVED":
      return "AI結果保存";
    case "COMMENT_ADDED":
      return "コメント追加";
    case "FIELD_UPDATED":
      return "項目更新";
    default:
      return action;
  }
}

export function getAuditActionBadgeClass(action: InquiryAuditAction) {
  switch (action) {
    case "CREATED":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "AI_ANALYZED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "STATUS_UPDATED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "ASSIGNEE_UPDATED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "AI_RESULT_SAVED":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "COMMENT_ADDED":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "FIELD_UPDATED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getAuditActionDotClass(action: InquiryAuditAction) {
  switch (action) {
    case "CREATED":
      return "bg-slate-500 ring-slate-100";
    case "AI_ANALYZED":
      return "bg-blue-500 ring-blue-100";
    case "STATUS_UPDATED":
      return "bg-emerald-500 ring-emerald-100";
    case "ASSIGNEE_UPDATED":
      return "bg-amber-500 ring-amber-100";
    case "AI_RESULT_SAVED":
      return "bg-violet-500 ring-violet-100";
    case "COMMENT_ADDED":
      return "bg-orange-500 ring-orange-100";
    case "FIELD_UPDATED":
      return "bg-sky-500 ring-sky-100";
    default:
      return "bg-slate-500 ring-slate-100";
  }
}

export function getAuditActionCardClass(action: InquiryAuditAction) {
  switch (action) {
    case "CREATED":
      return "from-slate-50 via-white to-slate-50";
    case "AI_ANALYZED":
      return "from-blue-50 via-white to-cyan-50";
    case "STATUS_UPDATED":
      return "from-emerald-50 via-white to-lime-50";
    case "ASSIGNEE_UPDATED":
      return "from-amber-50 via-white to-orange-50";
    case "AI_RESULT_SAVED":
      return "from-violet-50 via-white to-fuchsia-50";
    case "COMMENT_ADDED":
      return "from-orange-50 via-white to-amber-50";
    case "FIELD_UPDATED":
      return "from-sky-50 via-white to-blue-50";
    default:
      return "from-slate-50 via-white to-slate-50";
  }
}
