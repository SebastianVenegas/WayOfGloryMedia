-- Add signature_url field to orders table
ALTER TABLE orders
ADD COLUMN signature_url TEXT; 