"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AppNotification } from "@/lib/notifications";

type Props = {
  notifications: AppNotification[];
};

function getToneClass(level: AppNotification["level"]) {
  switch (level) {
    case "critical":
      return "border-red-200 bg-red-50 text-red-700";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "info":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getSummary(notifications: AppNotification[]) {
  const critical = notifications.filter((item) => item.level === "critical").length;
  const warning = notifications.filter((item) => item.level === "warning").length;

  if (critical > 0) {
    return `緊急 ${critical} 件、注意 ${warning} 件の通知があります。`;
  }

  if (warning > 0) {
    return `注意したい通知が ${warning} 件あります。`;
  }

  return `確認しておきたい通知が ${notifications.length} 件あります。`;
}

export default function AppNotificationCenter({ notifications }: Props) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => !dismissed.includes(item.id)),
    [dismissed, notifications]
  );

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">アプリ内通知</p>
            <p className="mt-1 text-sm text-slate-600">
              {getSummary(visibleNotifications)}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            ダッシュボードで確認
          </Link>
        </div>

        <div className="mt-4 grid gap-3">
          {visibleNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-2xl border px-4 py-4 ${getToneClass(notification.level)}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{notification.title}</p>
                  <p className="mt-1 text-sm leading-6">{notification.detail}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={notification.href}
                    className="rounded-xl border border-current/20 bg-white/80 px-3 py-2 text-sm font-semibold transition hover:bg-white"
                  >
                    詳細を見る
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      setDismissed((current) => [...current, notification.id])
                    }
                    className="rounded-xl border border-current/20 bg-transparent px-3 py-2 text-sm font-semibold transition hover:bg-white/50"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
