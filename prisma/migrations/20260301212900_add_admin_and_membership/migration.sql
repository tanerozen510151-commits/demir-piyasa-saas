-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "taxNumber" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'BUYER',
    "membershipType" TEXT NOT NULL DEFAULT 'BASIC',
    "membershipStart" DATETIME,
    "membershipEnd" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Company" ("city", "id", "name", "role", "taxNumber", "type") SELECT "city", "id", "name", "role", "taxNumber", "type" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
