------------------------------------------------------------------------------------------------
-- Categories for Products
-- can be changed to an enum 
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	categories (
		category_id SERIAL PRIMARY KEY,
		category_name VARCHAR(25) NOT NULL UNIQUE,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

------------------------------------------------------------------------------------------------
-- Products for the system
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	products (
		product_id SERIAL PRIMARY KEY,
		category_id INTEGER NOT NULL,
		product_name VARCHAR(25) NOT NULL UNIQUE,
		product_description VARCHAR(500) NOT NULL DEFAULT '', -- i think it should have a description
		product_price DECIMAL(10, 2) NOT NULL,
		product_slug VARCHAR(255) NOT NULL UNIQUE,
		image_path VARCHAR(255) UNIQUE DEFAULT '', -- cant have the same image
		banner_path VARCHAR(255) NOT NULL DEFAULT '',
		inventory INTEGER NOT NULL DEFAULT 0, -- renamed from stock
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (category_id) REFERENCES categories (category_id) ON DELETE CASCADE
	);

------------------------------------------------------------------------------------------------
-- Keywords for the product 
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	keywords (
		keyword_id SERIAL PRIMARY KEY,
		keyword VARCHAR(25) NOT NULL,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

------------------------------------------------------------------------------------------------
-- Keywords for the product (Many to Many relationship)
-- many products can have the same keywords?
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	product_keywords (
		product_keyword_id SERIAL PRIMARY KEY,
		product_id INTEGER NOT NULL,
		keyword_id INTEGER NOT NULL,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
		FOREIGN KEY (keyword_id) REFERENCES keywords (keyword_id) ON DELETE CASCADE
	);

------------------------------------------------------------------------------------------------
-- Roles for users
-- can be changed to an enum
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	roles (
		role_id SERIAL PRIMARY KEY,
		role_name VARCHAR(25) NOT NULL UNIQUE,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

------------------------------------------------------------------------------------------------
-- Restrictions for users
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	restrictions (
		restriction_id SERIAL PRIMARY KEY,
		restriction_name VARCHAR(50) NOT NULL UNIQUE,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

------------------------------------------------------------------------------------------------
-- Users for the system
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	users (
		user_id SERIAL PRIMARY KEY,
		role_id INTEGER NOT NULL,
		restriction_id INTEGER NOT NULL,
		username VARCHAR(25) NOT NULL UNIQUE,
		password_hash VARCHAR(255) NOT NULL,
		user_email VARCHAR(255) NOT NULL,
		profile_picture_path VARCHAR(255),
		banner_path VARCHAR(255),
		credit DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
		channel_id VARCHAR(255) UNIQUE,
		first_alert BOOLEAN DEFAULT FALSE,
		activation_token VARCHAR(255) UNIQUE, -- i think you should have tokens as unique
		token VARCHAR(255) UNIQUE,
		reset_token VARCHAR(255) UNIQUE,
		time_zone VARCHAR(255) NOT NULL DEFAULT 'current_timezone', -- i don't think this is necessary
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (role_id) REFERENCES roles (role_id) ON DELETE CASCADE,
		FOREIGN KEY (restriction_id) REFERENCES restrictions (restriction_id) ON DELETE CASCADE
	);

------------------------------------------------------------------------------------------------
-- User Sessions
-- instead of deleting the cart, have a table for logging purposes plus if a user signs out and signs in back their carted items will be saved
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	user_sessions (
		session_id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL,
		active BOOLEAN NOT NULL DEFAULT TRUE,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
	);

------------------------------------------------------------------------------------------------
-- Cart for the user session
-- a user must have a cart 
-- can be disabled from the session_ID in the session table
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	user_cart (
		cart_id SERIAL PRIMARY KEY,
		session_id INTEGER NOT NULL,
		product_id INTEGER NOT NULL,
		quantity INTEGER NOT NULL DEFAULT 0,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (session_id) REFERENCES user_sessions (session_id) ON DELETE CASCADE,
		FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
	);

------------------------------------------------------------------------------------------------
-- Order Status 
-- can be changed to enum
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	order_status (
		status_id SERIAL PRIMARY KEY,
		status_name VARCHAR(25) NOT NULL,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

------------------------------------------------------------------------------------------------
-- Promos for the orders
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	promos (
		promo_id SERIAL PRIMARY KEY,
		promo_code VARCHAR(255) NOT NULL UNIQUE,
		promo_name VARCHAR(50) UNIQUE,
		promo_description VARCHAR(500),
		discount_value NUMERIC NOT NULL,
		promo_start_date TIMESTAMP NOT NULL,
		promo_end_date TIMESTAMP NOT NULL,
		is_active BOOLEAN NOT NULL DEFAULT TRUE,
		created_by INTEGER NOT NULL,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (created_by) REFERENCES users (user_id) ON DELETE CASCADE
	);

------------------------------------------------------------------------------------------------
-- Orders for the user session
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	orders (
		order_id SERIAL PRIMARY KEY,
		order_code VARCHAR(255) NOT NULL UNIQUE,
		session_id INTEGER NOT NULL,
		overrode_by INTEGER NOT NULL,
		order_date TIMESTAMP NOT NULL,
		order_total DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
		order_final_total DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
		promo_id INTEGER NOT NULL,
		order_status_id INTEGER NOT NULL,
		delay_time INTEGER NOT NULL DEFAULT 0,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (session_id) REFERENCES user_sessions (session_id) ON DELETE CASCADE,
		FOREIGN KEY (overrode_by) REFERENCES users (user_id) ON DELETE CASCADE,
		FOREIGN KEY (promo_id) REFERENCES promos (promo_id) ON DELETE CASCADE,
		FOREIGN KEY (order_status_id) REFERENCES order_status (status_id) ON DELETE CASCADE
	);

------------------------------------------------------------------------------------------------
-- Ratings for the reviews
-- can be changed to enum
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	ratings (
		rating_id SERIAL PRIMARY KEY,
		rating_name VARCHAR(25) NOT NULL,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

------------------------------------------------------------------------------------------------
-- Reviews for the products
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	reviews (
		review_id SERIAL PRIMARY KEY,
		product_id INTEGER NOT NULL,
		user_id INTEGER NOT NULL,
		rating_id INTEGER NOT NULL,
		review_title VARCHAR(100) NOT NULL,
		review_text VARCHAR(500) NOT NULL,
		is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
		FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
		FOREIGN KEY (rating_id) REFERENCES ratings (rating_id) ON DELETE CASCADE
	);

------------------------------------------------------------------------------------------------
-- Feedback from the users
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	feedback (
		feedback_id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL,
		feedback_title VARCHAR(100) NOT NULL,
		feedback_text VARCHAR(500) NOT NULL,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
	);

------------------------------------------------------------------------------------------------
-- Messages for the users
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	messages (
		message_id SERIAL PRIMARY KEY,
		sender_user_id INTEGER NOT NULL,
		receiver_user_id INTEGER NOT NULL,
		message_title VARCHAR(100) NOT NULL,
		message_text VARCHAR(500) NOT NULL,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (sender_user_id) REFERENCES users (user_id) ON DELETE CASCADE,
		FOREIGN KEY (receiver_user_id) REFERENCES users (user_id) ON DELETE CASCADE
	);

------------------------------------------------------------------------------------------------
-- Product Research Table
-- update at intervals with the interaction log, might not be needed since querying can also be done
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	product_research (
		product_research_id SERIAL PRIMARY KEY,
		product_id INTEGER NOT NULL,
		VIEWS INTEGER NOT NULL DEFAULT 0,
		carted INTEGER NOT NULL DEFAULT 0,
		unCarted INTEGER NOT NULL DEFAULT 0,
		purchased INTEGER NOT NULL DEFAULT 0,
		reviews INTEGER NOT NULL DEFAULT 0,
		shared INTEGER NOT NULL DEFAULT 0,
		wishlist INTEGER NOT NULL DEFAULT 0,
		collected INTEGER NOT NULL DEFAULT 0,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
	);

------------------------------------------------------------------------------------------------
-- Interaction Types 
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	interaction_types (
		interaction_type_id SERIAL PRIMARY KEY,
		interaction_type_name VARCHAR(25) NOT NULL UNIQUE,
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

------------------------------------------------------------------------------------------------
-- Interaction Logs
------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS
	interaction_logs (
		interaction_log_id SERIAL PRIMARY KEY,
		product_id INTEGER NOT NULL,
		user_id INTEGER NOT NULL,
		interaction_type_id INTEGER NOT NULL,
		interaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
		FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
		FOREIGN KEY (interaction_type_id) REFERENCES interaction_types (interaction_type_id) ON DELETE CASCADE
	);

-- Link to diagramDb
-- https://dbdiagram.io/d/665f9687b65d933879838cc2