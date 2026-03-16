import Link from "next/link";
import type { Inquiry } from "@/types/inquiry";

type Props = {
  inquiries: Inquiry[];
};

function statusLabel(status: Inquiry["status"]) {
  switch (status) {
    case "OPEN":
      return "未対応";
    case "AI_DRAFTED":
      return "AI下書き済み";
    case "REVIEW_NEEDED":
      return "確認中";
    case "COMPLETED":
      return "完了";
    default:
      return status;
  }
}

function priorityBadgeClass(priority: Inquiry["priority"]) {
  switch (priority) {
    case "LOW":
      return "bg-slate-100 text-slate-700";
    case "MEDIUM":
      return "bg-blue-50 text-blue-700";
    case "HIGH":
      return "bg-amber-50 text-amber-700";
    case "URGENT":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-500";
  }
}

export default function InquiryList({ inquiries }: Props) {
  if (inquiries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        条件に一致する問い合わせがありません。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {inquiries.map((inquiry) => (
        <Link
          key={inquiry.id}
          href={`/inquiries/${inquiry.id}`}
          className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{inquiry.title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                顧客名：{inquiry.customerName}
              </p>
            </div>

            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {statusLabel(inquiry.status)}
            </div>
          </div>

          <p className="mt-4 line-clamp-2 text-sm text-slate-600">
            {inquiry.inquiryBody}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              カテゴリ: {inquiry.category ?? "-"}
            </span>

            <span
              className={`rounded-full px-3 py-1 font-semibold ${priorityBadgeClass(
                inquiry.priority
              )}`}
            >
              優先度: {inquiry.priority ?? "-"}
            </span>

            <span className="text-slate-500">
              作成日: {new Date(inquiry.createdAt).toLocaleString("ja-JP")}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}