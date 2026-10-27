-- AlterTable
ALTER TABLE "library_items" ADD COLUMN     "searchKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
