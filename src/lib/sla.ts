import type { InquiryPriority, InquiryStatus } from "@/types/inquiry";

const SLA_HOURS: Record<InquiryPriority, number> = {
  LOW: 72,
  MEDIUM: 24,
  HIGH: 8,
  URGENT: 2,
};

export function calculateSlaDueAt(
  priority: InquiryPriority | null,
  baseDate: Date
) {
  if (!priority) {
    return null;
  }

  const dueAt = new Date(baseDate);
  dueAt.setHours(dueAt.getHours() + SLA_HOURS[priority]);
  return dueAt;
}

export function formatSlaDate(date: string | null) {
  if (!date) {
    return "未設定";
  }

  return new Date(date).toLocaleString("ja-JP");
}

export function formatSlaDuration(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / (1000 * 60)));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}日 ${hours}時間`;
  }

  if (hours > 0) {
    return `${hours}時間 ${minutes}分`;
  }

  return `${minutes}分`;
}

export function getSlaMeta({
  slaDueAt,
  status,
  now = new Date(),
}: {
  slaDueAt: string | null;
  status: InquiryStatus;
  now?: Date;
}) {
  if (!slaDueAt) {
    return {
      label: "SLA未設定",
      detail: "優先度が決まるとSLA期限を自動計算します。",
      toneClass: "border-slate-200 bg-slate-50 text-slate-700",
      isOverdue: false,
      isDueSoon: false,
    };
  }

  if (status === "COMPLETED") {
    return {
      label: "対応完了",
      detail: `期限 ${formatSlaDate(slaDueAt)}`,
      toneClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      isOverdue: false,
      isDueSoon: false,
    };
  }

  const diffMs = new Date(slaDueAt).getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      label: "期限超過",
      detail: `${formatSlaDuration(Math.abs(diffMs))} 超過`,
      toneClass: "border-red-200 bg-red-50 text-red-700",
      isOverdue: true,
      isDueSoon: false,
    };
  }

  if (diffMs <= 1000 * 60 * 60 * 4) {
    return {
      label: "まもなく期限",
      detail: `残り ${formatSlaDuration(diffMs)}`,
      toneClass: "border-amber-200 bg-amber-50 text-amber-700",
      isOverdue: false,
      isDueSoon: true,
    };
  }

  return {
    label: "期限内",
    detail: `残り ${formatSlaDuration(diffMs)}`,
    toneClass: "border-cyan-200 bg-cyan-50 text-cyan-700",
    isOverdue: false,
    isDueSoon: false,
  };
}
