-- ==============================================================================
-- FAT (Family Tree Management System) - Migration: Add marital_status & marital_event_year
-- Coupled with: docs/03_DB-Schema.md and docs/13_Micro-Spec_Milestone_4_Member_Management_Import.md
-- ==============================================================================

-- 1. Bổ sung trường tình trạng hôn nhân đặc biệt và năm biến cố cho bảng members
ALTER TABLE public.members 
    ADD COLUMN IF NOT EXISTS marital_status VARCHAR(30) NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS marital_event_year INTEGER NULL DEFAULT NULL;

-- 2. Ràng buộc miền giá trị cho marital_status (remarried, divorced)
ALTER TABLE public.members
    DROP CONSTRAINT IF EXISTS chk_member_marital_status;

ALTER TABLE public.members
    ADD CONSTRAINT chk_member_marital_status 
    CHECK (marital_status IS NULL OR marital_status IN ('remarried', 'divorced'));

-- 3. Nới lỏng CHECK constraint trên bảng spouse_relations cho marriage_status (hỗ trợ remarried)
ALTER TABLE public.spouse_relations
    DROP CONSTRAINT IF EXISTS spouse_relations_marriage_status_check;

ALTER TABLE public.spouse_relations
    ADD CONSTRAINT spouse_relations_marriage_status_check 
    CHECK (marriage_status IN ('married', 'divorced', 'widowed', 'remarried'));
