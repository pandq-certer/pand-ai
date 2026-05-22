-- 为自定义邮箱添加禁用字段
ALTER TABLE custom_emails ADD COLUMN IF NOT EXISTS disabled BOOLEAN DEFAULT false;
