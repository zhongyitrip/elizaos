-- EOA Accounts Table
CREATE TABLE IF NOT EXISTS eoa_accounts (
    id SERIAL PRIMARY KEY,
    eoa_address TEXT UNIQUE NOT NULL,
    private_key TEXT NOT NULL,
    derivation_index INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    last_processed_at TIMESTAMP,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_eoa_status ON eoa_accounts(status);
CREATE INDEX IF NOT EXISTS idx_eoa_address ON eoa_accounts(eoa_address);
CREATE INDEX IF NOT EXISTS idx_derivation_index ON eoa_accounts(derivation_index);
CREATE INDEX IF NOT EXISTS idx_last_processed ON eoa_accounts(last_processed_at);

-- Task Logs Table (optional, for tracking)
CREATE TABLE IF NOT EXISTS task_logs (
    id SERIAL PRIMARY KEY,
    eoa_address TEXT NOT NULL,
    task_type TEXT NOT NULL,
    status TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_eoa ON task_logs(eoa_address);
CREATE INDEX IF NOT EXISTS idx_task_created ON task_logs(created_at);

-- Batch Processing Status Table
CREATE TABLE IF NOT EXISTS batch_status (
    id SERIAL PRIMARY KEY,
    batch_number INTEGER UNIQUE NOT NULL,
    start_eoa_index INTEGER NOT NULL,
    end_eoa_index INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batch_status ON batch_status(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for eoa_accounts
DROP TRIGGER IF EXISTS update_eoa_accounts_updated_at ON eoa_accounts;
CREATE TRIGGER update_eoa_accounts_updated_at
    BEFORE UPDATE ON eoa_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View for monitoring progress
CREATE OR REPLACE VIEW eoa_progress AS
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM eoa_accounts), 2) as percentage
FROM eoa_accounts
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'completed' THEN 1
        WHEN 'processing' THEN 2
        WHEN 'pending' THEN 3
        WHEN 'failed' THEN 4
    END;

-- Comments
COMMENT ON TABLE eoa_accounts IS '30,000 EOA addresses for airdrop hunting';
COMMENT ON COLUMN eoa_accounts.eoa_address IS 'Ethereum EOA address';
COMMENT ON COLUMN eoa_accounts.private_key IS 'Encrypted private key';
COMMENT ON COLUMN eoa_accounts.derivation_index IS 'HD wallet derivation index (m/44''/60''/0''/0/index)';
COMMENT ON COLUMN eoa_accounts.status IS 'Processing status: pending, processing, completed, failed';
