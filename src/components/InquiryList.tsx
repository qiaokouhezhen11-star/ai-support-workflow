import Link from "next/link";
import type { Inquiry } from "@/types/inquiry";
import {
  getCategoryBadgeClass,
  getCategoryLabel,
  getPriorityBadgeClass,
  getPriorityLabel,
  getStatusBadgeClass,
  getStatusLabel,
} from "@/lib/inquiryLabels";
import { formatSlaDate, getSlaMeta } from "@/lib/sla";

type Props = {
  inquiries: Inquiry[];
};

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
      {inquiries.map((inquiry) => {
        const sla = getSlaMeta({
          slaDueAt: inquiry.slaDueAt,
          status: inquiry.status,
        });

        return (
          <Link
            key={inquiry.id}
            href={`/inquiries/${inquiry.id}`}
            className="block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
          <div className="border-b border-slate-100 bg-gradient-to-r from-white via-slate-50 to-blue-50/60 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                      inquiry.status
                    )}`}
                  >
                    {getStatusLabel(inquiry.status)}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(
                      inquiry.priority
                    )}`}
                  >
                    優先度: {getPriorityLabel(inquiry.priority)}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryBadgeClass(
                      inquiry.category
                    )}`}
                  >
                    {getCategoryLabel(inquiry.category)}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${sla.toneClass}`}
                  >
                    {sla.label}
                  </span>
                </div>

                <h2 className="mt-3 text-lg font-bold text-slate-900">
                  {inquiry.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  顧客名: {inquiry.customerName}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Updated
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {new Date(inquiry.updatedAt).toLocaleString("ja-JP")}
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="grid gap-4 lg:grid-cols-[1.7fr_0.9fr]">
              <div>
                <p className="line-clamp-3 text-sm leading-7 text-slate-600">
                  {inquiry.inquiryBody}
                </p>

                {(inquiry.tags ?? []).length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {inquiry.tags?.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Assignee
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {inquiry.assigneeName ?? "未割り当て"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Comments
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {inquiry.commentCount ?? 0} 件
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    SLA Due
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatSlaDate(inquiry.slaDueAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{sla.detail}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Inquiry ID
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-slate-700">
                    {inquiry.id}
                  </p>
                </div>
              </div>
            </div>
          </div>
          </Link>
        );
      })}
    </div>
  );
}
