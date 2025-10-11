-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('MOST_WANTED', 'WANTED', 'IN_DEMAND', 'UNCOMMON', 'COMMON');

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "country" VARCHAR(100),
ADD COLUMN     "dob" TIMESTAMP(3),
ADD COLUMN     "firstName" VARCHAR(50),
ADD COLUMN     "gender" VARCHAR(10),
ADD COLUMN     "lastName" VARCHAR(50),
ADD COLUMN     "state" VARCHAR(100),
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "street" VARCHAR(100),
ADD COLUMN     "streetNumberOrName" VARCHAR(100),
ADD COLUMN     "zipCode" VARCHAR(20);

-- CreateTable
CREATE TABLE "BoxCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "photo" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoxCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Box" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "backgroundImage" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "boxCategoryId" TEXT NOT NULL,
    "purchasedCount" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalPayout" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "exchangeablePayout" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "retainedProfitPercentage" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Box_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "price" DECIMAL(65,30),
    "percentage" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "ItemStatus" NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "purchasedCount" INTEGER NOT NULL DEFAULT 0,
    "boxId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BoxCategory_name_key" ON "BoxCategory"("name");

-- CreateIndex
CREATE INDEX "BoxCategory_order_idx" ON "BoxCategory"("order");

-- CreateIndex
CREATE INDEX "Box_boxCategoryId_idx" ON "Box"("boxCategoryId");

-- CreateIndex
CREATE INDEX "Box_isActive_order_idx" ON "Box"("isActive", "order");

-- AddForeignKey
ALTER TABLE "Box" ADD CONSTRAINT "Box_boxCategoryId_fkey" FOREIGN KEY ("boxCategoryId") REFERENCES "BoxCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
