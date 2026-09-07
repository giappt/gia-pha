-- ==============================================================================
-- FAT (Family Tree Management System) - Migration: Schema Sync & Auth Trigger
-- Coupled with: docs/03_DB-Schema.md and docs/16_Micro-Spec_Milestone_7_Admin_Portal_Reorganization.md
-- ==============================================================================

-- 1. Bổ sung các cột nghiệp vụ cho bảng members
ALTER TABLE public.members 
    ADD COLUMN IF NOT EXISTS is_senior BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS branch_name VARCHAR(100);

-- 2. Bổ sung các cột cấu hình phân cấp và cờ tính năng cho bảng clan_settings
ALTER TABLE public.clan_settings 
    ADD COLUMN IF NOT EXISTS branch_tiers JSONB NOT NULL DEFAULT '["Ngành", "Chi", "Nhánh", "Phái"]'::jsonb,
    ADD COLUMN IF NOT EXISTS feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 3. Cập nhật trigger tự động đồng bộ tài khoản Google OAuth từ auth.users sang public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    designated_admin_email CONSTANT TEXT := 'giap.pt.90@gmail.com';
    user_initial_role VARCHAR(20) := 'viewer';
BEGIN
    -- Tự động thăng cấp Super Admin nếu trùng khớp email quản trị viên dòng họ
    IF LOWER(COALESCE(NEW.email, '')) = LOWER(designated_admin_email) THEN
        user_initial_role := 'super_admin';
    END IF;

    INSERT INTO public.users (id, email, full_name, avatar_url, user_role, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        user_initial_role,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE WHEN public.users.full_name IS NULL OR public.users.full_name = '' THEN EXCLUDED.full_name ELSE public.users.full_name END,
        avatar_url = CASE WHEN public.users.avatar_url IS NULL OR public.users.avatar_url = '' THEN EXCLUDED.avatar_url ELSE public.users.avatar_url END,
        user_role = CASE WHEN LOWER(EXCLUDED.email) = LOWER(designated_admin_email) THEN 'super_admin' ELSE public.users.user_role END,
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Đăng ký trigger trên auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Bổ sung các chính sách bảo mật RLS cơ bản cho users và clan_settings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Public users read'
    ) THEN
        CREATE POLICY "Public users read" ON public.users FOR SELECT USING (true);
    END IF;
END $$;
