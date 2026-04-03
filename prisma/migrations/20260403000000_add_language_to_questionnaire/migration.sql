-- Add language field to Questionnaire for multilingual support (en/hi/gu)
ALTER TABLE "Questionnaire" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'en';
