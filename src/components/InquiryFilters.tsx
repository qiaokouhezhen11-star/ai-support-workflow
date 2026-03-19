"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  readDraftHistory,
  type DraftHistoryItem,
  writeDraftHistory,
} from "@/lib/localDraftHistory";

type Props = {
  assigneeOptions: string[];
};

const STORAGE_KEY = "ai-support-workflow:inquiry-filters";
const HISTORY_KEY = "ai-support-workflow:inquiry-filters-history";

type FilterDraft = {
  keyword: string;
  status: string;
  priority: string;
  assignee: string;
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("ja-JP");
}

export default function InquiryFilters({ assigneeOptions }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [priority, setPriority] = useState(searchParams.get("priority") ?? "");
  const [assignee, setAssignee] = useState(searchParams.get("assignee") ?? "");
  const [history, setHistory] = useState<DraftHistoryItem<FilterDraft>[]>([]);
  const restoredRef = useRef(false);

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    setKeyword(searchParams.get("keyword") ?? "");
    setStatus(searchParams.get("status") ?? "");
    setPriority(searchParams.get("priority") ?? "");
    setAssignee(searchParams.get("assignee") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (restoredRef.current) {
      return;
    }

    const hasQuery =
      searchParams.get("keyword") ||
      searchParams.get("status") ||
      searchParams.get("priority") ||
      searchParams.get("assignee");

    if (hasQuery) {
      restoredRef.current = true;
      return;
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    setHistory(readDraftHistory<FilterDraft>(HISTORY_KEY));

    if (!saved) {
      restoredRef.current = true;
      return;
    }

    try {
      const parsed = JSON.parse(saved) as {
        keyword?: string;
        status?: string;
        priority?: string;
        assignee?: string;
      };

      setKeyword(parsed.keyword ?? "");
      setStatus(parsed.status ?? "");
      setPriority(parsed.priority ?? "");
      setAssignee(parsed.assignee ?? "");

      const params = new URLSearchParams();

      if (parsed.keyword) params.set("keyword", parsed.keyword);
      if (parsed.status) params.set("status", parsed.status);
      if (parsed.priority) params.set("priority", parsed.priority);
      if (parsed.assignee) params.set("assignee", parsed.assignee);

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      restoredRef.current = true;
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const hasValue = keyword || status || priority || assignee;

    if (!hasValue) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        keyword,
        status,
        priority,
        assignee,
      })
    );
    setHistory(
      writeDraftHistory<FilterDraft>(HISTORY_KEY, {
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        label:
          keyword || assignee || status || priority
            ? `検索:${keyword || "なし"} / 担当:${assignee || "すべて"}`
            : "すべて",
        payload: {
          keyword,
          status,
          priority,
          assignee,
        },
      })
    );
  }, [keyword, status, priority, assignee]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if ((searchParams.get("keyword") ?? "") !== keyword) {
        updateParam("keyword", keyword);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [keyword, searchParams, updateParam]);

  function resetFilters() {
    setKeyword("");
    setStatus("");
    setPriority("");
    setAssignee("");
    window.localStorage.removeItem(STORAGE_KEY);
    router.push(pathname);
  }

  function restoreFromHistory(item: DraftHistoryItem<FilterDraft>) {
    setKeyword(item.payload.keyword);
    setStatus(item.payload.status);
    setPriority(item.payload.priority);
    setAssignee(item.payload.assignee);

    const params = new URLSearchParams();
    if (item.payload.keyword) params.set("keyword", item.payload.keyword);
    if (item.payload.status) params.set("status", item.payload.status);
    if (item.payload.priority) params.set("priority", item.payload.priority);
    if (item.payload.assignee) params.set("assignee", item.payload.assignee);

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            キーワード検索
          </label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="件名・顧客名・本文・担当者で検索"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            ステータス
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              updateParam("status", e.target.value);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
          >
            <option value="">すべて</option>
            <option value="OPEN">未対応</option>
            <option value="AI_DRAFTED">AI下書き済み</option>
            <option value="REVIEW_NEEDED">確認中</option>
            <option value="COMPLETED">完了</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            優先度
          </label>
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              updateParam("priority", e.target.value);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
          >
            <option value="">すべて</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            担当者
          </label>
          <select
            value={assignee}
            onChange={(e) => {
              setAssignee(e.target.value);
              updateParam("assignee", e.target.value);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
          >
            <option value="">すべて</option>
            <option value="__unassigned__">未割り当て</option>
            {assigneeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={resetFilters}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          条件をリセット
        </button>

        <p className="self-center text-sm text-slate-500">
          条件はこのブラウザ内に保存されます。
        </p>

        {isPending ? (
          <p className="self-center text-sm text-slate-500">絞り込み中...</p>
        ) : null}
      </div>

      {history.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">絞り込み復元履歴</p>
              <p className="mt-1 text-sm text-slate-500">
                直近の検索条件を一覧から呼び戻せます。
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
                  条件を復元
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
