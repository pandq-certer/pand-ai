# 数据库操作规范文档

## 📋 文档信息

| 项目 | 信息 |
|------|------|
| **文档名称** | 数据库操作规范 |
| **版本** | v1.0 |
| **编写日期** | 2026-03-18 |
| **适用范围** | 所有数据库操作和迁移 |

---

## 1. 数据库迁移流程

### 1.1 新增字段流程

当需要为现有表添加新字段时，按照以下步骤操作：

#### 步骤1：创建迁移脚本
- 在 `supabase/migrations/` 目录下创建新的SQL文件
- 文件命名格式：`add_[feature_name].sql`
- 示例：`add_project_manager.sql`

#### 步骤2：编写迁移SQL
```sql
-- 添加项目经理字段到项目表
-- 在 Supabase 的 SQL Editor 中执行此脚本

-- 1. 为 projects 表添加 project_manager 字段
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS project_manager TEXT;

-- 2. 为项目经理字段添加注释
COMMENT ON COLUMN projects.project_manager IS '项目经理名称';

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_projects_project_manager ON projects(project_manager);
```

#### 步骤3：更新类型定义
在 `types.ts` 中更新相关接口：
```typescript
export interface Project {
  id: string;
  name: string;
  status: 'active' | 'archived';
  projectStatus: 'ongoing' | 'completed';
  projectManager?: string; // 新增字段
}
```

#### 步骤4：更新后端API
在 `services/supabaseStorage.ts` 中更新数据映射：
```typescript
// 读取时映射
const projects: Project[] = (projectsResult.data || []).map(p => ({
  id: p.id,
  name: p.name,
  status: p.status,
  projectStatus: p.project_status,
  projectManager: p.project_manager // 新增映射
}));

// 保存时映射
await supabase
  .from('projects')
  .upsert({
    id: project.id,
    name: project.name,
    status: project.status,
    project_status: project.projectStatus,
    project_manager: project.projectManager // 新增映射
  })
```

#### 步骤5：更新前端界面
在相关组件中添加用户界面：
- 添加输入框让用户可以输入新字段
- 更新列表显示以展示新字段
- 实现编辑和保存功能

#### 步骤6：测试验证
1. 在本地环境测试新功能
2. 验证数据正确保存到数据库
3. 检查数据读取和显示是否正常
4. 确认现有功能不受影响

---

## 2. 迁移脚本规范

### 2.1 脚本结构
每个迁移脚本应包含以下部分：

```sql
-- =============================================
-- 迁移脚本名称：添加项目经理字段
-- 创建日期：2026-03-18
-- 作者：系统
-- 描述：为projects表添加project_manager字段
-- =============================================

-- 1. 变更说明
-- 说明本次迁移的目的和影响范围

-- 2. 执行变更
-- 具体的SQL语句

-- 3. 验证步骤
-- 如何验证变更是否成功

-- 4. 回滚方案
-- 如果需要回滚，应该如何操作
```

### 2.2 安全性原则
- 使用 `IF NOT EXISTS` 避免重复执行错误
- 添加适当的注释说明字段用途
- 考虑向下兼容性
- 提供回滚方案

### 2.3 性能考虑
- 为常用查询字段添加索引
- 避免在大表上进行锁表操作
- 考虑使用 `ADD COLUMN` 的默认值功能

---

## 3. 数据库变更检查清单

### 3.1 变更前检查
- [ ] 是否真的需要修改数据库结构？
- [ ] 是否可以通过应用层解决？
- [ ] 变更会影响哪些现有功能？
- [ ] 是否需要数据迁移？
- [ ] 是否已备份数据？

### 3.2 变更实施
- [ ] 创建迁移脚本
- [ ] 在测试环境验证
- [ ] 更新类型定义
- [ ] 更新API层
- [ ] 更新UI层
- [ ] 编写测试用例

### 3.3 变更后验证
- [ ] 功能测试通过
- [ ] 数据完整性验证
- [ ] 性能测试
- [ ] 回归测试
- [ ] 文档更新

---

## 4. 常见数据库操作

### 4.1 添加新表
```sql
CREATE TABLE IF NOT EXISTS table_name (
    id TEXT PRIMARY KEY,
    field_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 启用RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Enable all access for development" ON table_name
    FOR ALL USING (true) WITH CHECK (true);
```

### 4.2 添加字段
```sql
-- 添加可选字段
ALTER TABLE table_name
ADD COLUMN IF NOT EXISTS new_field TEXT;

-- 添加必填字段（需要提供默认值）
ALTER TABLE table_name
ADD COLUMN IF NOT EXISTS new_field TEXT NOT NULL DEFAULT 'default_value';
```

### 4.3 修改字段
```sql
-- 修改字段类型
ALTER TABLE table_name
ALTER COLUMN field_name TYPE NEW_TYPE;

-- 添加字段约束
ALTER TABLE table_name
ALTER COLUMN field_name SET NOT NULL;
```

### 4.4 删除字段
```sql
-- 安全删除字段
ALTER TABLE table_name
DROP COLUMN IF EXISTS field_name;
```

### 4.5 创建索引
```sql
-- 普通索引
CREATE INDEX IF NOT EXISTS idx_table_name_field_name ON table_name(field_name);

-- 复合索引
CREATE INDEX IF NOT EXISTS idx_table_name_field1_field2 ON table_name(field1, field2);

-- 唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_table_name_field_name_unique ON table_name(field_name);
```

---

## 5. 数据迁移注意事项

### 5.1 数据迁移原则
1. **备份优先**：迁移前必须备份数据
2. **分步执行**：复杂迁移分解为小步骤
3. **可逆操作**：确保每个步骤都可回滚
4. **测试验证**：在测试环境充分验证

### 5.2 迁移脚本模板
```sql
-- =============================================
-- 数据迁移脚本
-- =============================================

-- 开始事务
BEGIN;

-- 1. 添加新字段（临时）
ALTER TABLE table_name
ADD COLUMN IF NOT EXISTS temp_field TEXT;

-- 2. 迁移数据
UPDATE table_name
SET temp_field = OLD_FIELD
WHERE condition;

-- 3. 验证数据
-- 添加验证逻辑

-- 4. 删除旧字段
ALTER TABLE table_name
DROP COLUMN old_field;

-- 5. 重命名新字段
ALTER TABLE table_name
RENAME COLUMN temp_field TO old_field;

-- 提交事务
COMMIT;
```

---

## 6. 常见问题解决

### 6.1 字段冲突
**问题**：添加字段时提示字段已存在
**解决**：使用 `IF NOT EXISTS` 语法

### 6.2 类型转换失败
**问题**：修改字段类型时转换失败
**解决**：先添加新字段，迁移数据，再删除旧字段

### 6.3 外键约束错误
**问题**：删除记录时提示外键约束
**解决**：检查 `ON DELETE CASCADE` 设置

### 6.4 性能下降
**问题**：添加字段后查询变慢
**解决**：为相关字段添加索引

---

## 7. 维护计划

### 7.1 定期维护任务
- 每月检查数据库性能
- 每季度审查索引使用情况
- 每年进行数据归档

### 7.2 监控指标
- 查询响应时间
- 数据库连接数
- 存储空间使用
- 慢查询日志

---

## 8. 相关文档

- [TECHNICAL.md](./TECHNICAL.md) - 技术架构文档
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 部署指南
- [supabase/schema.sql](./supabase/schema.sql) - 数据库架构

---

## 9. 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-03-18 | 初始版本，添加项目经理字段操作规范 | 系统 |

---

**文档结束**
