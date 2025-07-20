/*
  Warnings:

  - The primary key for the `Tags` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Tags` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tags" (
    "title" TEXT NOT NULL PRIMARY KEY
);
INSERT INTO "new_Tags" ("title") SELECT "title" FROM "Tags";
DROP TABLE "Tags";
ALTER TABLE "new_Tags" RENAME TO "Tags";
CREATE UNIQUE INDEX "Tags_title_key" ON "Tags"("title");
CREATE TABLE "new__ArticleToTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ArticleToTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ArticleToTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tags" ("title") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new__ArticleToTags" ("A", "B") SELECT "A", "B" FROM "_ArticleToTags";
DROP TABLE "_ArticleToTags";
ALTER TABLE "new__ArticleToTags" RENAME TO "_ArticleToTags";
CREATE UNIQUE INDEX "_ArticleToTags_AB_unique" ON "_ArticleToTags"("A", "B");
CREATE INDEX "_ArticleToTags_B_index" ON "_ArticleToTags"("B");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
