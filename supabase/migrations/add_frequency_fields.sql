-- 添加频率字段到邮件配置表
-- 在 Supabase 的 SQL Editor 中执行此脚本

-- 添加新字段到已存在的 email_configs 表
ALTER TABLE email_configs
  ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS schedule_day_of_week INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS schedule_day_of_month INTEGER DEFAULT 1;

-- 更新现有记录，设置默认值
UPDATE email_configs
SET frequency = 'weekly',
    schedule_day_of_week = 5,
    schedule_day_of_month = 1
WHERE frequency IS NULL;

COMMENT ON COLUMN email_configs.frequency IS '发送频率: daily, weekly, monthly';
COMMENT ON COLUMN email_configs.schedule_day_of_week IS '每周发送时的星期几 (0=周日, 1=周一, ..., 6=周六)';
COMMENT ON COLUMN email_configs.schedule_day_of_month IS '每月发送时的日期 (1-31)';
