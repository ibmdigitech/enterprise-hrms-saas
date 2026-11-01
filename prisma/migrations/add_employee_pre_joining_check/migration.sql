-- Add CHECK constraint to prevent PRE_JOINING employees from being ACTIVE
-- This enforces the provisional-entry contract at the database level (GAP-01)
-- Only blocks ACTIVE lifecycle with active status, not the creation of PRE_JOINING entries

ALTER TABLE "Employee" 
ADD CONSTRAINT "Employee_active_requires_employment_data" 
CHECK (NOT (lifecycle IN ('ACTIVE', 'CONFIRMED', 'PROBATION') AND "isActive" = true AND "currentStatus" = 'ACTIVE'));