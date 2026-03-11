# 开发规范文档

## 项目概述
华北数据库团队资源规划系统 - 基于 React + TypeScript + Supabase 的团队资源管理工具

## 开发规范

### 1. 代码提交规范

**重要规则：**
- 当用户提出需求变更或问题时，**不要直接提交代码到 Git**
- 只进行代码修复和编辑
- 等待用户明确发出提交命令后，再执行 `git commit` 和 `git push`
- 用户可使用以下命令：
  - "提交代码" / "提交" / "commit"
  - "推送" / "push"
  - "发布到 GitHub" 等

**提交流程：**
```bash
# 1. 等待用户确认
# 2. 执行 git add
git add -A

# 3. 创建提交信息
git commit -m "提交说明"

# 4. 推送到 GitHub
git push origin main
```

### 2. 代码修改流程

1. **理解需求**：仔细阅读用户的需求描述
2. **分析问题**：识别问题的根本原因
3. **修改代码**：使用 Edit 工具修改相关文件
4. **测试验证**：运行 `npm run build` 确保没有语法错误
5. **等待确认**：告知用户修改完成，等待提交指令
6. **提交推送**：收到指令后执行 git 操作

### 3. 提交信息格式

采用 Conventional Commits 规范：

```
<type>: <subject>

<body>

<footer>
```

**类型 (type)：**
- `feat`: 新功能
- `fix`: 修复 bug
- `refactor`: 重构代码
- `docs`: 文档更新
- `style`: 代码格式调整
- `test`: 测试相关
- `chore`: 构建/工具链更新

**示例：**
```
fix: 修复定时发送重复邮件的问题

- 移除启动时的立即检查
- 添加渲染等待时间

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 4. 分支管理

- **主分支**: `main` - 生产环境代码
- **开发流程**: 直接在 main 分支开发（单人项目）
- **提交前检查**: 确保代码通过 `npm run build`

### 5. 代码审查要点

在修改代码前，检查以下内容：

- [ ] 是否会影响现有功能
- [ ] 是否需要更新类型定义
- [ ] 是否需要更新文档
- [ ] 是否需要数据库迁移
- [ ] 是否需要环境变量配置

### 6. 常见任务

#### 修改组件
1. 使用 `Read` 工具查看相关文件
2. 使用 `Edit` 工具修改代码
3. 运行 `npm run build` 验证
4. 等待用户确认提交

#### 添加新功能
1. 创建/修改相关文件
2. 更新类型定义 `types.ts`
3. 测试功能是否正常
4. 等待用户确认提交

#### 修复 Bug
1. 分析错误日志
2. 定位问题代码
3. 修复并验证
4. 等待用户确认提交

### 7. 项目结构

```
teamresourceplanner/
├── components/          # React 组件
│   ├── Dashboard.tsx   # 数据看板
│   ├── Settings.tsx    # 设置页面
│   └── Login.tsx       # 登录页面
├── services/           # 业务服务
│   ├── emailService.ts # 邮件服务
│   └── projectManagerEmail.ts # 邮件模板
├── utils/              # 工具函数
│   ├── scheduler.ts    # 定时任务
│   └── export.ts       # 导出功能
├── supabase/           # Supabase 配置
│   └── functions/      # Edge Functions
├── types.ts            # 类型定义
└── App.tsx             # 主应用组件
```

### 8. 环境变量

项目需要在 `.env` 文件中配置以下变量：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 9. 邮件服务配置

需要在 Supabase Edge Functions 中配置：

- `EMAIL_SERVICE`: resend 或 sendgrid
- `EMAIL_API_KEY`: 邮件服务 API 密钥
- `EMAIL_FROM`: 发件人邮箱地址

配置路径：Supabase Dashboard → Edge Functions → resend-email → Environment Variables

### 10. 常用命令

```bash
# 开发环境
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 类型检查
npm run check

# Git 操作
git status
git add -A
git commit -m "提交信息"
git push origin main
```

### 11. 注意事项

1. **定时邮件发送**：修改 scheduler.ts 后需仔细测试，避免重复发送
2. **邮件模板**：修改邮件内容后需测试 HTML 渲染效果
3. **数据库操作**：修改数据结构前先备份
4. **环境配置**：不要提交 `.env` 文件到版本控制
5. **Edge Functions**：修改后需在 Supabase 中重新部署

### 12. 问题排查

#### 邮件发送失败
- 检查 Supabase Edge Functions 环境变量配置
- 查看 Console 日志中的错误信息
- 验证邮件服务 API 密钥是否有效

#### 定时任务不执行
- 检查邮件配置中的启用状态
- 查看浏览器 Console 中的调度日志
- 确认调度时间和频率设置正确

#### 附件图片为空
- 确保 Dashboard 组件已完全渲染
- 增加截图前的等待时间
- 检查 html2canvas 的配置参数

---

**文档版本**: v1.0.0
**最后更新**: 2026-03-11
**维护者**: 潘大全 (pandq@chinacscs.com)
