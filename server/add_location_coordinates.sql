-- Add longitude and latitude fields to users table for precise location tracking
-- This will enhance the location-based quote filtering system

ALTER TABLE users 
ADD COLUMN longitude DECIMAL(10, 8) DEFAULT NULL COMMENT 'Longitude coordinate for precise location',
ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL COMMENT 'Latitude coordinate for precise location';

-- Add index for better performance on location-based queries
CREATE INDEX idx_users_coordinates ON users(latitude, longitude);

-- Add a comment to document the coordinate system
ALTER TABLE users COMMENT = 'Users table with location coordinates using WGS84 coordinate system (GPS coordinates)';