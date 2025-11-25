-- CreateTable
CREATE TABLE "Family" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "root" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Family_code_key" UNIQUE ("code")
);

-- CreateTable
CREATE TABLE "LinkRequest" (
    "id" TEXT NOT NULL,
    "fromCode" TEXT NOT NULL,
    "toCode" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "targetBirthYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LinkRequest_fromCode_idx" ON "LinkRequest"("fromCode");

-- CreateIndex
CREATE INDEX "LinkRequest_toCode_idx" ON "LinkRequest"("toCode");