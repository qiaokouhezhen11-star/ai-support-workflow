"use client";

import { useMemo, useState } from "react";
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
import type { Inquiry, InquiryAuditAction, InquiryAuditLog } from "@/types/inquiry";

type Props = {
  inquiry: Inquiry;
};

const ACTION_OPTIONS: InquiryAuditAction[] = [
  "CREATED",
  "AI_ANALYZED",
  "STATUS_UPDATED",
  "ASSIGNEE_UPDATED",
  "AI_RESULT_SAVED",
  "COMMENT_ADDED",
  "FIELD_UPDATED",
];

function formatDate(date: string) {
  return new Date(date).toLocaleString("ja-JP");
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
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
  const timeline = useMemo(() => inquiry.auditLogs ?? [], [inquiry.auditLogs]);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [actorFilter, setActorFilter] = useState("");
  const [fieldFilter, setFieldFilter] = useState("");
  const [keywordFilter, setKeywordFilter] = useState("");

  const actorOptions = useMemo(
    () => Array.from(new Set(timeline.map((item) => item.actorName))).sort(),
    [timeline]
  );
  const fieldOptions = useMemo(
    () =>
      Array.from(
        new Set(timeline.map((item) => item.fieldName).filter((item): item is string => Boolean(item)))
      ).sort(),
    [timeline]
  );
  const filteredTimeline = useMemo(() => {
    const keyword = keywordFilter.trim().toLowerCase();

    return timeline.filter((item) => {
      if (actionFilter && item.action !== actionFilter) {
        return false;
      }

      if (actorFilter && item.actorName !== actorFilter) {
        return false;
      }

      if (fieldFilter && item.fieldName !== fieldFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const searchable = [
        item.actorName,
        item.comment ?? "",
        item.beforeValue ?? "",
        item.afterValue ?? "",
        item.fieldName ?? "",
        getAuditActionLabel(item.action),
        getFieldLabel(item.fieldName),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [actionFilter, actorFilter, fieldFilter, keywordFilter, timeline]);
  const actors = new Set(filteredTimeline.map((item) => item.actorName)).size;
  const fieldChanges = filteredTimeline.filter((item) => item.fieldName).length;

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

  function resetFilters() {
    setActionFilter("");
    setActorFilter("");
    setFieldFilter("");
    setKeywordFilter("");
  }

  function exportCsv() {
    const header = [
      "記録日時",
      "操作種別",
      "実行者",
      "更新項目",
      "変更前",
      "変更後",
      "コメント",
    ];

    const rows = filteredTimeline.map((item) => [
      formatDate(item.createdAt),
      getAuditActionLabel(item.action),
      item.actorName,
      getFieldLabel(item.fieldName),
      getDisplayValue(item.fieldName, item.beforeValue),
      getDisplayValue(item.fieldName, item.afterValue),
      item.comment ?? "",
    ]);

    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${inquiry.id}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">監査ログの絞り込み</h3>
            <p className="mt-1 text-sm text-slate-500">
              操作種別、実行者、項目、キーワードで履歴を絞り込めます。
            </p>
          </div>

          <button
            type="button"
            onClick={exportCsv}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            CSVを出力
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              操作種別
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
            >
              <option value="">すべて</option>
              {ACTION_OPTIONS.map((action) => (
                <option key={action} value={action}>
                  {getAuditActionLabel(action)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              実行者
            </label>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
            >
              <option value="">すべて</option>
              {actorOptions.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              更新項目
            </label>
            <select
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
            >
              <option value="">すべて</option>
              {fieldOptions.map((field) => (
                <option key={field} value={field}>
                  {getFieldLabel(field)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              キーワード
            </label>
            <input
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
              placeholder="コメントや差分で検索"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {filteredTimeline.length} 件を表示中 / 全 {timeline.length} 件
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            条件をリセット
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
          <p className="text-sm font-semibold text-slate-500">総ログ件数</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {filteredTimeline.length}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            現在の絞り込み条件で見えている件数です。
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
          {filteredTimeline.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6">
              <p className="text-sm font-medium text-slate-700">
                条件に一致する監査ログがありません
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                絞り込み条件をゆるめると、該当する履歴が表示されます。
              </p>
            </div>
          ) : null}

          {filteredTimeline.map((item, index) => {
            const isLast = index === filteredTimeline.length - 1;

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
                  } ${!isLast ? "hover:border-slate-300" : ""} transition`}
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
