# 华北数据库团队资源规划系统 - 技术文档

## 📋 文档信息

| 项目 | 信息 |
|------|------|
| **项目名称** | 华北数据库团队资源规划系统 |
| **版本** | v2.0.0 |
| **文档版本** | 1.0 |
| **编写日期** | 2025-01-11 |
| **技术栈** | React + TypeScript + Vite + Supabase |

---

## 1. 技术架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      用户界面层                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  Matrix    │  │ Dashboard  │  │ Settings   │        │
│  │  Component │  │ Component  │  │ Component  │        │
│  └────────────┘  └────────────┘  └────────────┘        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    业务逻辑层 (Services)                  │
│  ┌────────────────┐  ┌────────────────┐                │
│  │ supabaseStorage│  │   storage.ts   │                │
│  │    (主服务)    │  │   (备份)       │                │
│  └────────────────┘  └────────────────┘                │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    数据访问层 (Supabase Client)           │
│                  supabaseClient.ts                       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    数据存储层 (Supabase Cloud)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐      │
│  │ members  │  │ projects │  │  allocations     │      │
│  └──────────┘  └──────────┘  └──────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选型

#### 前端技术栈

| 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|----------|
| **React** | 19.2.3 | UI 框架 | 组件化开发，生态丰富 |
| **TypeScript** | 5.8.2 | 类型安全 | 减少运行时错误，提升开发效率 |
| **Vite** | 6.2.0 | 构建工具 | 快速热更新，优化生产构建 |
| **Recharts** | 3.6.0 | 图表库 | React 友好，可定制性强 |
| **Lucide React** | 0.562.0 | 图标库 | 轻量级，Tree-shakable |
| **html2canvas** | 1.4.1 | 截图功能 | 导出看板图片 |
| **xlsx** | 0.18.5 | Excel 导出 | 生成 Excel 文件 |

#### 后端技术栈

| 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|----------|
| **Supabase** | Latest | BaaS 平台 | 提供 PostgreSQL、认证、实时订阅 |
| **Supabase JS Client** | Latest | 数据库客户端 | 类型安全，API 简洁 |
| **PostgreSQL** | 15+ | 关系型数据库 | ACID 支持，强一致性 |

---

## 2. 数据库设计

### 2.1 ER 图

```
┌─────────────────┐
│     members     │
├─────────────────┤
│ id (PK)         │───┐
│ name            │   │
│ role            │   │
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
                      │
                      │    ┌─────────────────┐
                      │    │   allocations   │
                      │    ├─────────────────┤
                      ├────│ member_id (FK)  │
                      │    │ project_id (FK) │
┌─────────────────┐   │    │ week_date       │
│    projects     │   │    │ value           │
├─────────────────┤   │    │ id (PK)         │
│ id (PK)         │───┘    │ created_at      │
│ name            │        │ updated_at      │
│ status          │        └─────────────────┘
│ project_status  │
│ created_at      │
│ updated_at      │
└─────────────────┘
```

### 2.2 表结构详解

#### 2.2.1 members（成员表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | text | PRIMARY KEY | 成员唯一标识 |
| name | text | NOT NULL | 成员姓名 |
| role | text | NOT NULL | 职位 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

**索引**：
- PRIMARY KEY: `id`

**RLS 策略**：
```sql
-- 开发环境：允许所有操作
CREATE POLICY "Enable all access for development" ON members
    FOR ALL USING (true) WITH CHECK (true);
```

---

#### 2.2.2 projects（项目表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | text | PRIMARY KEY | 项目唯一标识 |
| name | text | NOT NULL | 项目名称 |
| status | text | NOT NULL | 状态：active/archived |
| project_status | text | NOT NULL | 项目状态：ongoing/completed |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

**索引**：
- PRIMARY KEY: `id`

---

#### 2.2.3 allocations（分配表）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | text | PRIMARY KEY | 分配记录唯一标识 |
| member_id | text | NOT NULL, FOREIGN KEY | 成员 ID |
| project_id | text | NOT NULL, FOREIGN KEY | 项目 ID |
| week_date | text | NOT NULL | 周日期（YYYY-MM-DD） |
| value | numeric(3,2) | NOT NULL | 分配值 0.00-1.00 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

**索引**：
- PRIMARY KEY: `id`
- INDEX: `idx_allocations_member_id` ON `member_id`
- INDEX: `idx_allocations_project_id` ON `project_id`
- INDEX: `idx_allocations_week_date` ON `week_date`

**唯一约束**：
```sql
UNIQUE(member_id, project_id, week_date)
```

**外键约束**：
```sql
FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
```

---

### 2.3 数据库初始化脚本

位置：`supabase/schema.sql`

**关键内容**：
1. 创建三张主表
2. 设置索引和外键约束
3. 启用 Row Level Security (RLS)
4. 插入初始数据（6个成员，3个项目）

**执行方式**：
```bash
# 在 Supabase SQL Editor 中执行
复制 supabase/schema.sql 的全部内容 → 粘贴 → Run
```

---

## 3. 前端架构

### 3.1 目录结构

```
team-resource-planner/
├── public/                      # 静态资源
├── src/
│   ├── components/             # React 组件
│   │   ├── Dashboard.tsx       # 数据看板组件
│   │   ├── Matrix.tsx          # 资源分配矩阵组件
│   │   └── Settings.tsx        # 系统配置组件
│   ├── services/               # 业务逻辑层
│   │   ├── storage.ts          # localStorage 存储（已弃用）
│   │   └── supabaseStorage.ts  # Supabase 存储（当前使用）
│   ├── supabase/               # Supabase 配置
│   │   ├── schema.sql          # 数据库初始化脚本
│   │   └── restore_data.sql    # 数据恢复脚本
│   ├── App.tsx                 # 主应用组件
│   ├── supabaseClient.ts       # Supabase 客户端初始化
│   ├── types.ts                # TypeScript 类型定义
│   ├── utils.ts                # 工具函数
│   ├── vite.config.ts          # Vite 配置
│   ├── index.html              # HTML 入口
│   └── index.tsx               # React 入口
├── supabase/                   # Supabase 相关文件
├── .env.local                  # 本地环境变量（不提交）
├── .env.example                # 环境变量模板
├── .gitignore                  # Git 忽略文件
├── package.json                # 项目依赖
├── tsconfig.json               # TypeScript 配置
├── REQUIREMENTS.md             # 需求文档
├── TECHNICAL.md                # 技术文档（本文件）
├── DEPLOYMENT_GUIDE.md         # 部署指南
└── README.md                   # 项目说明
```

### 3.2 组件设计

#### 3.2.1 App.tsx（主应用）

**职责**：
- 管理全局状态（data, currentView, loading, error）
- 处理数据加载和错误处理
- 路由视图切换
- 提供上下文给子组件

**关键状态**：
```typescript
const [data, setData] = useState<AppData | null>(null);
const [currentView, setCurrentView] = useState<ViewState>('matrix');
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

**生命周期**：
```typescript
useEffect(() => {
  const fetchData = async () => {
    const loaded = await loadData();
    setData(loaded);
    setLoading(false);
  };
  fetchData();
}, []);
```

---

#### 3.2.2 Matrix（资源分配矩阵）

**职责**：
- 展示成员 × 项目的二维矩阵
- 支持单元格编辑
- 热力图颜色编码
- 删除整行分配

**关键功能**：
```typescript
// 单元格颜色计算
const getCellColor = (value: number) => {
  if (value === 0) return 'bg-gray-50';
  if (value <= 0.3) return 'bg-blue-100';
  if (value <= 0.7) return 'bg-blue-200';
  return 'bg-blue-300';
};

// 单元格更新
const handleCellChange = (memberId, projectId, week, newValue) => {
  onUpdateAllocation(memberId, projectId, week, parseFloat(newValue));
};
```

---

#### 3.2.3 Dashboard（数据看板）

**职责**：
- 展示总体统计卡片
- 渲染可视化图表
- 分析资源利用率

**图表组件**：
```typescript
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={chartData}>
    <XAxis dataKey="week" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="FinTech Migration" stroke="#8884d8" />
    <Line type="monotone" dataKey="Real-time Ledger" stroke="#82ca9d" />
  </LineChart>
</ResponsiveContainer>
```

---

#### 3.2.4 Settings（系统配置）

**职责**：
- 成员管理（增删改）
- 项目管理（增删改、状态切换）
- 实时保存到数据库

**关键功能**：
```typescript
const removeMember = (id: string) => {
  if (confirm('确定要删除该成员吗？')) {
    onUpdate({
      ...data,
      members: data.members.filter(m => m.id !== id),
      allocations: data.allocations.filter(a => a.memberId !== id),
    });
  }
};
```

---

### 3.3 状态管理

**当前方案**：React Hooks（useState）

**数据流**：
```
用户操作 → 组件事件处理 → 调用 Service 方法 → 更新数据库 → 更新 State → 重新渲染
```

**未来优化**：
- 考虑使用 Context API 或 Zustand 管理全局状态
- 添加 React Query 或 SWR 处理数据缓存和同步

---

### 3.4 类型系统

位置：`types.ts`

**核心类型**：

```typescript
// 成员
interface Member {
  id: string;
  name: string;
  role: string;
}

// 项目
interface Project {
  id: string;
  name: string;
  status: 'active' | 'archived';
  projectStatus: 'ongoing' | 'completed';
}

// 分配
interface Allocation {
  id: string;
  memberId: string;
  projectId: string;
  weekDate: string;
  value: number;
}

// 应用数据
interface AppData {
  members: Member[];
  projects: Project[];
  allocations: Allocation[];
}

// 视图状态
type ViewState = 'matrix' | 'dashboard' | 'settings';
```

---

## 4. API 设计

### 4.1 Supabase RESTful API

Supabase 自动为每张表生成 RESTful API：

| 操作 | HTTP 方法 | 端点 | 说明 |
|------|-----------|------|------|
| 读取成员 | GET | `/rest/v1/members` | 获取所有成员 |
| 创建成员 | POST | `/rest/v1/members` | 创建新成员 |
| 更新成员 | PATCH | `/rest/v1/members?id=eq.{id}` | 更新成员信息 |
| 删除成员 | DELETE | `/rest/v1/members?id=eq.{id}` | 删除成员 |

### 4.2 客户端调用示例

```typescript
// 读取数据
const { data, error } = await supabase
  .from('members')
  .select('*');

// 插入数据
const { data, error } = await supabase
  .from('allocations')
  .insert([
    { member_id: 'm1', project_id: 'p1', week_date: '2025-01-12', value: 0.8 }
  ]);

// 更新数据
const { data, error } = await supabase
  .from('allocations')
  .update({ value: 0.9 })
  .eq('id', 'alloc_001');

// 删除数据
const { error } = await supabase
  .from('allocations')
  .delete()
  .eq('member_id', 'm1')
  .eq('project_id', 'p1');
```

---

## 5. 核心功能实现

### 5.1 乐观更新（Optimistic Updates）

**原理**：先更新 UI，后台异步保存数据库

**代码实现**：
```typescript
export const updateAllocation = async (
  currentData: AppData,
  memberId: string,
  projectId: string,
  weekDate: string,
  value: number
): Promise<AppData> => {
  // 1. 先在本地更新（乐观更新）
  const newData = { ...currentData, allocations: updatedAllocations };

  // 2. 在后台异步保存到数据库（不等待完成）
  saveAllocationToDatabase(memberId, projectId, weekDate, value)
    .catch(error => console.error('保存失败:', error));

  // 3. 立即返回更新后的数据
  return newData;
};
```

**优点**：
- UI 响应速度快（~50ms vs ~500ms）
- 用户体验流畅

**缺点**：
- 可能出现数据不一致（网络失败时）
- 需要错误处理和回滚机制

---

### 5.2 同步删除（Sync Delete）

**原理**：等待数据库确认后再更新 UI

**代码实现**：
```typescript
export const deleteProjectRow = async (
  currentData: AppData,
  memberId: string,
  projectId: string
): Promise<AppData> => {
  // 1. 先删除数据库中的数据（等待完成）
  const { error } = await supabase
    .from('allocations')
    .delete()
    .eq('member_id', memberId)
    .eq('project_id', projectId);

  if (error) throw error;

  // 2. 数据库删除成功后，更新本地数据
  return {
    ...currentData,
    allocations: currentData.allocations.filter(
      a => !(a.memberId === memberId && a.projectId === projectId)
    )
  };
};
```

**优点**：
- 数据一致性高
- 不会出现"删除后刷新又回来"的问题

**缺点**：
- UI 响应较慢（需要等待网络）

---

### 5.3 数据对比删除

**原理**：对比数据库和 UI 数据，删除不存在的记录

**代码实现**：
```typescript
export const saveData = async (data: AppData): Promise<void> => {
  // 1. 获取数据库中现有的数据
  const [existingMembers, existingProjects] = await Promise.all([
    supabase.from('members').select('id'),
    supabase.from('projects').select('id')
  ]);

  const existingMemberIds = new Set(existingMembers.data?.map(m => m.id) || []);
  const newMemberIds = new Set(data.members.map(m => m.id));

  // 2. 删除数据库中存在但新数据中不存在的成员
  const membersToDelete = [...existingMemberIds].filter(id => !newMemberIds.has(id));
  if (membersToDelete.length > 0) {
    await supabase.from('members').delete().in('id', membersToDelete);
  }

  // 3. Upsert 新的成员和项目
  await Promise.all([...]);
};
```

---

## 6. 性能优化

### 6.1 前端优化

| 优化项 | 方法 | 效果 |
|--------|------|------|
| **代码分割** | Vite 自动分割 | 减少初始加载时间 |
| **Tree Shaking** | Vite 自动优化 | 减少打包体积 |
| **懒加载** | React.lazy() | 按需加载组件 |
| **乐观更新** | 先更新 UI | 提升响应速度 |
| **防抖** | lodash.debounce | 减少数据库操作 |

### 6.2 数据库优化

| 优化项 | 方法 | 效果 |
|--------|------|------|
| **索引** | 添加外键索引 | 加速查询 |
| **批量操作** | Promise.all | 减少网络往返 |
| **查询优化** | 只查询需要的字段 | 减少数据传输 |
| **连接池** | Supabase 自动管理 | 提高并发性能 |

### 6.3 网络优化

| 优化项 | 方法 | 效果 |
|--------|------|------|
| **CDN** | Supabase Edge Functions | 加速全球访问 |
| **压缩** | Vite Gzip 压缩 | 减少传输体积 |
| **缓存** | Supabase 缓存策略 | 减少重复查询 |

---

## 7. 安全设计

### 7.1 数据安全

**环境变量管理**：
```bash
# .env.local（不提交到 Git）
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

**API 密钥**：
- 使用 `anon` key（公开密钥）作为前端密钥
- `service_role` key 绝不暴露在前端
- 密钥通过环境变量注入，不硬编码

### 7.2 Row Level Security (RLS)

**生产环境策略**（待实施）：
```sql
-- 启用 RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 只允许认证用户读取
CREATE POLICY "Allow authenticated read" ON members
  FOR SELECT USING (auth.role() = 'authenticated');

-- 只允许管理员修改
CREATE POLICY "Allow admin update" ON members
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

**开发环境策略**（当前）：
```sql
-- 允许所有操作（仅用于开发）
CREATE POLICY "Enable all access for development" ON members
  FOR ALL USING (true) WITH CHECK (true);
```

### 7.3 数据加密

- **传输加密**：HTTPS/TLS
- **存储加密**：Supabase 自动加密
- **备份加密**：Supabase 自动加密备份

---

## 8. 错误处理

### 8.1 错误类型

| 错误类型 | 示例 | 处理方式 |
|----------|------|----------|
| **网络错误** | Supabase 连接失败 | 显示错误提示，提供重试按钮 |
| **数据验证错误** | 分配值 > 1.0 | 拒绝保存，显示错误信息 |
| **权限错误** | RLS 拒绝访问 | 提示无权限，联系管理员 |
| **并发冲突** | 多人同时编辑 | 最后写入胜出 |

### 8.2 错误处理代码

```typescript
try {
  const data = await loadData();
  setData(data);
} catch (error) {
  console.error('加载数据失败:', error);
  setError('无法连接到数据库，请检查网络连接');
  setLoading(false);
}
```

---

## 9. 测试策略

### 9.1 单元测试（待实施）

**框架**：Jest + React Testing Library

**测试范围**：
- [ ] 工具函数（utils.ts）
- [ ] 数据处理逻辑
- [ ] 组件渲染

**示例**：
```typescript
test('getNext13Weeks returns 13 weeks', () => {
  const weeks = getNext13Weeks();
  expect(weeks).toHaveLength(13);
});
```

### 9.2 集成测试（待实施）

**框架**：Playwright

**测试场景**：
- [ ] 完整的资源分配流程
- [ ] 成员和项目管理
- [ ] 数据持久化

### 9.3 手动测试

**测试清单**：
- [x] 数据加载和显示
- [x] 资源分配修改和保存
- [x] 成员/项目删除
- [x] 数据刷新后保持
- [ ] 跨浏览器兼容性

---

## 10. 部署架构

### 10.1 部署选项

#### 选项1：EdgeOne Pages（推荐）

```
用户浏览器 → EdgeOne CDN → 静态HTML/CSS/JS
                      ↓
                  Supabase Cloud (API + 数据库)
```

**优点**：
- 全球 CDN 加速
- 自动 HTTPS
- 简单部署

**步骤**：
1. 构建项目：`npm run build`
2. 上传 `dist` 目录到 EdgeOne Pages
3. 配置环境变量

---

#### 选项2：CentOS + Nginx

```
用户浏览器 → Nginx (静态文件服务) → Supabase Cloud
```

**Nginx 配置**：
```nginx
server {
  listen 80;
  server_name your-domain.com;
  root /var/www/team-planner/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

### 10.2 环境变量配置

**本地开发**（.env.local）：
```bash
VITE_SUPABASE_URL=https://bgwmuihgbllamqlhidds.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

**生产环境**（EdgeOne Pages / 服务器）：
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

---

## 11. 监控与日志

### 11.1 前端监控（待实施）

**工具**：Sentry 或 Google Analytics

**监控指标**：
- 页面加载时间
- API 响应时间
- 错误率
- 用户行为分析

### 11.2 后端监控

**Supabase Dashboard**：
- 数据库性能
- API 请求统计
- 存储使用情况
- 错误日志

---

## 12. 开发指南

### 12.1 本地开发

**步骤**：
```bash
# 1. 克隆项目
git clone https://github.com/pandq-certer/pand-ai.git
cd pand-ai

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 Supabase 配置

# 4. 启动开发服务器
npm run dev

# 5. 访问 http://localhost:3000
```

### 12.2 代码规范

**命名规范**：
- 组件：PascalCase（如 `Dashboard.tsx`）
- 函数：camelCase（如 `loadData`）
- 常量：UPPER_SNAKE_CASE（如 `API_KEY`）
- 类型：PascalCase（如 `AppData`）

**文件组织**：
- 一个文件一个组件
- 相关文件放在同一目录
- 共享代码放在 `services/` 或 `utils/`

**注释规范**：
```typescript
/**
 * 加载数据从 Supabase
 * @returns Promise<AppData> 应用数据
 * @throws Error 如果数据库连接失败
 */
export const loadData = async (): Promise<AppData> => {
  // ...
};
```

### 12.3 Git 工作流

**分支策略**：
- `main`：生产分支
- `dev`：开发分支
- `feature/*`：功能分支

**提交规范**：
```bash
# feat: 新功能
# fix: 修复 Bug
# docs: 文档更新
# style: 代码格式调整
# refactor: 重构
# test: 测试相关
# chore: 构建/工具相关

git commit -m "feat: 添加数据导出功能"
```

---

## 13. 故障排查

### 13.1 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 数据无法加载 | Supabase 连接失败 | 检查 .env.local 配置 |
| 删除后数据又回来 | 数据库删除失败 | 检查 RLS 策略 |
| 页面白屏 | JavaScript 错误 | 查看浏览器控制台 |
| 构建失败 | 依赖版本冲突 | 删除 node_modules 重新安装 |

### 13.2 调试技巧

**查看网络请求**：
```javascript
// 浏览器控制台
fetch('https://your-project.supabase.co/rest/v1/members', {
  headers: {
    'apikey': 'your-anon-key',
    'Authorization': 'Bearer your-anon-key'
  }
}).then(r => r.json()).then(console.log);
```

**查看 Supabase 日志**：
1. 登录 Supabase Dashboard
2. 进入 Database → Logs
3. 查看错误日志

---

## 14. 未来技术升级

### 14.1 短期（1-3个月）

- [ ] 添加单元测试和集成测试
- [ ] 实施生产环境 RLS 策略
- [ ] 添加用户认证（Supabase Auth）
- [ ] 优化移动端体验

### 14.2 中期（3-6个月）

- [ ] 迁移到 Next.js（SSR/SSG）
- [ ] 添加实时协作（Supabase Realtime）
- [ ] 实现离线支持（Service Worker）
- [ ] 添加性能监控

### 14.3 长期（6-12个月）

- [ ] 微前端架构
- [ ] AI 辅助资源推荐
- [ ] 移动端 App（React Native）
- [ ] 多租户支持

---

## 15. 参考资料

### 15.1 官方文档

- [React 文档](https://react.dev)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
- [Vite 文档](https://vitejs.dev)
- [Supabase 文档](https://supabase.com/docs)
- [Recharts 文档](https://recharts.org)

### 15.2 最佳实践

- [React 最佳实践](https://react.dev/learn)
- [TypeScript 最佳实践](https://typescript-eslint.io/rules/)
- [Supabase 最佳实践](https://supabase.com/docs/guides/api)

---

**文档结束**
