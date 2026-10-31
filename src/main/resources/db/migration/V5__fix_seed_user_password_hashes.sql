-- V2 shipped a placeholder BCrypt string that does not verify against 'password123'.
-- Replace it for the three development seed accounts, only where the placeholder is still present
-- (databases whose hashes were already fixed by hand are left untouched).
UPDATE users
SET password_hash = '$2a$10$2Kxy42QLaYIOEwClmXhHJOc4QnaWvrruUJTTh8KNXvsH5GMMq24YS'
WHERE email IN ('admin@classsync.edu', 'aturing@classsync.edu', 'alovelace@classsync.edu')
  AND password_hash = '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiVjA7RMRp5e8VbZp0m5eLgLgQ16M3O';
