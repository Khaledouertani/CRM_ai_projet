-- ============================================================
-- init_db.sql
-- Database initialization for CRM AI Project
-- Run this script in phpMyAdmin or MySQL CLI
-- ============================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS pfe_crm_ia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pfe_crm_ia;

-- ============================================================
-- Table: agents
-- Stores agent/user information
-- ============================================================
CREATE TABLE IF NOT EXISTS agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    role ENUM('admin', 'agent') DEFAULT 'agent',
    team_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- Table: calls
-- Stores analyzed call data
-- ============================================================
CREATE TABLE IF NOT EXISTS calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id VARCHAR(50) NOT NULL,
    agent_name VARCHAR(100),
    audio_file VARCHAR(255),

    -- Transcription
    transcription TEXT,
    labeled_transcript TEXT,
    agent_text TEXT,
    client_text TEXT,

    -- Speaker analysis
    diarization_method VARCHAR(20) DEFAULT 'none',
    agent_talk_ratio FLOAT DEFAULT 0,
    client_talk_ratio FLOAT DEFAULT 0,
    agent_seconds FLOAT DEFAULT 0,
    client_seconds FLOAT DEFAULT 0,

    -- Sentiment & Score
    sentiment VARCHAR(20),
    sentiment_score FLOAT DEFAULT 0.5,
    score_percentage FLOAT DEFAULT 0,

    -- Performance
    performance VARCHAR(50),
    summary TEXT,
    keywords JSON,

    -- Call details
    call_type VARCHAR(50),
    problem VARCHAR(200),
    postal_code VARCHAR(10),
    customer_intent VARCHAR(100),

    -- Agent evaluation
    script_respected TINYINT(1) DEFAULT 0,
    objections_handled TINYINT(1) DEFAULT 0,
    agent_politeness INT DEFAULT 5,

    -- Scores
    score_ecoute INT DEFAULT 0,
    score_persuasion INT DEFAULT 0,
    score_empathie INT DEFAULT 0,
    score_argumentation INT DEFAULT 0,
    score_refus INT DEFAULT 0,
    score_vente INT DEFAULT 0,

    -- Next steps
    next_steps TEXT,
    appointment_date VARCHAR(100),
    appointment_confidence INT DEFAULT 0,

    -- Inactivity
    inactivity_detected TINYINT(1) DEFAULT 0,
    inactivity_duration FLOAT DEFAULT 0,

    -- Refusal analysis
    refusal_reason VARCHAR(50) DEFAULT '',
    qualification_detected VARCHAR(100) DEFAULT '',
    qualification_match TINYINT(1) DEFAULT 1,
    coherence_score INT DEFAULT 100,

    -- Timestamps
    call_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Direct call fields
    besoin VARCHAR(100) DEFAULT '',
    budget VARCHAR(50) DEFAULT '',
    interet VARCHAR(50) DEFAULT '',
    customer_phone VARCHAR(20) DEFAULT '',
    customer_email VARCHAR(100) DEFAULT '',
    customer_company VARCHAR(100) DEFAULT '',

    INDEX idx_agent_name (agent_name),
    INDEX idx_sentiment (sentiment),
    INDEX idx_call_date (call_date),
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE SET NULL
);

-- ============================================================
-- Table: followups
-- Tracking post-call follow-ups
-- ============================================================
CREATE TABLE IF NOT EXISTS followups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    call_id INT,
    agent_name VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_name VARCHAR(100),
    appointment_date DATETIME,
    appointment_confidence INT DEFAULT 0,
    status ENUM('a_relancer', 'relance_en_cours', 'relance', 'converti', 'injoignable', 'refus_final') DEFAULT 'a_relancer',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    next_relance_date DATETIME,
    relance_count INT DEFAULT 0,
    FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE
);

-- ============================================================
-- Table: suppliers (from CRM-ui-template)
-- Lead source management
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country ENUM('France', 'Belgique', 'Suisse') DEFAULT 'France',
    lead_type ENUM('B2B', 'B2C') DEFAULT 'B2B',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Table: source_files (from CRM-ui-template)
-- Imported CSV/Excel files
-- ============================================================
CREATE TABLE IF NOT EXISTS source_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    contact_count INT DEFAULT 0,
    file_size_label VARCHAR(50),
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    format ENUM('csv', 'xlsx') DEFAULT 'csv',
    status ENUM('original', 'injected', 'processed', 'recycled') DEFAULT 'original',
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- ============================================================
-- Table: lead_folders (from CRM-ui-template)
-- Organized lead folders
-- ============================================================
CREATE TABLE IF NOT EXISTS lead_folders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- ============================================================
-- Table: campaigns (from CRM-ui-template)
-- Marketing campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status ENUM('active', 'en pause', 'terminée') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    qualification_ids JSON,
    distribution_mode ENUM('round-robin', 'random', 'performance') DEFAULT 'round-robin',
    quota_per_agent INT DEFAULT 10,
    quota_unit ENUM('per-day', 'per-session', 'total') DEFAULT 'per-day',
    assigned_agent_ids JSON
);

-- ============================================================
-- Table: qualifications (from CRM-ui-template)
-- Lead qualification types
-- ============================================================
CREATE TABLE IF NOT EXISTS qualifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    color ENUM('green', 'amber', 'red', 'blue', 'gray') DEFAULT 'gray'
);

-- ============================================================
-- Insert default qualifications
-- ============================================================
INSERT IGNORE INTO qualifications (label, color) VALUES
    ('Hot - Prêt à acheter', 'green'),
    ('Warm - Intéressé', 'amber'),
    ('Cold - À qualifier', 'red'),
    ('Not Interested', 'gray');

-- ============================================================
-- Insert sample agents (for demo)
-- ============================================================
INSERT IGNORE INTO agents (agent_id, name, role) VALUES
    ('admin', 'Administrator', 'admin'),
    ('superviseur', 'Superviseur', 'admin'),
    ('ali', 'Ali Agent', 'agent'),
    ('sana', 'Sana Agent', 'agent'),
    ('omar', 'Omar Agent', 'agent'),
    ('mariam', 'Mariam Agent', 'agent'),
    ('youssef', 'Youssef Agent', 'agent');

-- ============================================================
-- Create indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_calls_agent ON calls(agent_name);
CREATE INDEX IF NOT EXISTS idx_calls_sentiment ON calls(sentiment);
CREATE INDEX IF NOT EXISTS idx_calls_date ON calls(call_date);
CREATE INDEX IF NOT EXISTS idx_followups_status ON followups(status);

-- ============================================================
-- Table: alert_rules
-- Stores configurable alert thresholds
-- ============================================================
CREATE TABLE IF NOT EXISTS alert_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_type ENUM('low_score', 'inactivity', 'conversion') NOT NULL,
    threshold_value INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notification_email VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default alert rules
INSERT IGNORE INTO alert_rules (rule_type, threshold_value, is_active, notification_email) VALUES
    ('low_score', 70, TRUE, 'admin@crm.local'),
    ('inactivity', 15, TRUE, 'admin@crm.local'),
    ('conversion', 40, TRUE, 'admin@crm.local');

-- ============================================================
-- Table: alert_history
-- Stores triggered alerts for history tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS alert_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_name VARCHAR(100),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'warning',
    message TEXT,
    threshold_value INT DEFAULT 0,
    actual_value FLOAT DEFAULT 0,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alert_history_agent ON alert_history(agent_name);
CREATE INDEX IF NOT EXISTS idx_alert_history_date ON alert_history(created_at);

-- ============================================================
-- Table: messages
-- Stores messages between admin and agents
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_date ON messages(created_at);

SELECT 'Database initialized successfully!' as status;