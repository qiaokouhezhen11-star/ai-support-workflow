"use client";

import { useEffect, useMemo, useState } from "react";
import type { Inquiry } from "@/types/inquiry";
import {
  getCategoryBadgeClass,
  getCategoryLabel,
  getPriorityBadgeClass,
  getPriorityLabel,
} from "@/lib/inquiryLabels";

type Props = {
  inquiry: Inquiry;
  onSaved: () => void;
  actorName?: string | null;
};

const categoryOptions = [
  "GENERAL",
  "TROUBLESHOOTING",
  "BILLING",
  "FEATURE_REQUEST",
  "OTHER",
] as const;

const priorityOptions = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function FieldCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyStateCard() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            まだAI解析結果が入力されていません
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            上の「AIで解析する」を実行すると、カテゴリ・優先度・要約・回答案・判定理由がここに表示されます。
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Next Action
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            AI解析を実行
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AiResultPanel({ inquiry, onSaved, actorName }: Props) {
  const [category, setCategory] = useState<(typeof categoryOptions)[number]>(
    inquiry.category ?? "GENERAL"
  );
  const [priority, setPriority] = useState<(typeof priorityOptions)[number]>(
    inquiry.priority ?? "MEDIUM"
  );
  const [summary, setSummary] = useState(inquiry.summary ?? "");
  const [draftReply, setDraftReply] = useState(inquiry.draftReply ?? "");
  const [aiReason, setAiReason] = useState(inquiry.aiReason ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    setCategory(inquiry.category ?? "GENERAL");
    setPriority(inquiry.priority ?? "MEDIUM");
    setSummary(inquiry.summary ?? "");
    setDraftReply(inquiry.draftReply ?? "");
    setAiReason(inquiry.aiReason ?? "");
  }, [
    inquiry.category,
    inquiry.priority,
    inquiry.summary,
    inquiry.draftReply,
    inquiry.aiReason,
  ]);

  const isEmpty = useMemo(() => {
    return !summary.trim() && !draftReply.trim() && !aiReason.trim();
  }, [summary, draftReply, aiReason]);

  async function handleSave() {
    if (isDemoMode) {
      setMessage("デモモードではAI解析結果の保存を停止しています。");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const res = await fetch(`/api/inquiries/${inquiry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          priority,
          summary,
          draftReply,
          aiReason,
          status: "REVIEW_NEEDED",
          actorName: actorName || inquiry.assigneeName || "担当者",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "保存に失敗しました。");
      }

      setMessage("AI解析結果を保存しました。ステータスを「確認中」に更新しています。");
      setMessageType("success");
      onSaved();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "保存に失敗しました。");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-violet-50 via-white to-blue-50/60 px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <SectionHeading
            eyebrow="AI解析結果"
            title="AIの解析結果を確認・編集"
            description="AIが生成したカテゴリ・優先度・要約・回答案・判定理由を確認し、必要に応じて修正してから保存します。"
          />

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                カテゴリ
              </p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {getCategoryLabel(category)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                要約文字数
              </p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {summary.trim().length} 文字
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                回答案文字数
              </p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {draftReply.trim().length} 文字
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryBadgeClass(
              category
            )}`}
          >
            カテゴリ: {getCategoryLabel(category)}
          </span>

          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(
              priority
            )}`}
          >
            優先度: {getPriorityLabel(priority)}
          </span>

          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            状態: {isEmpty ? "未解析または未入力" : "編集可能"}
          </span>
        </div>
      </div>

      <div className="px-6 py-6 md:px-8">
        {isDemoMode ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Vercelデモ環境ではAI結果の保存を停止しています。ローカル環境では通常どおり編集できます。
          </div>
        ) : null}

        {isEmpty ? <EmptyStateCard /> : null}

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <FieldCard
            title="カテゴリ"
            description="問い合わせ内容の種類を選びます。AI提案を確認して必要なら修正してください。"
          >
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as (typeof categoryOptions)[number])
              }
              disabled={isDemoMode}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {getCategoryLabel(item)}
                </option>
              ))}
            </select>

            <div className="mt-3">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryBadgeClass(
                  category
                )}`}
              >
                現在の設定: {getCategoryLabel(category)}
              </span>
            </div>
          </FieldCard>

          <FieldCard
            title="優先度"
            description="対応の緊急度を設定します。運用上の優先順に合わせて調整できます。"
          >
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as (typeof priorityOptions)[number])
              }
              disabled={isDemoMode}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {priorityOptions.map((item) => (
                <option key={item} value={item}>
                  {getPriorityLabel(item)}
                </option>
              ))}
            </select>

            <div className="mt-3">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(
                  priority
                )}`}
              >
                現在の設定: {getPriorityLabel(priority)}
              </span>
            </div>
          </FieldCard>
        </div>

        <div className="mt-5">
          <FieldCard
            title="要約"
            description="問い合わせ内容を短く整理したメモです。担当者が素早く内容を把握できるようにします。"
          >
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={isDemoMode}
              rows={4}
              placeholder="AIが生成した要約、または手動で修正した要約を入力"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </FieldCard>
        </div>

        <div className="mt-5">
          <FieldCard
            title="回答案"
            description="顧客への一次回答のたたき台です。そのまま送信せず、内容確認後に活用する想定です。"
          >
            <textarea
              value={draftReply}
              onChange={(e) => setDraftReply(e.target.value)}
              disabled={isDemoMode}
              rows={10}
              placeholder="AIが生成した回答案、または手動で修正した回答案を入力"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </FieldCard>
        </div>

        <div className="mt-5">
          <FieldCard
            title="判定理由"
            description="カテゴリや優先度をそのように判断した理由です。あとで見返しても判断根拠が分かるようにします。"
          >
            <textarea
              value={aiReason}
              onChange={(e) => setAiReason(e.target.value)}
              disabled={isDemoMode}
              rows={5}
              placeholder="AIの判断理由、または手動で修正した理由を入力"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </FieldCard>
        </div>

        {message ? (
          <div
            className={`mt-5 rounded-2xl border px-4 py-3 ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                messageType === "success" ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {messageType === "success" ? "保存完了" : "エラー"}
            </p>
            <p
              className={`mt-1 text-sm leading-6 ${
                messageType === "success" ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            保存すると、AI解析結果が問い合わせに反映され、ステータスが「確認中」になります。
          </p>

          <button
            onClick={handleSave}
            disabled={saving || isDemoMode}
            className="inline-flex min-w-[180px] items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDemoMode ? "デモモードでは保存停止中" : saving ? "保存中..." : "AI結果を保存"}
          </button>
        </div>
      </div>
    </section>
  );
}
