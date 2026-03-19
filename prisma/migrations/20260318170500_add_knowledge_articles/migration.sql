-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "priority" TEXT,
    "tagsText" TEXT,
    "keywordsText" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT '担当者',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "KnowledgeArticle_category_priority_updatedAt_idx" ON "KnowledgeArticle"("category", "priority", "updatedAt");
