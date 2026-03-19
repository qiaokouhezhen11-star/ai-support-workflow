import "dotenv/config";
import path from "path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl(rawUrl?: string) {
  const databaseUrl = rawUrl || "file:./dev.db";

  if (!databaseUrl.startsWith("file:")) {
    return databaseUrl;
  }

  const filePath = databaseUrl.slice("file:".length);

  if (!filePath || filePath.startsWith("/")) {
    return databaseUrl;
  }

  return `file:${path.resolve(process.cwd(), filePath)}`;
}

const adapter = new PrismaBetterSqlite3({
  url: resolveDatabaseUrl(process.env.DATABASE_URL),
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
