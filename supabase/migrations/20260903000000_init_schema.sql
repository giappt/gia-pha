-- ==============================================================================
-- FAT (Family Tree Management System) - Initial Database Schema
-- Coupled with: docs/03_DB-Schema.md
-- ==============================================================================

-- Enable UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Table: clan_settings (Cấu hình Dòng họ Toàn cục & Master Data Chi Tộc)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clan_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clan_name VARCHAR(255) NOT NULL,
    root_ancestor_id UUID, -- Will reference members(id) after members table is created
    branches JSONB NOT NULL DEFAULT '[]'::jsonb, -- Master Data danh sách Chi tộc
    regional_preset VARCHAR(20) NOT NULL DEFAULT 'north' CHECK (regional_preset IN ('north', 'central', 'south', 'custom')),
    custom_kinship_dictionary JSONB NOT NULL DEFAULT '{}'::jsonb,
    anniversary_notify_days_before INTEGER NOT NULL DEFAULT 1,
    allow_public_tree_view BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. Table: members (Thành viên Gia phả)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    alias_name VARCHAR(255),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    life_status VARCHAR(20) NOT NULL DEFAULT 'living' CHECK (life_status IN ('living', 'deceased')),
    father_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    mother_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    
    -- Ngày sinh
    birth_date DATE,
    birth_year INTEGER,
    
    -- Trọng tâm: Ngày mất Âm lịch (Dùng tính ngày giỗ)
    death_lunar_day SMALLINT CHECK (death_lunar_day BETWEEN 1 AND 30),
    death_lunar_month SMALLINT CHECK (death_lunar_month BETWEEN 1 AND 12),
    death_lunar_is_leap BOOLEAN NOT NULL DEFAULT FALSE,
    death_lunar_year_name VARCHAR(50), -- Năm Can Chi âm lịch (VD: "Ất Mão", "Giáp Dần")
    
    -- Hỗ trợ quy đổi / ghi nhận thêm
    death_date DATE,
    death_year INTEGER,
    
    -- Thông tin bổ trợ & Mộ phần
    avatar_url TEXT,
    phone VARCHAR(20),
    address TEXT,
    burial_location TEXT,
    burial_gps_lat DOUBLE PRECISION,
    burial_gps_lng DOUBLE PRECISION,
    notes TEXT,
    generation_level INTEGER DEFAULT 1,
    birth_order INTEGER DEFAULT 1,
    is_root BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- B-Tree Indexes on members for fast tree traversal & anniversary query
CREATE INDEX IF NOT EXISTS idx_members_father_id ON public.members(father_id);
CREATE INDEX IF NOT EXISTS idx_members_mother_id ON public.members(mother_id);
CREATE INDEX IF NOT EXISTS idx_members_lunar_anniversary ON public.members(death_lunar_month, death_lunar_day) WHERE life_status = 'deceased';

-- Circular Foreign Key from clan_settings to members
ALTER TABLE public.clan_settings 
    ADD CONSTRAINT fk_clan_root_ancestor FOREIGN KEY (root_ancestor_id) REFERENCES public.members(id) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 3. Table: spouse_relations (Quan hệ Hôn phối - Hỗ trợ Ghost Node)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.spouse_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_a_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    member_b_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    marriage_order SMALLINT NOT NULL DEFAULT 1,
    marriage_status VARCHAR(20) NOT NULL DEFAULT 'married' CHECK (marriage_status IN ('married', 'divorced', 'widowed')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_different_spouses CHECK (member_a_id <> member_b_id),
    CONSTRAINT uq_spouse_pair UNIQUE (member_a_id, member_b_id)
);

CREATE INDEX IF NOT EXISTS idx_spouse_member_a ON public.spouse_relations(member_a_id);
CREATE INDEX IF NOT EXISTS idx_spouse_member_b ON public.spouse_relations(member_b_id);

-- ------------------------------------------------------------------------------
-- 4. Table: users (Tài khoản Người dùng Hệ thống)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY, -- Maps to auth.users(id) của Supabase
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    user_role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (user_role IN ('viewer', 'claimed_member', 'branch_editor', 'super_admin')),
    linked_member_id UUID UNIQUE REFERENCES public.members(id) ON DELETE SET NULL,
    assigned_branch_code VARCHAR(50), -- Khớp với code trong clan_settings.branches
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. Table: claim_requests (Phiếu Yêu cầu Nhận Node)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.claim_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    claim_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (claim_status IN ('pending', 'approved', 'rejected')),
    verification_notes TEXT,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claims_user_id ON public.claim_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_member_id ON public.claim_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.claim_requests(claim_status);

-- ------------------------------------------------------------------------------
-- 6. Table: push_subscriptions (Đăng ký Web Push API)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_user_id ON public.push_subscriptions(user_id);

-- ------------------------------------------------------------------------------
-- Auto-update Trigger for updated_at
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clan_settings_updated_at BEFORE UPDATE ON public.clan_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_spouse_relations_updated_at BEFORE UPDATE ON public.spouse_relations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_claim_requests_updated_at BEFORE UPDATE ON public.claim_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- Enable Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.clan_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spouse_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Basic Read Policies
CREATE POLICY "Public read clan settings" ON public.clan_settings FOR SELECT USING (true);
CREATE POLICY "Public read members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Public read spouse relations" ON public.spouse_relations FOR SELECT USING (true);
