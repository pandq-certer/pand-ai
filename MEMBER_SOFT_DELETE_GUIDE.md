# 成员逻辑删除功能说明

## 功能概述

系统已实现成员的**逻辑删除**功能，删除成员时不会物理删除数据，只是标记为"已删除"状态。

---

## 主要特性

### ✅ 数据保留
- **成员信息**：姓名、角色、邮箱等全部保留
- **历史投入数据**：该成员过往的所有项目投入记录完整保留
- **可追溯性**：管理员可以随时查看和恢复已删除成员

### ✅ 页面隐藏
- 已删除的成员在所有页面中不再显示
- 数据看板、资源分配矩阵、设置页面均不显示已删除成员
- 邮件报告中也不会包含已删除成员

### ✅ 数据完整性
- allocations 表中的历史数据不受影响
- 可以通过历史数据查询已删除成员的投入情况
- 统计报表可以包含历史成员数据

---

## 实现原理

### 1. 数据库层面
```sql
-- members 表添加 status 字段
ALTER TABLE members ADD COLUMN status TEXT
DEFAULT 'active' CHECK (status IN ('active', 'deleted'));

-- 查询活跃成员
SELECT * FROM members WHERE status = 'active';

-- 查询已删除成员
SELECT * FROM members WHERE status = 'deleted';
```

### 2. 应用层面
```typescript
// Member 接口添加状态字段
interface Member {
  id: string;
  name: string;
  role: string;
  email?: string;
  status?: 'active' | 'deleted';
}

// 加载数据时过滤已删除成员
const members = (data || [])
  .filter(m => m.status !== 'deleted')
  .map(m => ({...}));
```

### 3. 删除操作
```typescript
// 逻辑删除：更新状态为 'deleted'
await supabase
  .from('members')
  .update({ status: 'deleted' })
  .in('id', memberIds);

// 而不是物理删除
// await supabase.from('members').delete().in('id', memberIds);
```

---

## 使用说明

### 删除成员
1. 在"设置"页面管理成员
2. 点击删除按钮
3. 系统自动将成员状态更新为 `deleted`
4. 页面刷新后，该成员不再显示

### 恢复成员（管理员功能）
系统提供了恢复功能，可以恢复已删除的成员：

```typescript
// 恢复单个或多个成员
import { restoreDeletedMembers } from './services/supabaseStorage';

await restoreDeletedMembers(['member-id-1', 'member-id-2']);
```

### 查看已删除成员（管理员功能）
```typescript
// 获取所有已删除成员列表
import { getDeletedMembers } from './services/supabaseStorage';

const deletedMembers = await getDeletedMembers();
console.log(deletedMembers); // 显示所有已删除成员
```

---

## 数据库迁移

在部署前需要执行数据库迁移脚本：

```bash
# 在 Supabase SQL Editor 中执行
# 文件：supabase/migrations/add_member_status.sql
```

迁移脚本会：
1. 为 members 表添加 `status` 字段
2. 为现有成员设置默认状态为 `active`
3. 创建索引提升查询性能
4. 创建 `active_members` 视图（可选）

---

## 数据查询示例

### 查询所有成员（包括已删除）
```sql
SELECT * FROM members;
```

### 只查询活跃成员
```sql
SELECT * FROM members WHERE status = 'active';
-- 或使用视图
SELECT * FROM active_members;
```

### 查询某个成员的历史投入（包括已删除成员）
```sql
SELECT
  m.name,
  m.role,
  p.name as project_name,
  a.week_date,
  a.value
FROM allocations a
JOIN members m ON a.member_id = m.id
JOIN projects p ON a.project_id = p.id
WHERE m.id = 'member-id'
ORDER BY a.week_date DESC;
```

### 统计历史数据（包含已删除成员）
```sql
-- 统计某个项目的总投入（包括历史成员）
SELECT
  p.name as project_name,
  COUNT(DISTINCT a.member_id) as total_members,
  SUM(a.value) as total_allocation
FROM allocations a
JOIN projects p ON a.project_id = p.id
JOIN members m ON a.member_id = m.id
WHERE p.id = 'project-id'
GROUP BY p.name;
```

---

## 注意事项

### ⚠️ 重要提醒

1. **历史数据查询**：如果需要查询已删除成员的历史数据，请直接查询数据库，不要依赖前端页面
2. **数据导出**：导出功能默认不包含已删除成员，如需包含请联系管理员
3. **邮件报告**：已删除成员不会出现在任何邮件报告中
4. **ID 唯一性**：删除后恢复的成员保持相同的 ID，数据关联不会丢失

### 🔒 数据安全

- 已删除成员的数据永久保留，不会自动清理
- 只有具有管理员权限的用户才能查看和恢复已删除成员
- 建议定期备份数据库，确保数据安全

---

## 未来改进

可能的增强功能：
- [ ] 在设置页面添加"已删除成员"标签页，可以查看和恢复
- [ ] 添加批量恢复功能
- [ ] 支持删除原因记录
- [ ] 添加数据保留策略（如：保留 3 年后物理删除）
- [ ] 支持成员离职日期记录

---

## 技术支持

如有疑问，请联系：
- **潘大全** (pandq@chinacscs.com)
- **系统文档**：查看项目 README.md

---

**文档版本**: v1.0.0
**最后更新**: 2026-03-11
