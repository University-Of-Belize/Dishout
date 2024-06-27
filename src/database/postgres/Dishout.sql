---------------------------------------------------------------------------------------------------------------------
-- Ratings for the reviews | Change to table if needed
---------------------------------------------------------------------------------------------------------------------
CREATE TYPE "ratings" AS ENUM (
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	'10'
);

---------------------------------------------------------------------------------------------------------------------
-- Session Categories Table | This can be an enum if values won't change
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "category_carts" (
	"c_category_id" SERIAL PRIMARY KEY,
	"category" VARCHAR (25) NOT NULL UNIQUE
);

CREATE INDEX "idx_category_carts_category" ON "category_carts" ("category");

---------------------------------------------------------------------------------------------------------------------
-- Message Categories Table | Holds the types of message e.g Feedback, announcements, private Messages etc.
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "category_messages" (
	"m_category_id" SERIAL PRIMARY KEY,
	"category" VARCHAR (25) NOT NULL UNIQUE
);

CREATE INDEX "idx_category_messages_category" ON "category_messages" ("category");

---------------------------------------------------------------------------------------------------------------------
-- Products Categories Table | HOlds the categories for the products
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "category_products" (
	"p_category_id" SERIAL PRIMARY KEY,
	"category" VARCHAR (50) NOT NULL UNIQUE,
	"string_id" VARCHAR (255) NOT NULL UNIQUE,
	"description" TEXT NULL
);

CREATE INDEX "idx_category_products_category" ON "category_products" ("category");

---------------------------------------------------------------------------------------------------------------------
-- Channels for the user | IDK 
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "channels" (
	"channel_id" SERIAL PRIMARY KEY,
	"channel" VARCHAR (255) NOT NULL UNIQUE
);

CREATE INDEX "idx_channels_channel" ON "channels" ("channel");

---------------------------------------------------------------------------------------------------------------------
-- Keywords for products | Like tags
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "keywords" (
	"keyword_id" SERIAL PRIMARY KEY,
	"keyword" varchar (50) NOT NULL UNIQUE
);

CREATE INDEX "idx_keywords_keyword" ON "keywords" ("keyword");

---------------------------------------------------------------------------------------------------------------------
-- Restrictions for the user | Might have to change this to INTEGER if specific number is needed
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "restrictions" (
	"restriction_id" SERIAL PRIMARY KEY,
	"restriction" VARCHAR (100) NOT NULL UNIQUE,
	"code" VARCHAR (10) NOT NULL UNIQUE
);

CREATE INDEX "idx_restrictions_restriction" ON "restrictions" ("restriction");

CREATE INDEX "idx_restrictions_code" ON "restrictions" ("code");

---------------------------------------------------------------------------------------------------------------------
-- roles for the user | staff, student, admin, vendor, etc.
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "roles" (
	"role_id" SERIAL PRIMARY KEY,
	"role" VARCHAR (25) NOT NULL UNIQUE
);

CREATE INDEX "idx_roles_role" ON "roles" ("role");

---------------------------------------------------------------------------------------------------------------------
-- Holds User Information
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "users" (
	"user_id" SERIAL PRIMARY KEY,
	"channel_id" INTEGER NOT NULL,
	"restriction_id" INTEGER NOT NULL,
	"role_id" INTEGER NOT NULL,
	"username" VARCHAR (50) NOT NULL UNIQUE,
	"email" VARCHAR (255) NOT NULL UNIQUE,
	"hash" VARCHAR (255) NOT NULL,
	"credit" DECIMAL (10, 2) NOT NULL DEFAULT 0.0,
	"first_alert" BOOLEAN NOT NULL DEFAULT 'false',
	"token" VARCHAR (255) NOT NULL UNIQUE,
	"token_activation" VARCHAR (255) NOT NULL UNIQUE,
	"token_reset " VARCHAR (255) NOT NULL UNIQUE,
	"path_image" VARCHAR (255) NULL,
	"path_banner" VARCHAR (255) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	"updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_users_username" ON "users" ("username");

CREATE INDEX "idx_users_email" ON "users" ("email");

CREATE INDEX "idx_users_hash" ON "users" ("hash");

ALTER TABLE
	"users"
ADD
	FOREIGN KEY ("role_id") REFERENCES "roles" ("role_id") ON DELETE CASCADE;

ALTER TABLE
	"users"
ADD
	FOREIGN KEY ("restriction_id") REFERENCES "restrictions" ("restriction_id") ON DELETE CASCADE;

ALTER TABLE
	"users"
ADD
	FOREIGN KEY ("channel_id") REFERENCES "channels" ("channel_id") ON DELETE CASCADE;

---------------------------------------------------------------------------------------------------------------------
-- Products | What the the vendors will be selling
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "products" (
	"product_id" SERIAL PRIMARY KEY,
	"vendor_id" INTEGER NOT NULL,
	"category_id" INTEGER NOT NULL,
	"name" VARCHAR (50) NOT NULL UNIQUE,
	"description" TEXT NULL,
	"price" DECIMAL (10, 2) NOT NULL DEFAULT 0.0,
	"slug" VARCHAR (255) NOT NULL UNIQUE,
	"stock" INTEGER NOT NULL DEFAULT 0,
	"path_image" VARCHAR (255) NULL,
	"path_banner" VARCHAR (255) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	"updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_products_name" ON "products" ("name");

CREATE INDEX "idx_products_slug" ON "products" ("slug");

ALTER TABLE
	"products"
ADD
	FOREIGN KEY ("vendor_id") REFERENCES "users" ("user_id") ON DELETE CASCADE;

ALTER TABLE
	"products"
ADD
	FOREIGN KEY ("category_id") REFERENCES "category_products" ("p_category_id") ON DELETE CASCADE;

---------------------------------------------------------------------------------------------------------------------
-- Products Keywords many to many tables
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "products_keywords" (
	"products_keywords_id" SERIAL PRIMARY KEY,
	"product_id" INTEGER NOT NULL,
	"keyword_id" INTEGER NOT NULL
);

ALTER TABLE
	"products_keywords"
ADD
	FOREIGN KEY ("product_id") REFERENCES "products" ("product_id");

ALTER TABLE
	"products_keywords"
ADD
	FOREIGN KEY ("keyword_id") REFERENCES "keywords" ("keyword_id");

---------------------------------------------------------------------------------------------------------------------
-- Carts tables | 
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "carts" (
	"cart_id" SERIAL PRIMARY KEY,
	"user_id" INTEGER NOT NULL,
	"category_id" INTEGER NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	"updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE
	"carts"
ADD
	FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");

ALTER TABLE
	"carts"
ADD
	FOREIGN KEY ("category_id") REFERENCES "category_carts" ("c_category_id");

---------------------------------------------------------------------------------------------------------------------
-- Carts and products Linking table | Many to many table to track which 
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "carts_products" (
	"carts_products_id" SERIAL PRIMARY KEY,
	"product_id" INTEGER NOT NULL,
	"cart_id" INTEGER NOT NULL,
	"quantity" INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE
	"carts_products"
ADD
	FOREIGN KEY ("product_id") REFERENCES "products" ("product_id");

ALTER TABLE
	"carts_products"
ADD
	FOREIGN KEY ("cart_id") REFERENCES "carts" ("cart_id");

---------------------------------------------------------------------------------------------------------------------
-- Messages Table | All types of messages either from people or from the server or from the staff or from the admins
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "messages" (
	"message_id" SERIAL PRIMARY KEY,
	"category_id" INTEGER NOT NULL,
	"sender_id" INTEGER NOT NULL,
	"receiver_id" INTEGER NOT NULL,
	"title" VARCHAR (100) NULL,
	"body" TEXT NOT NULL,
	"body_filtered" TEXT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	"updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE
	"messages"
ADD
	FOREIGN KEY ("category_id") REFERENCES "category_messages"("m_category_id");

ALTER TABLE
	"messages"
ADD
	FOREIGN KEY ("sender_id") REFERENCES "users" ("user_id");

ALTER TABLE
	"messages"
ADD
	FOREIGN KEY ("receiver_id") REFERENCES "users"("user_id");

---------------------------------------------------------------------------------------------------------------------
-- Reviews of products | wow so cool
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "reviews" (
	"review_id" SERIAL PRIMARY KEY,
	"product_id" INTEGER NOT NULL,
	"user_id" INTEGER NOT NULL,
	"title" VARCHAR (100) NOT NULL,
	"body" TEXT NOT NULL,
	"body_filtered" TEXT NOT NULL,
	"is_hidden" BOOLEAN NOT NULL DEFAULT 'false',
	"rating" ratings NOT NULL DEFAULT '1',
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	"updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE
	"reviews"
ADD
	FOREIGN KEY ("product_id") REFERENCES "products" ("product_id");

ALTER TABLE
	"reviews"
ADD
	FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");

---------------------------------------------------------------------------------------------------------------------
-- Promos for products by the vendor 
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "promos" (
	"promo_id" SERIAL PRIMARY KEY,
	"vendor_id" INTEGER NOT NULL,
	"code" VARCHAR (255) NOT NULL,
	"name" VARCHAR (100) NOT NULL,
	"description" TEXT NULL,
	"percent" DECIMAL (10, 2),
	"date_start" DATETIME NOT NULL,
	"date_end" DATETIME NOT NULL,
	"is_active" BOOLEAN DEFAULT 'false',
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	"updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_promos_code" ON "promos" ("code");

CREATE INDEX "idx_promos_name" ON "promos" ("name");

CREATE INDEX "idx_promos_percent" ON "promos" ("percent");

ALTER TABLE
	"promos"
ADD
	FOREIGN KEY ("vendor_id") REFERENCES "users" ("user_id");

---------------------------------------------------------------------------------------------------------------------
-- Payments for the vendors
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "vendor_payments" (
	"vendor_payment_id" SERIAL PRIMARY KEY,
	"vendor_id" INTEGER NOT NULL,
	"gross_payment" DECIMAL (10, 2) NOT NULL,
	"tax" DECIMAL (10, 2) NOT NULL DEFAULT 0.0,
	"net_payment" DECIMAL (10, 2) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	"updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE
	"vendor_payments"
ADD
	FOREIGN KEY ("vendor_id") REFERENCES "users" ("user_id");

---------------------------------------------------------------------------------------------------------------------
-- Orders Table
---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "orders" (
	"order_id" SERIAL PRIMARY KEY,
	"cart_id" INTEGER NOT NULL,
	"promo_id" INTEGER NULL,
	"code" VARCHAR (255) NOT NULL,
	"total_gross" DECIMAL (10, 2) NOT NULL DEFAULT 0.0,
	"discount" DECIMAL (10, 2) NOT NULL DEFAULT 0.0,
	"total_net" DECIMAL (10, 2) NOT NULL DEFAULT 0.0,
	"delay_time" INTEGER NOT NULL DEFAULT 0,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	"updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_orders_code" ON "orders" ("code");

ALTER TABLE
	"orders"
ADD
	FOREIGN KEY ("cart_id") REFERENCES "carts" ("cart_id");

ALTER TABLE
	"orders"
ADD
	FOREIGN KEY ("promo_id") REFERENCES "promos" ("promo_id");

---------------------------------------------------------------------------------------------------------------------
-- link to diagram | https://dbdiagram.io/d/Dishout-665f9687b65d933879838cc2
---------------------------------------------------------------------------------------------------------------------