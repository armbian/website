import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

/**
 * Move `flash_guides` off the hand-rolled `locale` select field and onto
 * Payload's native localization. After this migration:
 *
 *   flash_guides              (id, board_slug, created_at, updated_at)
 *   flash_guides_locales      (id, _parent_id, _locale, title, content)
 *   flash_guides_prerequisites(id, _parent_id, _locale, _order, item)
 *
 * Before, a single `board_slug` could exist as multiple rows (one per
 * locale), which is what caused admin edits in a non-English locale to
 * appear to "overwrite" the English original. Now each board has one
 * parent row and the per-locale content lives in `_locales`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1. Global locales enum used by every `_locale` column Payload creates.
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."_locales" AS ENUM(
        'en','it','de','fr','es','zh','pt','ru','ja','ko','pl','nl','tr','uk','hr','sl','sv'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);

  // 2. New locales table for the top-level localized fields (title, content).
  await db.execute(sql`
    CREATE TABLE "flash_guides_locales" (
      "id" serial PRIMARY KEY NOT NULL,
      "_parent_id" integer NOT NULL,
      "_locale" "_locales" NOT NULL,
      "title" varchar NOT NULL,
      "content" jsonb NOT NULL
    );
    CREATE UNIQUE INDEX "flash_guides_locales__locale_parent_id_unique"
      ON "flash_guides_locales" USING btree ("_locale", "_parent_id");
  `);

  // 3. Localized arrays get `_locale` added directly to the array table.
  await db.execute(sql`
    ALTER TABLE "flash_guides_prerequisites" ADD COLUMN "_locale" "_locales";
  `);

  // 4. Stamp existing prerequisites with the locale inherited from their
  //    current parent row so Payload can tell them apart after step 7.
  await db.execute(sql`
    UPDATE "flash_guides_prerequisites" fp
    SET "_locale" = fg."locale"::text::"_locales"
    FROM "flash_guides" fg
    WHERE fp."_parent_id" = fg."id";
  `);

  // 5. Populate the new locales table — one row per pre-existing
  //    (board_slug, locale) pair. The `_parent_id` is the lowest id for
  //    each board_slug, so if any duplicates existed they all collapse
  //    onto a single parent row.
  await db.execute(sql`
    INSERT INTO "flash_guides_locales" ("_parent_id", "_locale", "title", "content")
    SELECT
      (SELECT MIN(id) FROM "flash_guides" WHERE board_slug = fg.board_slug),
      fg."locale"::text::"_locales",
      fg."title",
      fg."content"
    FROM "flash_guides" fg;
  `);

  // 6. Re-parent prerequisites from any secondary rows to the primary row
  //    picked in step 5.
  await db.execute(sql`
    UPDATE "flash_guides_prerequisites" fp
    SET "_parent_id" = primary_id
    FROM (
      SELECT fg.id, (SELECT MIN(id) FROM "flash_guides" WHERE board_slug = fg.board_slug) AS primary_id
      FROM "flash_guides" fg
    ) AS mapping
    WHERE fp."_parent_id" = mapping.id AND mapping.primary_id <> mapping.id;
  `);

  // 7. Drop every non-primary flash_guides row. The data is already in
  //    flash_guides_locales; the parent-id collisions have been resolved.
  await db.execute(sql`
    DELETE FROM "flash_guides"
    WHERE id NOT IN (SELECT MIN(id) FROM "flash_guides" GROUP BY board_slug);
  `);

  // 8. FK + constraints on the new shape.
  await db.execute(sql`
    ALTER TABLE "flash_guides_locales"
      ADD CONSTRAINT "flash_guides_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."flash_guides"("id")
      ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "flash_guides_prerequisites" ALTER COLUMN "_locale" SET NOT NULL;
    CREATE INDEX "flash_guides_prerequisites__locale_idx"
      ON "flash_guides_prerequisites" USING btree ("_locale");
  `);

  // 9. Drop the old locale/title/content columns and their enum type. The
  //    unique-on-board_slug index lives on the parent table now.
  await db.execute(sql`
    ALTER TABLE "flash_guides"
      DROP COLUMN "locale",
      DROP COLUMN "title",
      DROP COLUMN "content";
    DROP TYPE "public"."enum_flash_guides_locale";
    DROP INDEX IF EXISTS "flash_guides_board_slug_idx";
    CREATE UNIQUE INDEX "flash_guides_board_slug_idx"
      ON "flash_guides" USING btree ("board_slug");
  `);
}

/**
 * Down path is a best-effort skeleton — a true rollback of a data-shape
 * change like this needs a DB restore (`./manage.sh db:restore <file>`).
 * This just gets the schema back to a compatible shape; any locale other
 * than the first one retrieved per board_slug is lost.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_flash_guides_locale" AS ENUM(
        'en','it','de','fr','es','zh','pt','ru','ja','ko','pl','nl','tr','uk','hr','sl','sv'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    ALTER TABLE "flash_guides"
      ADD COLUMN "locale" "enum_flash_guides_locale" DEFAULT 'en' NOT NULL,
      ADD COLUMN "title" varchar,
      ADD COLUMN "content" jsonb;

    UPDATE "flash_guides" fg
    SET "locale" = fgl."_locale"::text::"enum_flash_guides_locale",
        "title" = fgl."title",
        "content" = fgl."content"
    FROM (
      SELECT DISTINCT ON (_parent_id) _parent_id, _locale, title, content
      FROM "flash_guides_locales"
      ORDER BY _parent_id, _locale
    ) fgl
    WHERE fg.id = fgl._parent_id;

    ALTER TABLE "flash_guides" ALTER COLUMN "title" SET NOT NULL;
    ALTER TABLE "flash_guides" ALTER COLUMN "content" SET NOT NULL;

    DROP TABLE "flash_guides_locales";
    ALTER TABLE "flash_guides_prerequisites" DROP COLUMN "_locale";

    DROP INDEX IF EXISTS "flash_guides_board_slug_idx";
    CREATE INDEX "flash_guides_board_slug_idx"
      ON "flash_guides" USING btree ("board_slug");
  `);
}
