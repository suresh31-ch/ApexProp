import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.resolve(__dirname, '../../supabase/migrations');

export function getMigrationSql(): string {
  try {
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
      if (files.length > 0) {
        return files.map(f => fs.readFileSync(path.join(migrationsDir, f), 'utf-8')).join('\n\n-- -----------------------------------------------------\n\n');
      }
    }
  } catch (err) {
    console.warn('[Schema] Failed to read migrations from disk:', err);
  }
  return FALLBACK_SQL;
}

export const SUPABASE_TABLES = [
  'profiles',
  'properties',
  'inspections',
  'inspection_images',
  'observations',
  'investigations',
  'risk_assessments',
  'repair_recommendations',
  'repair_plans',
  'repair_options',
  'repair_cost_estimates',
  'repair_estimate_line_items',
  'repair_rate_catalog',
  'repair_approvals',
  'work_orders',
  'work_order_updates',
  'contractors',
  'work_order_status_history',
  'work_order_change_requests',
  'work_order_notifications',
  'reports',
  'audit_logs',
  'human_reviews'
] as const;

export const PRIVATE_STORAGE_BUCKET = 'apexprop-inspections';

const FALLBACK_SQL = `-- ApexProp AI PostgreSQL / Supabase Enterprise Schema
-- Version: 1.0.0
-- Target: PostgreSQL 15+ / Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- (See full idempotent schema in /supabase/migrations/20261103000000_apexprop_schema.sql)
`;

export const POSTGRES_MIGRATION_SQL = getMigrationSql();
