type Props = {
  total: number;
  openCount: number;
  aiDraftedCount: number;
  completedCount: number;
  assignedCount: number;
};

export default function StatsCards({
  total,
  openCount,
  aiDraftedCount,
  completedCount,
  assignedCount,
}: Props) {
  const items = [
    {
      label: "総件数",
      value: total,
      note: "現在管理中の問い合わせ",
      className: "from-slate-50 to-white",
    },
    {
      label: "未対応",
      value: openCount,
      note: "初動確認が必要",
      className: "from-amber-50 to-white",
    },
    {
      label: "AI下書き済み",
      value: aiDraftedCount,
      note: "担当者レビュー待ち",
      className: "from-blue-50 to-white",
    },
    {
      label: "担当者設定済み",
      value: assignedCount,
      note: "責任の所在が明確",
      className: "from-violet-50 to-white",
    },
    {
      label: "完了",
      value: completedCount,
      note: "対応完了済み",
      className: "from-emerald-50 to-white",
    },
  ];

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-3xl border border-slate-200 bg-gradient-to-br p-5 shadow-sm ${item.className}`}
        >
          <p className="text-sm font-semibold text-slate-500">{item.label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {item.value}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{item.note}</p>
        </div>
      ))}
    </div>
  );
}
