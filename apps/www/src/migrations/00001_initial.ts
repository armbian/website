import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'maintainer');
  CREATE TYPE "public"."enum_flash_guides_locale" AS ENUM('en', 'it', 'de', 'fr', 'es', 'zh', 'pt', 'ru', 'ja', 'ko', 'pl', 'nl', 'tr', 'uk', 'hr', 'sl', 'sv');
  CREATE TYPE "public"."enum_announcements_type" AS ENUM('info', 'warning', 'release', 'event');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_changelogs_status" AS ENUM('draft', 'published');
  CREATE TABLE "users_assigned_boards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"board_slug" varchar
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"oidc_sub" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "flash_guides_prerequisites" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "flash_guides" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"board_slug" varchar NOT NULL,
  	"locale" "enum_flash_guides_locale" DEFAULT 'en' NOT NULL,
  	"title" varchar NOT NULL,
  	"content" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "announcements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"content" jsonb NOT NULL,
  	"type" "enum_announcements_type" DEFAULT 'info' NOT NULL,
  	"active" boolean DEFAULT true,
  	"pinned" boolean DEFAULT false,
  	"publish_date" timestamp(3) with time zone NOT NULL,
  	"expires_at" timestamp(3) with time zone,
  	"link" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"content" jsonb NOT NULL,
  	"status" "enum_pages_status" DEFAULT 'draft' NOT NULL,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "changelogs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version" varchar NOT NULL,
  	"release_date" timestamp(3) with time zone NOT NULL,
  	"status" "enum_changelogs_status" DEFAULT 'draft' NOT NULL,
  	"summary" varchar NOT NULL,
  	"content" jsonb NOT NULL,
  	"major" boolean DEFAULT false,
  	"download_url" varchar,
  	"github_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"flash_guides_id" integer,
  	"announcements_id" integer,
  	"pages_id" integer,
  	"changelogs_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "company_config" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"company_name" varchar DEFAULT 'Armbian d.o.o.',
  	"email" varchar DEFAULT 'info@armbian.com',
  	"street" varchar DEFAULT 'Reboljeva ulica 5',
  	"city" varchar DEFAULT '1000 Ljubljana',
  	"country" varchar DEFAULT 'Slovenia',
  	"vat_id" varchar DEFAULT 'SI38201194',
  	"iban" varchar DEFAULT 'SI56 0400 0028 2106 011',
  	"swift" varchar DEFAULT 'KBMASI2X',
  	"office_hours_day" varchar DEFAULT 'Every Wednesday',
  	"calendly_office_hours" varchar,
  	"calendly_consultation" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_assigned_boards" ADD CONSTRAINT "users_assigned_boards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "flash_guides_prerequisites" ADD CONSTRAINT "flash_guides_prerequisites_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."flash_guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_flash_guides_fk" FOREIGN KEY ("flash_guides_id") REFERENCES "public"."flash_guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_announcements_fk" FOREIGN KEY ("announcements_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_changelogs_fk" FOREIGN KEY ("changelogs_id") REFERENCES "public"."changelogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_assigned_boards_order_idx" ON "users_assigned_boards" USING btree ("_order");
  CREATE INDEX "users_assigned_boards_parent_id_idx" ON "users_assigned_boards" USING btree ("_parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_oidc_sub_idx" ON "users" USING btree ("oidc_sub");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "flash_guides_prerequisites_order_idx" ON "flash_guides_prerequisites" USING btree ("_order");
  CREATE INDEX "flash_guides_prerequisites_parent_id_idx" ON "flash_guides_prerequisites" USING btree ("_parent_id");
  CREATE INDEX "flash_guides_board_slug_idx" ON "flash_guides" USING btree ("board_slug");
  CREATE INDEX "flash_guides_updated_at_idx" ON "flash_guides" USING btree ("updated_at");
  CREATE INDEX "flash_guides_created_at_idx" ON "flash_guides" USING btree ("created_at");
  CREATE INDEX "announcements_updated_at_idx" ON "announcements" USING btree ("updated_at");
  CREATE INDEX "announcements_created_at_idx" ON "announcements" USING btree ("created_at");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "changelogs_updated_at_idx" ON "changelogs" USING btree ("updated_at");
  CREATE INDEX "changelogs_created_at_idx" ON "changelogs" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_flash_guides_id_idx" ON "payload_locked_documents_rels" USING btree ("flash_guides_id");
  CREATE INDEX "payload_locked_documents_rels_announcements_id_idx" ON "payload_locked_documents_rels" USING btree ("announcements_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_changelogs_id_idx" ON "payload_locked_documents_rels" USING btree ("changelogs_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");

  INSERT INTO "company_config" ("company_name", "email", "street", "city", "country", "vat_id", "iban", "swift", "office_hours_day", "calendly_office_hours", "calendly_consultation", "updated_at", "created_at")
  VALUES ('Armbian d.o.o.', 'info@armbian.com', 'Reboljeva ulica 5', '1000 Ljubljana', 'Slovenia', 'SI38201194', 'SI56 0400 0028 2106 011', 'KBMASI2X', 'Every Wednesday', 'https://calendly.com/armbian/office-hours', 'https://calendly.com/armbian/consultation', NOW(), NOW());`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_assigned_boards" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "flash_guides_prerequisites" CASCADE;
  DROP TABLE "flash_guides" CASCADE;
  DROP TABLE "announcements" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "changelogs" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "company_config" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_flash_guides_locale";
  DROP TYPE "public"."enum_announcements_type";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum_changelogs_status";`)
}
