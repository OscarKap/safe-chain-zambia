
-- ============ 1. Expand app_role enum ============
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'responder';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gbv_officer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';
