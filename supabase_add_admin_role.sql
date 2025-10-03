-- Add 'admin' to the user_role enum type if using Postgres enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
