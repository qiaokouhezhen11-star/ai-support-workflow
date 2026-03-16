"use client";

import { useState } from "react";
import type { Inquiry } from "@/types/inquiry";

type Props = {
  inquiry: Inquiry;
  onSaved: () => void;
};

const categoryOptions = [
  "GENERAL",
  "TROUBLESHOOTING",
  "BILLING",
  "FEATURE_REQUEST",
  "OTHER",
] as const;

const priorityOptions = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export default function AiResultPanel({ inquiry, onSaved }: Props) {
  const [category, setCategory] = useState(inquiry.category ?? "GENERAL");
  const [priority, setPriority] = useState(inquiry.priority ?? "MEDIUM");
  const [summary, setSummary] = useState(inquiry.summary ?? "");
  const [draftReply, setDraftReply] = useState(inquiry.draftReply ?? "");
  const [aiReason, setAiReason] = useState(inquiry.aiReason ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");

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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "保存に失敗しました。");
      }

      setMessage("AI解析結果を保存しました。");
      onSaved();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">AI解析結果</h2>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            カテゴリ
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
          >
            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            優先度
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof priority)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
          >
            {priorityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          要約
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
        />
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          回答案
        </label>
        <textarea
          value={draftReply}
          onChange={(e) => setDraftReply(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
        />
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          判定理由
        </label>
        <textarea
          value={aiReason}
          onChange={(e) => setAiReason(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
        />
      </div>

      {message ? (
        <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
          {message}
        </p>
      ) : null}

      <div className="mt-5">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "保存中..." : "AI結果を保存"}
        </button>
      </div>
    </section>
  );
}