-- Add contact fields to orders table
ALTER TABLE orders
ADD COLUMN contact_on_site VARCHAR(255),
ADD COLUMN contact_on_site_phone VARCHAR(255); 