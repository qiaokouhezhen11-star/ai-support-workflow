"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

type Props = {
  assigneeOptions: string[];
};

const STORAGE_KEY = "ai-support-workflow:inquiry-filters";

export default function InquiryFilters({ assigneeOptions }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [priority, setPriority] = useState(searchParams.get("priority") ?? "");
  const [assignee, setAssignee] = useState(searchParams.get("assignee") ?? "");
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
            placeholder="件名・顧客名・本文で検索"
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
    </div>
  );
}
