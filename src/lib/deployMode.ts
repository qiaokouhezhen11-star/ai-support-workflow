export function isDemoModeEnabled() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function isReadOnlyDeployment() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  const isSqlite = databaseUrl.startsWith("file:");

  return isDemoModeEnabled() || (process.env.VERCEL === "1" && isSqlite);
}

export function getReadOnlyDeploymentMessage() {
  return "Vercelデモ環境ではデータ更新を停止しています。閲覧中心の公開用モードとしてご利用ください。";
}
