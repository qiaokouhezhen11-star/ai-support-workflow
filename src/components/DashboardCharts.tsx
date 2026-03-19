type BarChartItem = {
  label: string;
  value: number;
  colorClass: string;
};

type TrendChartItem = {
  label: string;
  value: number;
};

type Props = {
  categoryItems: BarChartItem[];
  intakeTrend: TrendChartItem[];
  total: number;
};

function percent(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function buildPolylinePoints(values: number[]) {
  if (values.length === 0) {
    return "";
  }

  const maxValue = Math.max(...values, 1);

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - (value / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function DashboardCharts({
  categoryItems,
  intakeTrend,
  total,
}: Props) {
  const values = intakeTrend.map((item) => item.value);
  const polylinePoints = buildPolylinePoints(values);
  const areaPoints = polylinePoints
    ? `0,100 ${polylinePoints} 100,100`
    : "";

  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">カテゴリ別件数</h2>
            <p className="mt-1 text-sm text-slate-500">
              どの種類の問い合わせが多いかを、棒グラフで把握できます。
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            Category Mix
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {categoryItems.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">{item.label}</span>
                <span className="text-slate-500">
                  {item.value} 件 / {percent(item.value, total)}%
                </span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-slate-100">
                <div
                  className={`h-3 rounded-full ${item.colorClass}`}
                  style={{ width: `${percent(item.value, total)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">直近7日の受付推移</h2>
            <p className="mt-1 text-sm text-slate-500">
              1週間の新規受付件数を線グラフで見える化しています。
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            7 Days
          </span>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,_rgba(59,130,246,0.08)_0%,_rgba(255,255,255,0)_100%)] p-4">
          <svg viewBox="0 0 100 100" className="h-52 w-full">
            <defs>
              <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(59 130 246 / 0.35)" />
                <stop offset="100%" stopColor="rgb(59 130 246 / 0.02)" />
              </linearGradient>
            </defs>

            <line x1="0" y1="100" x2="100" y2="100" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="0" y1="66" x2="100" y2="66" stroke="#e2e8f0" strokeWidth="0.8" />
            <line x1="0" y1="33" x2="100" y2="33" stroke="#e2e8f0" strokeWidth="0.8" />

            {areaPoints ? (
              <polygon points={areaPoints} fill="url(#trend-fill)" />
            ) : null}
            {polylinePoints ? (
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}
          </svg>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {intakeTrend.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center">
                <p className="text-[11px] font-semibold text-slate-500">{item.label}</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
