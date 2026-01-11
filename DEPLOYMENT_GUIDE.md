# 部署到 Supabase 完整指南

## 📋 准备工作

### 1. 获取 Supabase 配置信息

登录你的 Supabase 控制台，获取以下信息：

1. **Project URL**
   - 进入你的项目
   - 点击左侧菜单的 `Settings` → `API`
   - 复制 `Project URL` (格式: `https://xxxxx.supabase.co`)

2. **anon/public Key**
   - 在同一页面
   - 复制 `anon` `public` 密钥

### 2. 配置环境变量

在你的本地 `.env.local` 文件中填入获取的配置：

```bash
GEMINI_API_KEY=your-gemini-api-key

# Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🗄️ 数据库设置

### 方式一：使用 SQL Editor（推荐）

1. 在 Supabase 控制台中，点击左侧菜单的 `SQL Editor`
2. 点击 `New query`
3. 复制 `supabase/schema.sql` 文件的内容
4. 粘贴到编辑器中
5. 点击 `Run` 执行

### 方式二：使用 Table Editor 手动创建

如果不使用 SQL 脚本，也可以手动创建表：

#### 创建 members 表
```
- Table name: members
- Columns:
  - id: text (PRIMARY KEY)
  - name: text
  - role: text
  - created_at: timestamp with time zone (default: now())
  - updated_at: timestamp with time zone (default: now())
```

#### 创建 projects 表
```
- Table name: projects
- Columns:
  - id: text (PRIMARY KEY)
  - name: text
  - status: text
  - project_status: text
  - created_at: timestamp with time zone (default: now())
  - updated_at: timestamp with time zone (default: now())
```

#### 创建 allocations 表
```
- Table name: allocations
- Columns:
  - id: text (PRIMARY KEY)
  - member_id: text (FOREIGN KEY → members.id)
  - project_id: text (FOREIGN KEY → projects.id)
  - week_date: text
  - value: numeric (3,2)
  - created_at: timestamp with time zone (default: now())
  - updated_at: timestamp with time zone (default: now())
- Add unique constraint on (member_id, project_id, week_date)
```

---

## 🔐 配置 Row Level Security (RLS)

Supabase 默认启用 RLS，需要配置策略：

### 开发环境（允许所有访问）

在 SQL Editor 中执行：

```sql
-- 禁用 RLS（仅用于开发测试）
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE allocations DISABLE ROW LEVEL SECURITY;
```

### 生产环境（推荐）

在 SQL Editor 中执行：

```sql
-- 启用 RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;

-- 允许所有读取操作
CREATE POLICY "Allow all read" ON members
    FOR SELECT USING (true);

CREATE POLICY "Allow all read" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Allow all read" ON allocations
    FOR SELECT USING (true);

-- 允许所有插入/更新/删除操作
CREATE POLICY "Allow all insert" ON members
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update" ON members
    FOR UPDATE USING (true);

CREATE POLICY "Allow all insert" ON projects
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update" ON projects
    FOR UPDATE USING (true);

CREATE POLICY "Allow all insert" ON allocations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update" ON allocations
    FOR UPDATE USING (true);

CREATE POLICY "Allow all delete" ON allocations
    FOR DELETE USING (true);
```

---

## 🧪 本地测试

### 1. 安装依赖（如果还没安装）
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 测试功能
- 打开浏览器访问 `http://localhost:3000`
- 检查是否能正常加载数据
- 尝试修改资源分配
- 检查数据是否保存到 Supabase

### 4. 验证数据持久化
- 在 Supabase 控制台的 `Table Editor` 中查看数据
- 刷新页面，确认数据依然存在
- 在不同浏览器/设备上测试数据同步

---

## 🚀 部署到 EdgeOne Pages

### 1. 构建项目
```bash
npm run build
```

### 2. 在 EdgeOne Pages 中配置环境变量

部署到 EdgeOne Pages 时，需要在控制台配置环境变量：

**变量名**: `VITE_SUPABASE_URL`
**值**: 你的 Supabase Project URL

**变量名**: `VITE_SUPABASE_ANON_KEY`
**值**: 你的 Supabase anon key

**变量名**: `GEMINI_API_KEY` (如果需要)
**值**: 你的 Gemini API Key

### 3. 上传 dist 目录
将构建生成的 `dist` 目录上传到 EdgeOne Pages

---

## ✅ 部署检查清单

- [ ] Supabase 项目已创建
- [ ] 数据库表已创建（members, projects, allocations）
- [ ] RLS 策略已配置
- [ ] 环境变量已正确配置（.env.local）
- [ ] 本地测试通过
- [ ] 数据持久化工作正常
- [ ] EdgeOne Pages 环境变量已配置
- [ ] 项目已成功部署

---

## 🐛 常见问题排查

### 问题1：无法连接到数据库
**解决方案**：
- 检查 `.env.local` 中的 Supabase URL 和 Key 是否正确
- 确认 Supabase 项目处于暂停/恢复状态
- 检查浏览器控制台的错误信息

### 问题2：数据保存失败
**解决方案**：
- 检查 RLS 策略是否正确配置
- 确认数据库表结构正确
- 在 Supabase 控制台查看日志

### 问题3：部署后环境变量不生效
**解决方案**：
- 确认在 EdgeOne Pages 中配置了环境变量
- 变量名必须以 `VITE_` 开头
- 重新构建和部署项目

### 问题4：跨域问题（CORS）
**解决方案**：
- 在 Supabase 控制台配置允许的域名
- Settings → API → CORS 配置

---

## 📊 数据迁移（从 localStorage 迁移）

如果你有 localStorage 中的旧数据需要迁移：

1. 打开旧版本应用
2. 在浏览器控制台执行：
```javascript
const data = localStorage.getItem('resource_planner_db_v1');
copy(data); // 复制到剪贴板
```

3. 将数据保存为 JSON 文件
4. 使用 Supabase 的 Table Editor 或编写脚本导入数据

---

## 🎯 下一步优化建议

1. **添加用户认证**
   - 使用 Supabase Auth
   - 区分不同用户的数据

2. **实时同步**
   - 使用 Supabase Realtime
   - 多用户协作时自动更新

3. **数据备份**
   - 定期备份数据库
   - 导出功能

4. **性能优化**
   - 添加查询索引
   - 实现分页加载

---

## 📞 技术支持

- Supabase 文档: https://supabase.com/docs
- EdgeOne Pages 文档: https://cloud.tencent.com/document/product/1552
- 项目 Issues: 在项目仓库提交问题
