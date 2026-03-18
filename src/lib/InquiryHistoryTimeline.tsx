import {
  getAuditActionBadgeClass,
  getAuditActionCardClass,
  getAuditActionDotClass,
  getAuditActionLabel,
} from "@/lib/auditLogs";
import {
  getCategoryLabel,
  getPriorityLabel,
  getStatusLabel,
} from "@/lib/inquiryLabels";
import type { Inquiry, InquiryAuditLog } from "@/types/inquiry";

type Props = {
  inquiry: Inquiry;
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("ja-JP");
}

function getDisplayValue(fieldName: string | null, value: string | null) {
  if (!value) {
    return "未設定";
  }

  switch (fieldName) {
    case "status":
      return getStatusLabel(value as Inquiry["status"]);
    case "priority":
      return getPriorityLabel(value as Inquiry["priority"]);
    case "category":
      return getCategoryLabel(value as Inquiry["category"]);
    default:
      return value;
  }
}

function getFieldLabel(fieldName: string | null) {
  switch (fieldName) {
    case "status":
      return "ステータス";
    case "assigneeName":
      return "担当者";
    case "priority":
      return "優先度";
    case "category":
      return "カテゴリ";
    case "summary":
      return "要約";
    case "draftReply":
      return "回答案";
    case "aiReason":
      return "判定理由";
    case "comment":
      return "コメント";
    case "tags":
      return "タグ";
    case "title":
      return "件名";
    case "customerName":
      return "顧客名";
    case "inquiryBody":
      return "問い合わせ本文";
    default:
      return "更新項目";
  }
}

function DiffBlock({ log }: { log: InquiryAuditLog }) {
  if (!log.fieldName && !log.beforeValue && !log.afterValue) {
    return null;
  }

  return (
    <div className="mt-4 rounded-3xl border border-slate-200 bg-white/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {getFieldLabel(log.fieldName)}
        </p>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          変更差分
        </span>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Before
          </p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
            {getDisplayValue(log.fieldName, log.beforeValue)}
          </p>
        </div>
        <div className="hidden items-center justify-center md:flex">
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
            →
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            After
          </p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
            {getDisplayValue(log.fieldName, log.afterValue)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InquiryHistoryTimeline({ inquiry }: Props) {
  const timeline = inquiry.auditLogs ?? [];
  const actors = new Set(timeline.map((item) => item.actorName)).size;
  const fieldChanges = timeline.filter((item) => item.fieldName).length;

  if (timeline.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6">
        <p className="text-sm font-medium text-slate-700">表示できる監査ログはまだありません</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          問い合わせの登録・AI解析・保存・ステータス更新を行うと、ここに履歴が残ります。
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
          <p className="text-sm font-semibold text-slate-500">総ログ件数</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {timeline.length}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            登録から更新までの記録件数です。
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-5">
          <p className="text-sm font-semibold text-slate-500">更新項目数</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {fieldChanges}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            差分表示つきで確認できる更新の件数です。
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-5">
          <p className="text-sm font-semibold text-slate-500">関与人数</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {actors}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            監査ログ上で確認できる実行者の人数です。
          </p>
        </div>
      </div>

      <div className="relative pl-6">
      <div className="absolute left-[11px] top-1 bottom-1 w-px bg-slate-200" />

      <div className="space-y-5">
        {timeline.map((item, index) => {
          const isLast = index === timeline.length - 1;

          return (
            <div key={item.id} className="relative">
              <div
                className={`absolute left-[-24px] top-2 h-6 w-6 rounded-full ring-4 ${getAuditActionDotClass(
                  item.action
                )}`}
              />

              <div
                className={`rounded-3xl border border-slate-200 bg-gradient-to-r p-4 shadow-sm ${
                  getAuditActionCardClass(item.action)
                } ${
                  !isLast ? "hover:border-slate-300" : ""
                } transition`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getAuditActionBadgeClass(
                          item.action
                        )}`}
                      >
                        {getAuditActionLabel(item.action)}
                      </span>

                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        実行者: {item.actorName}
                      </span>

                      {item.fieldName ? (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          項目: {getFieldLabel(item.fieldName)}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {item.comment ?? "更新履歴が記録されました。"}
                    </p>

                    <DiffBlock log={item} />
                  </div>

                  <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Recorded At
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}
