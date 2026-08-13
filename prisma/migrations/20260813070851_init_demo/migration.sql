-- CreateTable
CREATE TABLE "demos" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demos_pkey" PRIMARY KEY ("id")
);
