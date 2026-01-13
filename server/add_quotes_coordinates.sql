-- Add longitude and latitude fields to quotes table for precise location tracking
-- This will enhance the location-based quote filtering system

ALTER TABLE quotes 
ADD COLUMN longitude DECIMAL(10, 8) DEFAULT NULL COMMENT 'Longitude coordinate for quote location',
ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL COMMENT 'Latitude coordinate for quote location';

-- Add index for better performance on location-based queries
CREATE INDEX idx_quotes_coordinates ON quotes(latitude, longitude);

-- Add a comment to document the coordinate system
ALTER TABLE quotes COMMENT = 'Quotes table with location coordinates using WGS84 coordinate system (GPS coordinates)';