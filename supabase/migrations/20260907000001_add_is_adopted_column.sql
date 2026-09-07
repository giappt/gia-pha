-- ==============================================================================
-- FAT (Family Tree Management System) - Migration: Add is_adopted column
-- Coupled with: docs/03_DB-Schema.md and docs/16_Micro-Spec_Milestone_7_Admin_Portal_Reorganization.md
-- ==============================================================================

-- Bổ sung cột ghi nhận con nuôi cho bảng members (khắc phục lỗi Schema Cache khi import Excel)
ALTER TABLE public.members 
    ADD COLUMN IF NOT EXISTS is_adopted BOOLEAN NOT NULL DEFAULT FALSE;
