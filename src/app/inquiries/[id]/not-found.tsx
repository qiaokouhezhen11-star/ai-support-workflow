import Link from "next/link";

export default function InquiryNotFoundPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-amber-50 via-white to-rose-50/60 px-6 py-6 md:px-8">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              問い合わせが見つかりません
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              この詳細URLは現在のデータに存在しません
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              サンプルデータを入れ直したあとなどに、以前の問い合わせIDで開くとこの状態になります。
              アプリ自体が壊れているわけではないので、一覧画面から開き直せば大丈夫です。
            </p>
          </div>

          <div className="px-6 py-6 md:px-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-800">よくある原因</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                <li>`npm run seed` を実行して、問い合わせIDが新しくなった</li>
                <li>ブラウザが古い詳細URLを開いたままになっている</li>
                <li>存在しないIDを手入力して開いた</li>
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/inquiries"
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                問い合わせ一覧へ戻る
              </Link>

              <Link
                href="/inquiries/new"
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                新規問い合わせを登録
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
