-- 为成员表添加状态字段，支持逻辑删除
-- 执行时间：2026-03-11

-- 1. 添加 status 字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'status'
  ) THEN
    ALTER TABLE members ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted'));
    COMMENT ON COLUMN members.status IS '成员状态：active=活跃, deleted=已删除（逻辑删除）';
  END IF;
END $$;

-- 2. 为现有成员设置默认状态
UPDATE members
SET status = 'active'
WHERE status IS NULL;

-- 3. 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);

-- 4. 创建视图：只显示活跃成员（可选）
CREATE OR REPLACE VIEW active_members AS
SELECT id, name, role, email
FROM members
WHERE status = 'active';

COMMENT ON VIEW active_members IS '活跃成员视图，自动过滤已删除成员';
