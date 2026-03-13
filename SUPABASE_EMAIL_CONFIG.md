# Supabase 邮件确认重定向配置指南

## 问题描述

用户注册时收到的邮件确认链接会重定向到错误的地址：
- ❌ 当前错误：`http://localhost:3000/#error=...`
- ✅ 应该重定向到：`https://db-cscsteam.online/`

## 解决方案

需要在 Supabase 控制台中配置正确的 Site URL 和 Redirect URLs。

---

## 步骤 1：登录 Supabase 控制台

1. 访问：https://supabase.com/dashboard
2. 选择您的项目
3. 左侧菜单点击 **Settings** → **Authentication**

---

## 步骤 2：配置 Site URL

在 **Authentication** 页面找到 **Site URL** 设置：

```
Site URL: https://db-cscsteam.online/
```

**注意**：
- 必须以 `/` 结尾
- 必须使用 `https://`（生产环境）
- 这是邮件确认链接的基础 URL

---

## 步骤 3：配置 Redirect URLs

在同一个页面找到 **Redirect URLs** 设置，添加以下 URL：

```
https://db-cscsteam.online/*
https://db-cscsteam.online/auth/callback
```

**说明**：
- `/*` 允许所有路径的重定向
- `/auth/callback` 是认证回调的具体路径
- 每行一个 URL，保存后会自动格式化

---

## 步骤 4：配置邮件模板（可选）

如果需要自定义邮件内容，可以在 **Email Templates** 中配置：

### Confirm Signup 模板
- 路径：Authentication → Email Templates → Confirm Signup
- 确保模板中的 `{{ .ConfirmationURL }}` 变量正确

### Reset Password 模板
- 路径：Authentication → Email Templates → Reset Password
- 确保重置密码链接正确

---

## 步骤 5：保存并测试

1. 点击页面底部的 **Save** 按钮
2. 等待配置生效（通常立即生效，最多 1-2 分钟）
3. 测试注册流程：
   - 尝试注册新用户
   - 检查邮件中的确认链接
   - 点击链接确认能正确跳转到 `https://db-cscsteam.online/`

---

## 常见问题

### Q1: 配置后仍然跳转到 localhost？
**A:** 清除浏览器缓存或使用无痕模式重新测试

### Q2: 邮件中的链接显示 "link expired"？
**A:** 可能原因：
- 邮件发送时间 > Site URL 配置修改时间
- 邮件链接有效期已过（默认 1 小时）
- 重新发送确认邮件即可

### Q3: 需要同时支持开发和生产环境吗？
**A:** 是的，在 Redirect URLs 中添加：
```
http://localhost:5173/*           # 开发环境
http://localhost:3000/*           # 备用开发端口
https://db-cscsteam.online/*      # 生产环境
```

### Q4: 如何查看当前的配置？
**A:** 在 Supabase 控制台查看：
- URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/url-configuration`

---

## 环境变量配置（前端）

确保生产环境的环境变量正确配置：

```env
# .env.production
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

---

## 验证配置正确性

配置完成后，检查以下内容：

### ✅ 检查清单

- [ ] Site URL 设置为 `https://db-cscsteam.online/`
- [ ] Redirect URLs 包含 `https://db-cscsteam.online/*`
- [ ] 前端环境变量配置正确
- [ ] 邮件模板使用 `{{ .ConfirmationURL }}` 变量
- [ ] 测试注册流程正常

---

## 联系支持

如果按照以上步骤操作后仍有问题，请检查：

1. **Supabase 项目设置**：确保项目处于活跃状态
2. **邮件服务配置**：确保 Supabase 邮件服务正常
3. **网络环境**：确保生产服务器可以访问 Supabase API

---

**配置完成后，用户注册邮件确认流程将正常工作！**

---

**文档维护**：潘大全 (pandq@chinacscs.com)
**最后更新**：2026-03-11
