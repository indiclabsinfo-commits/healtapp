-- CreateTable
CREATE TABLE `BreathingExercise` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `inhaleSeconds` INTEGER NOT NULL,
    `holdSeconds` INTEGER NOT NULL DEFAULT 0,
    `exhaleSeconds` INTEGER NOT NULL,
    `holdAfterExhale` INTEGER NOT NULL DEFAULT 0,
    `defaultCycles` INTEGER NOT NULL DEFAULT 5,
    `category` VARCHAR(191) NOT NULL DEFAULT 'relaxation',
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BreathingFavourite` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `exerciseId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BreathingFavourite_userId_exerciseId_key`(`userId`, `exerciseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BreathingHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `exerciseId` INTEGER NOT NULL,
    `cycles` INTEGER NOT NULL,
    `durationSec` INTEGER NOT NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BreathingFavourite` ADD CONSTRAINT `BreathingFavourite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BreathingFavourite` ADD CONSTRAINT `BreathingFavourite_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `BreathingExercise`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BreathingHistory` ADD CONSTRAINT `BreathingHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BreathingHistory` ADD CONSTRAINT `BreathingHistory_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `BreathingExercise`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
