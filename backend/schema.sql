-- ====================================================================
-- FACTORI "LAUNCH YOUR MOBILE APP" - RELATIONAL DATABASE SCHEMA (SQL)
-- Target: PostgreSQL 14+ / SQLite 3
-- Connects to the per-retailer customer table as required in Assignment
-- ====================================================================

-- 1. Retailers Table (Core Factori Tenant Entity)
CREATE TABLE IF NOT EXISTS retailers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    storefront_url VARCHAR(500) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    owner_phone VARCHAR(32) NOT NULL,
    delivered_orders INT DEFAULT 0,
    settled_gmv_inr DECIMAL(12, 2) DEFAULT 0.00,
    is_unlocked BOOLEAN GENERATED ALWAYS AS (delivered_orders >= 500 OR settled_gmv_inr >= 250000.00) STORED,
    app_version VARCHAR(32) DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers Table (Existing per-retailer customer records)
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    retailer_id VARCHAR(64) NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(255),
    total_orders INT DEFAULT 0,
    total_spend_inr DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_retailer_customer_phone UNIQUE(retailer_id, phone)
);

-- 3. Retailer Branded Apps (1 unique app per store)
CREATE TABLE IF NOT EXISTS retailer_apps (
    id VARCHAR(64) PRIMARY KEY,
    retailer_id VARCHAR(64) UNIQUE NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
    app_name VARCHAR(60) NOT NULL,
    application_id VARCHAR(120) UNIQUE NOT NULL, -- e.g. com.factori.zolara.app (CANNOT BE CHANGED AFTER LAUNCH)
    current_version_name VARCHAR(32) DEFAULT '1.0.0',
    current_version_code INT DEFAULT 1,
    keystore_vault_path VARCHAR(500) NOT NULL,
    keystore_alias VARCHAR(64) DEFAULT 'factori',
    status VARCHAR(32) DEFAULT 'active', -- active, upgrading, suspended
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. App Devices (The "My mobile app" Customer Tracking Table)
-- Ties directly to customers(id) upon login via JavaScript Bridge
CREATE TABLE IF NOT EXISTS app_devices (
    id VARCHAR(64) PRIMARY KEY,
    retailer_id VARCHAR(64) NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
    phone VARCHAR(32) NOT NULL,
    platform VARCHAR(64) NOT NULL, -- e.g. 'Android 14 (Pixel 7)'
    fcm_token TEXT NOT NULL,
    installed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    logged_in_at TIMESTAMP WITH TIME ZONE,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'active', -- 'active', 'inactive', 'uninstalled'
    uninstalled_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_app_device UNIQUE(retailer_id, id)
);

-- 5. Push Notification Campaigns
CREATE TABLE IF NOT EXISTS push_campaigns (
    id VARCHAR(64) PRIMARY KEY,
    retailer_id VARCHAR(64) NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    body TEXT NOT NULL,
    target_url VARCHAR(500) NOT NULL,
    targeted_count INT DEFAULT 0,
    delivered_count INT DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Automated Builds Log
CREATE TABLE IF NOT EXISTS builds (
    id VARCHAR(64) PRIMARY KEY,
    retailer_id VARCHAR(64) REFERENCES retailers(id) ON DELETE CASCADE,
    retailer_name VARCHAR(100) NOT NULL,
    application_id VARCHAR(120) NOT NULL,
    storefront_url VARCHAR(500) NOT NULL,
    status VARCHAR(32) NOT NULL, -- 'pending', 'building', 'completed', 'failed'
    progress INT DEFAULT 0,
    message TEXT,
    error TEXT,
    apk_path VARCHAR(500),
    aab_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for high-performance multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_customers_retailer ON customers(retailer_id);
CREATE INDEX IF NOT EXISTS idx_app_devices_retailer ON app_devices(retailer_id);
CREATE INDEX IF NOT EXISTS idx_app_devices_status ON app_devices(status);
CREATE INDEX IF NOT EXISTS idx_push_campaigns_retailer ON push_campaigns(retailer_id);
CREATE INDEX IF NOT EXISTS idx_builds_retailer ON builds(retailer_id);

