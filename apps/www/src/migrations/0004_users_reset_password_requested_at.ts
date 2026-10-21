import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

/**
 * Payload 3.90 tracks when a password reset was last requested on every
 * auth collection. Without this column the `users` table no longer
 * matches the schema Payload expects and every query on it fails with
 * `column users.reset_password_requested_at does not exist`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "reset_password_requested_at" timestamp(3) with time zone;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_requested_at";
  `);
}
