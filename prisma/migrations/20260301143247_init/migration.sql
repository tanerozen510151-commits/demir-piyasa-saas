/*
  Warnings:

  - You are about to drop the `ExchangeRate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfferItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RFQItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `createdAt` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `Offer` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Offer` table. All the data in the column will be lost.
  - You are about to drop the column `noteBuyer` on the `Offer` table. All the data in the column will be lost.
  - You are about to drop the column `noteSeller` on the `Offer` table. All the data in the column will be lost.
  - You are about to drop the column `totalNet` on the `Offer` table. All the data in the column will be lost.
  - You are about to drop the column `totalWithVat` on the `Offer` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Offer` table. All the data in the column will be lost.
  - You are about to drop the column `vatRate` on the `Offer` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `Offer` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `buyerId` on the `RFQ` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `RFQ` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `RFQ` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `RFQ` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - Added the required column `city` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxNumber` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryDate` to the `Offer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Offer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerCompanyId` to the `Offer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `basePrice` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerCompanyId` to the `RFQ` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ExchangeRate";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OfferItem";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RFQItem";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "taxNumber" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "type" TEXT NOT NULL
);
INSERT INTO "new_Company" ("id", "name") SELECT "id", "name" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE TABLE "new_Offer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rfqId" INTEGER NOT NULL,
    "sellerCompanyId" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "deliveryDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "Offer_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Offer_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Offer" ("id", "rfqId", "status") SELECT "id", "rfqId", "status" FROM "Offer";
DROP TABLE "Offer";
ALTER TABLE "new_Offer" RENAME TO "Offer";
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "basePrice" REAL NOT NULL
);
INSERT INTO "new_Product" ("id", "name", "unit") SELECT "id", "name", "unit" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE TABLE "new_RFQ" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "buyerCompanyId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RFQ_buyerCompanyId_fkey" FOREIGN KEY ("buyerCompanyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RFQ" ("createdAt", "id", "status") SELECT "createdAt", "id", "status" FROM "RFQ";
DROP TABLE "RFQ";
ALTER TABLE "new_RFQ" RENAME TO "RFQ";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "companyId" INTEGER,
    CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("companyId", "email", "id", "password") SELECT "companyId", "email", "id", "password" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
