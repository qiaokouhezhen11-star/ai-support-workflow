"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Inquiry } from "@/types/inquiry";
import AiResultPanel from "./AiResultPanel";

type Props = {
  inquiry: Inquiry;
};

function statusLabel(status: Inquiry["status"]) {
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

export default function InquiryDetail({ inquiry }: Props) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setAnalyzing(true);
    setError("");
  
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inquiryId: inquiry.id,
        }),
      });
  
      const contentType = res.headers.get("content-type") || "";
  
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(
          `AI解析APIがJSONを返していません。status=${res.status}, body=${text.slice(0, 200)}`
        );
      }
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.error || "AI解析に失敗しました。");
      }
  
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI解析に失敗しました。");
    } finally {
      setAnalyzing(false);
    }
  }

  async function updateStatus(status: Inquiry["status"]) {
    setStatusUpdating(true);
    setError("");

    try {
      const res = await fetch(`/api/inquiries/${inquiry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ステータス更新に失敗しました。");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ステータス更新に失敗しました。");
    } finally {
      setStatusUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">問い合わせ詳細</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">{inquiry.title}</h1>
            <p className="mt-2 text-sm text-slate-500">
              顧客名：{inquiry.customerName}
            </p>
          </div>

          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            {statusLabel(inquiry.status)}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">カテゴリ</p>
            <p className="mt-2 text-sm font-bold text-slate-900">
              {inquiry.category ?? "-"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">優先度</p>
            <p className="mt-2 text-sm font-bold text-slate-900">
              {inquiry.priority ?? "-"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">作成日時</p>
            <p className="mt-2 text-sm font-bold text-slate-900">
              {new Date(inquiry.createdAt).toLocaleString("ja-JP")}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-bold text-slate-900">問い合わせ本文</h2>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {inquiry.inquiryBody}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {analyzing ? "AI解析中..." : "AIで解析する"}
          </button>

          <button
            onClick={() => updateStatus("COMPLETED")}
            disabled={statusUpdating}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50"
          >
            完了にする
          </button>

          <button
            onClick={() => updateStatus("OPEN")}
            disabled={statusUpdating}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50"
          >
            未対応に戻す
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}
      </section>

      <AiResultPanel inquiry={inquiry} onSaved={() => router.refresh()} />
    </div>
  );
}