/*
  Warnings:

  - Added the required column `productId` to the `RFQ` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `RFQ` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `RFQ` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RFQ" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quantity" REAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "buyerCompanyId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RFQ_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RFQ_buyerCompanyId_fkey" FOREIGN KEY ("buyerCompanyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RFQ" ("buyerCompanyId", "createdAt", "id", "status") SELECT "buyerCompanyId", "createdAt", "id", "status" FROM "RFQ";
DROP TABLE "RFQ";
ALTER TABLE "new_RFQ" RENAME TO "RFQ";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
