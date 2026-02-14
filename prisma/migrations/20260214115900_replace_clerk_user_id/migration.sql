-- Replace clerkUserId with supabaseUserId
ALTER TABLE "User" ADD COLUMN "supabaseUserId" TEXT;
UPDATE "User" SET "supabaseUserId" = "clerkUserId" WHERE "supabaseUserId" IS NULL;
ALTER TABLE "User" ALTER COLUMN "supabaseUserId" SET NOT NULL;
DROP INDEX IF EXISTS "User_clerkUserId_key";
ALTER TABLE "User" DROP COLUMN "clerkUserId";
CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "User"("supabaseUserId");
