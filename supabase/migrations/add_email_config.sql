-- 创建邮件配置表
-- 在 Supabase 的 SQL Editor 中执行此脚本

-- 1. 创建邮件配置表
CREATE TABLE IF NOT EXISTS email_configs (
    id TEXT PRIMARY KEY DEFAULT 'default',
    enabled BOOLEAN NOT NULL DEFAULT false,
    schedule_time TEXT NOT NULL DEFAULT '09:00',
    last_sent TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. 创建自定义邮箱表
CREATE TABLE IF NOT EXISTS custom_emails (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(email)
);

-- 3. 创建邮件收件人关联表
CREATE TABLE IF NOT EXISTS email_recipients (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(member_id)
);

-- 4. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_custom_emails_email ON custom_emails(email);
CREATE INDEX IF NOT EXISTS idx_email_recipients_member_id ON email_recipients(member_id);

-- 5. 启用 Row Level Security
ALTER TABLE email_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_recipients ENABLE ROW LEVEL SECURITY;

-- 6. 创建 RLS 策略 (开发阶段允许所有操作)
-- 邮件配置表策略
CREATE POLICY "Enable all access for email_configs" ON email_configs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 自定义邮箱表策略
CREATE POLICY "Enable all access for custom_emails" ON custom_emails
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 邮件收件人表策略
CREATE POLICY "Enable all access for email_recipients" ON email_recipients
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 7. 插入默认邮件配置
INSERT INTO email_configs (id, enabled, schedule_time)
VALUES ('default', false, '09:00')
ON CONFLICT (id) DO NOTHING;

-- 8. 创建更新时间戳触发器（可选）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_configs_updated_at
    BEFORE UPDATE ON email_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
