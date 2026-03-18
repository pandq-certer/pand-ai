-- 添加项目经理字段到项目表
-- 在 Supabase 的 SQL Editor 中执行此脚本

-- 1. 为 projects 表添加 project_manager 字段
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS project_manager TEXT;

-- 2. 为项目经理字段添加注释
COMMENT ON COLUMN projects.project_manager IS '项目经理名称';

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_projects_project_manager ON projects(project_manager);

-- 说明：
-- - project_manager 字段为可选字段，允许为 NULL
-- - 该字段用于存储项目经理名称
-- - 使用 TEXT 类型以支持任意长度的名称
-- - 添加索引以支持按项目经理查询项目
