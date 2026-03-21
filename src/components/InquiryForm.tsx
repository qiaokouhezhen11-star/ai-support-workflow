"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useRole } from "@/components/RoleProvider";
import {
  readDraftHistory,
  type DraftHistoryItem,
  writeDraftHistory,
} from "@/lib/localDraftHistory";
import { buildSimilarInquiryCandidates } from "@/lib/inquiryInsights";
import { getStatusLabel } from "@/lib/inquiryLabels";
import type { DuplicateCheckInquiry } from "@/types/inquiry";

const STORAGE_KEY = "ai-support-workflow:new-inquiry-draft";
const HISTORY_KEY = "ai-support-workflow:new-inquiry-draft-history";
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

type InquiryDraft = {
  title: string;
  customerName: string;
  inquiryBody: string;
};

type Props = {
  existingInquiries?: DuplicateCheckInquiry[];
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("ja-JP");
}

export default function InquiryForm({ existingInquiries = [] }: Props) {
  const router = useRouter();
  const { can, roleLabel } = useRole();

  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [inquiryBody, setInquiryBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [restored, setRestored] = useState(false);
  const [history, setHistory] = useState<DraftHistoryItem<InquiryDraft>[]>([]);
  const canCreateInquiry = can("createInquiry");
  const duplicateCandidates = useMemo(() => {
    const draftTitle = title.trim();
    const draftBody = inquiryBody.trim();

    if (draftTitle.length < 4 && draftBody.length < 20) {
      return [];
    }

    return buildSimilarInquiryCandidates(
      {
        id: "draft",
        title: draftTitle,
        customerName: customerName.trim() || "入力中の顧客",
        inquiryBody: draftBody,
        category: null,
        priority: null,
        summary: null,
        draftReply: null,
        status: "OPEN",
        updatedAt: new Date().toISOString(),
        tags: [],
      },
      existingInquiries.map((item) => ({
        ...item,
        tags: item.tags,
      }))
    );
  }, [customerName, existingInquiries, inquiryBody, title]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    setHistory(readDraftHistory<InquiryDraft>(HISTORY_KEY));

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as {
        title?: string;
        customerName?: string;
        inquiryBody?: string;
      };

      if (parsed.title || parsed.customerName || parsed.inquiryBody) {
        setTitle(parsed.title ?? "");
        setCustomerName(parsed.customerName ?? "");
        setInquiryBody(parsed.inquiryBody ?? "");
        setRestored(true);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const hasValue = title.trim() || customerName.trim() || inquiryBody.trim();

    if (!hasValue) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const payload = {
      title,
      customerName,
      inquiryBody,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setHistory(
      writeDraftHistory<InquiryDraft>(HISTORY_KEY, {
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        label: `${title || "件名未入力"} / ${customerName || "顧客名未入力"}`,
        payload,
      })
    );
  }, [title, customerName, inquiryBody]);

  function restoreFromHistory(item: DraftHistoryItem<InquiryDraft>) {
    setTitle(item.payload.title);
    setCustomerName(item.payload.customerName);
    setInquiryBody(item.payload.inquiryBody);
    setRestored(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isDemoMode) {
      setError("デモモードでは新規登録を停止しています。ローカル環境でお試しください。");
      return;
    }

    if (!canCreateInquiry) {
      setError(`現在の権限（${roleLabel}）では問い合わせを登録できません。`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          customerName,
          inquiryBody,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "問い合わせの登録に失敗しました。");
      }

      const created = await res.json();
      window.localStorage.removeItem(STORAGE_KEY);
      router.push(`/inquiries/${created.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {restored ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          前回の入力内容をローカル保存から復元しました。
        </div>
      ) : null}

      {isDemoMode ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Vercelデモ環境では新規登録を停止しています。画面確認用の公開モードです。
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          件名
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canCreateInquiry}
          placeholder="例：装置画面がフリーズして操作できない"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          顧客名
        </label>
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          disabled={!canCreateInquiry}
          placeholder="例：株式会社サンプル"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          問い合わせ本文
        </label>
        <textarea
          value={inquiryBody}
          onChange={(e) => setInquiryBody(e.target.value)}
          disabled={!canCreateInquiry}
          placeholder="問い合わせ内容を入力してください"
          rows={10}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
          required
        />
      </div>

      {duplicateCandidates.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-900">
                似た問い合わせが見つかりました
              </p>
              <p className="mt-1 text-sm text-amber-700">
                重複登録を避けるため、先に既存案件を確認するのがおすすめです。
              </p>
            </div>
            <span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700">
              {duplicateCandidates.length} 件
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {duplicateCandidates.map((candidate) => (
              <Link
                key={candidate.id}
                href={`/inquiries/${candidate.id}`}
                className="block rounded-2xl border border-amber-200 bg-white p-4 transition hover:border-amber-300 hover:bg-amber-50/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {getStatusLabel(candidate.status)}
                  </span>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    一致度 {candidate.score} 点
                  </span>
                </div>
                <p className="mt-3 text-sm font-bold text-slate-900">{candidate.title}</p>
                <p className="mt-1 text-sm text-slate-500">{candidate.customerName}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{candidate.reason}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          入力途中の内容は、このブラウザ内に自動保存されます。
        </p>

        <button
          type="submit"
          disabled={loading || isDemoMode || !canCreateInquiry}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isDemoMode ? "デモモードでは登録停止中" : loading ? "登録中..." : "問い合わせを登録"}
        </button>
      </div>

      {history.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">復元履歴</p>
              <p className="mt-1 text-sm text-slate-500">
                直近の自動保存内容から、明示的に復元できます。
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              {history.length} 件
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(item.savedAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => restoreFromHistory(item)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  この内容を復元
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  );
}
