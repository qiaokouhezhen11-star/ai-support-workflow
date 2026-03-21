import { getSlaMeta } from "@/lib/sla";
import type { ApprovalStatus, InquiryPriority, InquiryStatus } from "@/types/inquiry";

export type AppNotification = {
  id: string;
  inquiryId: string;
  level: "critical" | "warning" | "info";
  title: string;
  detail: string;
  href: string;
};

type InquiryNotificationRecord = {
  id: string;
  title: string;
  assigneeName: string | null;
  priority: InquiryPriority | null;
  status: InquiryStatus;
  approvalStatus: ApprovalStatus;
  slaDueAt: Date | null;
};

function scoreLevel(level: AppNotification["level"]) {
  switch (level) {
    case "critical":
      return 3;
    case "warning":
      return 2;
    case "info":
      return 1;
    default:
      return 0;
  }
}

export function buildAppNotifications(
  inquiries: InquiryNotificationRecord[]
): AppNotification[] {
  const items = inquiries.flatMap<AppNotification>((inquiry) => {
    const notifications: AppNotification[] = [];
    const sla = getSlaMeta({
      slaDueAt: inquiry.slaDueAt?.toISOString() ?? null,
      status: inquiry.status,
    });

    if (sla.isOverdue) {
      notifications.push({
        id: `${inquiry.id}-sla-overdue`,
        inquiryId: inquiry.id,
        level: "critical",
        title: "SLA期限を超過しています",
        detail: `${inquiry.title} / ${sla.detail}`,
        href: `/inquiries/${inquiry.id}`,
      });
    } else if (sla.isDueSoon) {
      notifications.push({
        id: `${inquiry.id}-sla-soon`,
        inquiryId: inquiry.id,
        level: "warning",
        title: "SLA期限が近づいています",
        detail: `${inquiry.title} / ${sla.detail}`,
        href: `/inquiries/${inquiry.id}`,
      });
    }

    if (inquiry.approvalStatus === "PENDING") {
      notifications.push({
        id: `${inquiry.id}-approval-pending`,
        inquiryId: inquiry.id,
        level: "warning",
        title: "承認待ちの回答案があります",
        detail: `${inquiry.title} / 承認フローの確認が必要です。`,
        href: `/inquiries/${inquiry.id}`,
      });
    }

    if (inquiry.priority === "URGENT" && !inquiry.assigneeName) {
      notifications.push({
        id: `${inquiry.id}-urgent-unassigned`,
        inquiryId: inquiry.id,
        level: "critical",
        title: "緊急問い合わせが未割り当てです",
        detail: `${inquiry.title} / すぐに担当者設定が必要です。`,
        href: `/inquiries/${inquiry.id}`,
      });
    }

    return notifications;
  });

  return items
    .sort((a, b) => scoreLevel(b.level) - scoreLevel(a.level))
    .slice(0, 6);
}
