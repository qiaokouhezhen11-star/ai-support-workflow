type Props = {
    total: number;
    openCount: number;
    aiDraftedCount: number;
    completedCount: number;
  };
  
  export default function StatsCards({
    total,
    openCount,
    aiDraftedCount,
    completedCount,
  }: Props) {
    const items = [
      { label: "総件数", value: total },
      { label: "未対応", value: openCount },
      { label: "AI下書き済み", value: aiDraftedCount },
      { label: "完了", value: completedCount },
    ];
  
    return (
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>
    );
  }