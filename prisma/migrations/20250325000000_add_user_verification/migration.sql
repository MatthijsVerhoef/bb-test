-- CreateTable
CREATE TABLE `UserVerification` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `licenseHash` VARCHAR(255) NULL,
  `licenseVerificationId` VARCHAR(20) NULL,
  `licenseCategories` JSON NULL,
  `licenseCountry` VARCHAR(50) NULL,
  `licenseExpiryDate` DATETIME(3) NULL,
  `licenseVerified` BOOLEAN NOT NULL DEFAULT false,
  `licenseVerificationDate` DATETIME(3) NULL,
  `identityVerified` BOOLEAN NOT NULL DEFAULT false,
  `identityVerificationDate` DATETIME(3) NULL,
  `phoneVerified` BOOLEAN NOT NULL DEFAULT false,
  `phoneVerificationDate` DATETIME(3) NULL,
  `emailVerified` BOOLEAN NOT NULL DEFAULT false,
  `emailVerificationDate` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `UserVerification_userId_key`(`userId`),
  INDEX `UserVerification_userId_idx`(`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserVerification` ADD CONSTRAINT `UserVerification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;