-- AlterTable
ALTER TABLE "library_items" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
