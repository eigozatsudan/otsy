/*
  Warnings:

  - You are about to drop the column `category_id` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `price_max` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `price_min` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `sort_order` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `shopper_id` on the `notification_logs` table. All the data in the column will be lost.
  - You are about to drop the column `shopper_id` on the `push_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_active_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `referral_code` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `referred_by` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `subscription_tier` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `chat_messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `item_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `kyc_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notification_preferences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_runs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `receipts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_credit_audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_credits` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shopper_preferences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shopper_ratings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shoppers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscription_audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscription_usages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `created_by` to the `items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `group_id` to the `items` table without a default value. This is not possible if the table is not empty.
  - Made the column `user_id` on table `notification_logs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `user_id` on table `push_subscriptions` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `display_name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_chat_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_order_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_shopper_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_user_fkey";

-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_order_id_fkey";

-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_shopper_id_fkey";

-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_user_id_fkey";

-- DropForeignKey
ALTER TABLE "items" DROP CONSTRAINT "items_category_id_fkey";

-- DropForeignKey
ALTER TABLE "kyc_documents" DROP CONSTRAINT "kyc_documents_shopper_id_fkey";

-- DropForeignKey
ALTER TABLE "notification_logs" DROP CONSTRAINT "notification_logs_shopper_id_fkey";

-- DropForeignKey
ALTER TABLE "notification_logs" DROP CONSTRAINT "notification_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "notification_preferences" DROP CONSTRAINT "notification_preferences_shopper_id_fkey";

-- DropForeignKey
ALTER TABLE "notification_preferences" DROP CONSTRAINT "notification_preferences_user_id_fkey";

-- DropForeignKey
ALTER TABLE "order_audit_logs" DROP CONSTRAINT "order_audit_logs_order_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_fkey";

-- DropForeignKey
ALTER TABLE "order_runs" DROP CONSTRAINT "order_runs_order_id_fkey";

-- DropForeignKey
ALTER TABLE "order_runs" DROP CONSTRAINT "order_runs_shopper_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_shopper_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_order_id_fkey";

-- DropForeignKey
ALTER TABLE "push_subscriptions" DROP CONSTRAINT "push_subscriptions_shopper_id_fkey";

-- DropForeignKey
ALTER TABLE "receipts" DROP CONSTRAINT "receipts_order_id_fkey";

-- DropForeignKey
ALTER TABLE "receipts" DROP CONSTRAINT "receipts_shopper_id_fkey";

-- DropForeignKey
ALTER TABLE "service_credit_audit_logs" DROP CONSTRAINT "service_credit_audit_logs_credit_id_fkey";

-- DropForeignKey
ALTER TABLE "service_credits" DROP CONSTRAINT "service_credits_user_id_fkey";

-- DropForeignKey
ALTER TABLE "shopper_preferences" DROP CONSTRAINT "shopper_preferences_shopper_id_fkey";

-- DropForeignKey
ALTER TABLE "shopper_ratings" DROP CONSTRAINT "shopper_ratings_order_id_fkey";

-- DropForeignKey
ALTER TABLE "shopper_ratings" DROP CONSTRAINT "shopper_ratings_shopper_id_fkey";

-- DropForeignKey
ALTER TABLE "shopper_ratings" DROP CONSTRAINT "shopper_ratings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "shoppers" DROP CONSTRAINT "shoppers_user_id_fkey";

-- DropForeignKey
ALTER TABLE "subscription_audit_logs" DROP CONSTRAINT "subscription_audit_logs_subscription_id_fkey";

-- DropForeignKey
ALTER TABLE "subscription_usages" DROP CONSTRAINT "subscription_usages_subscription_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_user_id_fkey";

-- DropIndex
DROP INDEX "items_name_category_id_key";

-- DropIndex
DROP INDEX "users_referral_code_key";

-- AlterTable
ALTER TABLE "items" DROP COLUMN "category_id",
DROP COLUMN "description",
DROP COLUMN "is_active",
DROP COLUMN "price_max",
DROP COLUMN "price_min",
DROP COLUMN "sort_order",
DROP COLUMN "unit",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "created_by" TEXT NOT NULL,
ADD COLUMN     "group_id" TEXT NOT NULL,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "quantity" TEXT NOT NULL DEFAULT '1',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'todo',
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "notification_logs" DROP COLUMN "shopper_id",
ALTER COLUMN "user_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "push_subscriptions" DROP COLUMN "shopper_id",
ALTER COLUMN "user_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "first_name",
DROP COLUMN "last_active_at",
DROP COLUMN "last_name",
DROP COLUMN "phone",
DROP COLUMN "referral_code",
DROP COLUMN "referred_by",
DROP COLUMN "role",
DROP COLUMN "subscription_tier",
DROP COLUMN "updated_at",
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "display_name" TEXT NOT NULL;

-- DropTable
DROP TABLE "chat_messages";

-- DropTable
DROP TABLE "chats";

-- DropTable
DROP TABLE "item_categories";

-- DropTable
DROP TABLE "kyc_documents";

-- DropTable
DROP TABLE "notification_preferences";

-- DropTable
DROP TABLE "order_audit_logs";

-- DropTable
DROP TABLE "order_items";

-- DropTable
DROP TABLE "order_runs";

-- DropTable
DROP TABLE "orders";

-- DropTable
DROP TABLE "payments";

-- DropTable
DROP TABLE "receipts";

-- DropTable
DROP TABLE "service_credit_audit_logs";

-- DropTable
DROP TABLE "service_credits";

-- DropTable
DROP TABLE "shopper_preferences";

-- DropTable
DROP TABLE "shopper_ratings";

-- DropTable
DROP TABLE "shoppers";

-- DropTable
DROP TABLE "subscription_audit_logs";

-- DropTable
DROP TABLE "subscription_usages";

-- DropTable
DROP TABLE "subscriptions";

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "invite_code" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "user_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("user_id","group_id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "purchased_by" TEXT NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JPY',
    "receipt_image_url" TEXT,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_items" (
    "purchase_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "unit_price" INTEGER,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("purchase_id","item_id")
);

-- CreateTable
CREATE TABLE "splits" (
    "id" TEXT NOT NULL,
    "purchase_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "share_amount" INTEGER NOT NULL,
    "rule" TEXT NOT NULL,

    CONSTRAINT "splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "item_id" TEXT,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads_impressions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "group_id" TEXT,
    "slot" TEXT NOT NULL,
    "creative_id" TEXT NOT NULL,
    "shown_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ads_impressions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "groups_invite_code_key" ON "groups"("invite_code");

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_purchased_by_fkey" FOREIGN KEY ("purchased_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "splits" ADD CONSTRAINT "splits_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "splits" ADD CONSTRAINT "splits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads_impressions" ADD CONSTRAINT "ads_impressions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads_impressions" ADD CONSTRAINT "ads_impressions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
