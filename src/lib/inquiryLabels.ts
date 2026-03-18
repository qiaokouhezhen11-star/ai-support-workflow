import type { Inquiry } from "@/types/inquiry";

export function getStatusLabel(status: Inquiry["status"]) {
  switch (status) {
    case "OPEN":
      return "未対応";
    case "AI_DRAFTED":
      return "AI下書き済み";
    case "REVIEW_NEEDED":
      return "確認中";
    case "COMPLETED":
      return "完了";
    default:
      return status;
  }
}

export function getStatusBadgeClass(status: Inquiry["status"]) {
  switch (status) {
    case "OPEN":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "AI_DRAFTED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "REVIEW_NEEDED":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getPriorityLabel(priority: Inquiry["priority"]) {
  switch (priority) {
    case "LOW":
      return "低";
    case "MEDIUM":
      return "中";
    case "HIGH":
      return "高";
    case "URGENT":
      return "緊急";
    default:
      return "未判定";
  }
}

export function getPriorityBadgeClass(priority: Inquiry["priority"]) {
  switch (priority) {
    case "LOW":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "MEDIUM":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "HIGH":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "URGENT":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export function getCategoryLabel(category: Inquiry["category"]) {
  switch (category) {
    case "GENERAL":
      return "一般問い合わせ";
    case "TROUBLESHOOTING":
      return "不具合・トラブル";
    case "BILLING":
      return "請求・支払い";
    case "FEATURE_REQUEST":
      return "機能要望";
    case "OTHER":
      return "その他";
    default:
      return "未分類";
  }
}

export function getCategoryBadgeClass(category: Inquiry["category"]) {
  switch (category) {
    case "GENERAL":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "TROUBLESHOOTING":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "BILLING":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "FEATURE_REQUEST":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "OTHER":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}