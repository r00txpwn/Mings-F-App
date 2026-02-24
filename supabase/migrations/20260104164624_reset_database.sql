/*
  # Reset Database

  1. Actions
    - Drop all existing tables and their dependencies
    - This will remove:
      - transactions table
      - sales_channels table
      - user_preferences table
      - master_categories table
      - categories table
      - All RLS policies
      - All foreign key constraints
  
  2. Notes
    - Using CASCADE to automatically drop dependent objects
    - This prepares the database for fresh migrations
*/

DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS sales_channels CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS master_categories CASCADE;
