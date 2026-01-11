-- 创建数据库表结构
-- 在 Supabase 的 SQL Editor 中执行此脚本

-- 1. 创建成员表
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. 创建项目表
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    project_status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. 创建分配表
CREATE TABLE IF NOT EXISTS allocations (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    week_date TEXT NOT NULL,
    value DECIMAL(3,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(member_id, project_id, week_date)
);

-- 4. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_allocations_member_id ON allocations(member_id);
CREATE INDEX IF NOT EXISTS idx_allocations_project_id ON allocations(project_id);
CREATE INDEX IF NOT EXISTS idx_allocations_week_date ON allocations(week_date);

-- 5. 启用 Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;

-- 6. 创建 RLS 策略 (开发阶段允许所有操作，生产环境需根据需求调整)
-- 成员表策略
CREATE POLICY "Enable all access for development" ON members
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 项目表策略
CREATE POLICY "Enable all access for development" ON projects
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 分配表策略
CREATE POLICY "Enable all access for development" ON allocations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 7. 插入初始数据
INSERT INTO members (id, name, role) VALUES
    ('m1', 'Alice Chen', 'DB Architect'),
    ('m2', 'Bob Smith', 'Data Engineer'),
    ('m3', 'Charlie Kim', 'DBA'),
    ('m4', 'Diana Prince', 'ETL Developer'),
    ('m5', 'Ethan Hunt', 'Data Analyst'),
    ('m6', 'Fiona Gallagher', 'Backend Dev')
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, name, status, project_status) VALUES
    ('p1', 'FinTech Migration', 'active', 'ongoing'),
    ('p2', 'Real-time Ledger', 'active', 'ongoing'),
    ('p3', 'Audit Logs 2.0', 'active', 'ongoing')
ON CONFLICT (id) DO NOTHING;
