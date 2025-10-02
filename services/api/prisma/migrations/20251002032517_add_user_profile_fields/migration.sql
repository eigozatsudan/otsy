/*
  Warnings:

  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_active_at" TIMESTAMP(3),
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user',
ADD COLUMN     "subscription_tier" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ad_creatives" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "click_url" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_creatives_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ads_impressions" ADD CONSTRAINT "ads_impressions_creative_id_fkey" FOREIGN KEY ("creative_id") REFERENCES "ad_creatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;
