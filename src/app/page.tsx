import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-blue-600">
            Portfolio #2
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            AI問い合わせ対応支援アプリ
          </h1>
          <p className="mt-4 max-w-3xl text-slate-600">
            問い合わせの登録・一覧管理・AIによる分類/優先度判定/要約/回答案生成・人間による確認保存までを行う、
            業務利用を意識した生成AIアプリです。
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500"
            >
              ダッシュボードを見る
            </Link>
            <Link
              href="/inquiries"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              問い合わせ一覧を見る
            </Link>
            <Link
              href="/inquiries/new"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              新規問い合わせを登録
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">問い合わせ管理</h2>
            <p className="mt-2 text-sm text-slate-600">
              一覧・詳細・ステータス管理の基本機能
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">AI解析</h2>
            <p className="mt-2 text-sm text-slate-600">
              カテゴリ分類、優先度判定、要約、回答案生成
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">人間確認</h2>
            <p className="mt-2 text-sm text-slate-600">
              AIの出力をそのまま送らず、編集して保存できる運用設計
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">ダッシュボード</h2>
            <p className="mt-2 text-sm text-slate-600">
              件数、担当者負荷、最近の更新をまとめて可視化
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
