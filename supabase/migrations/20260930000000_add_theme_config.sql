-- Bổ sung cột theme_config vào bảng clan_settings cho hệ thống Clan Design Profiles
ALTER TABLE public.clan_settings
ADD COLUMN IF NOT EXISTS theme_config JSONB NOT NULL 
DEFAULT '{"active_profile": "classic", "apply_scope": "all", "allowed_user_ids": []}'::jsonb;
