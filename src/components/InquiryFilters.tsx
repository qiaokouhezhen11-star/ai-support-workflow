"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Props = {
  assigneeOptions: string[];
};

export default function InquiryFilters({ assigneeOptions }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const keyword = searchParams.get("keyword") ?? "";
  const status = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const assignee = searchParams.get("assignee") ?? "";

  function updateParam(key: string, value: string) {
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
  }

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            キーワード検索
          </label>
          <input
            defaultValue={keyword}
            onChange={(e) => updateParam("keyword", e.target.value)}
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
            onChange={(e) => updateParam("status", e.target.value)}
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
            onChange={(e) => updateParam("priority", e.target.value)}
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
            onChange={(e) => updateParam("assignee", e.target.value)}
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
          onClick={() => router.push(pathname)}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          条件をリセット
        </button>

        {isPending ? (
          <p className="self-center text-sm text-slate-500">絞り込み中...</p>
        ) : null}
      </div>
    </div>
  );
}
