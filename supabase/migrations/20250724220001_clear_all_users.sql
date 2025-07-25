-- Clear all users from the system
-- This will remove all auth.users and related data to start fresh

-- First, disable triggers and constraints temporarily
SET session_replication_role = replica;

-- Delete from dependent tables first (in proper order)
DELETE FROM public.user_global_item_usage;
DELETE FROM public.admin_actions;
DELETE FROM public.company_settings;
DELETE FROM public.users;
DELETE FROM public.customers;
DELETE FROM public.subscriptions;
DELETE FROM public.line_items;
DELETE FROM public.item_categories;
DELETE FROM public.quotes;

-- Finally, delete from auth.users (this is the main auth table)
DELETE FROM auth.users;

-- Re-enable triggers and constraints
SET session_replication_role = DEFAULT;

-- Reset any sequences if needed
-- (UUIDs don't use sequences, but just in case)

-- Log the cleanup (skip logging since admin_actions table requires admin_id)
-- INSERT INTO public.admin_actions would fail without an admin user