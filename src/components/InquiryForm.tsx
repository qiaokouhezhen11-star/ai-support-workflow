"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "ai-support-workflow:new-inquiry-draft";

export default function InquiryForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [inquiryBody, setInquiryBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

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

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        title,
        customerName,
        inquiryBody,
      })
    );
  }, [title, customerName, inquiryBody]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          件名
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
          placeholder="問い合わせ内容を入力してください"
          rows={10}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
          required
        />
      </div>

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
          disabled={loading}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "登録中..." : "問い合わせを登録"}
        </button>
      </div>
    </form>
  );
}
