-- Add issues column to furniture_images table
-- Run this SQL in your Supabase SQL editor

ALTER TABLE furniture_images 
ADD COLUMN IF NOT EXISTS issues JSONB;

-- The column will store issues as JSON array:
-- [
--   {
--     "id": "unique-id",
--     "issue": "Broken leg",
--     "description": "The front left leg is cracked and needs repair"
--   },
--   {
--     "id": "another-id",
--     "issue": "Scratched surface",
--     "description": "Multiple scratches on the top surface"
--   }
-- ]

-- After running this, the app will be able to save and retrieve issues for posts.

