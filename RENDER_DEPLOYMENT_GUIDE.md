# 中国家族树AI应用 - Render部署指南（小白版）

## 🎯 为什么选择Render？
- **最简单**：一站式解决服务器和数据库需求
- **免费**：提供足够小项目使用的免费额度
- **无需复杂配置**：支持Docker一键部署
- **自动HTTPS**：无需手动配置SSL证书
- **中文友好**：界面直观，操作简单

## 📋 准备工作

### 1. 注册账号
- 访问 [Render官网](https://render.com)
- 点击右上角「Sign Up」
- 可以用GitHub账号直接登录（推荐），或使用邮箱注册

### 2. 准备项目文件
确保你的项目包含以下关键文件：
- `Dockerfile`（我们已经创建好了）
- `docker-compose.yml`（作为参考）
- `server.js`（后端服务器）
- `schema.prisma`（数据库模型）
- `package.json`（项目依赖）

## 🚀 部署步骤

### 第1步：创建PostgreSQL数据库

1. 登录Render后，点击左上角的「New」按钮
2. 选择「PostgreSQL」
3. 填写数据库信息：
   - **Name**: `family-tree-db`
   - **Database**: `family_tree_db`
   - **User**: `family_user`
   - **Password**: 自动生成（记住这个密码）
   - **Region**: 选择靠近你的地区（如Singapore）
   - **Plan**: 选择「Free」
4. 点击「Create Database」
5. 等待数据库创建完成（约1-2分钟）

### 第2步：部署Web应用

1. 点击左上角的「New」按钮
2. 选择「Web Service」
3. 选择「Build and deploy from a Git repository」
4. 如果没有连接GitHub，先连接GitHub账号
5. 选择你的项目仓库
6. 填写应用信息：
   - **Name**: `family-tree-ai`
   - **Region**: 选择与数据库相同的地区
   - **Branch**: `main`（或你的主分支）
   - **Root Directory**: 留空（使用根目录）
   - **Environment**: `Docker`（Render会自动识别Dockerfile）
   - **Plan**: 选择「Free」
7. 点击「Advanced」展开高级选项

### 第3步：配置环境变量

在「Environment Variables」部分，点击「Add Environment Variable」，添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://family_user:[密码]@[数据库URL]:5432/family_tree_db?schema=public` | 数据库连接字符串 |
| `PORT` | `3000` | 应用运行端口 |
| `VITE_AI_API_KEY` | `你的API密钥` | AI服务的API密钥 |
| `VITE_AI_BASE_URL` | `https://api.deepseek.com` | AI服务的基础URL |
| `VITE_AI_MODEL` | `deepseek-chat` | AI模型名称 |

**注意**：
- 数据库密码和URL可以在Render的数据库详情页面找到
- 点击数据库实例，在「Connection String」部分复制完整的连接字符串

### 第4步：部署应用

1. 确认所有信息填写正确后，点击「Create Web Service」
2. Render会开始构建你的应用（约3-5分钟）
3. 等待构建状态变为「Live」

### 第5步：运行数据库迁移

1. 在应用详情页面，点击左侧的「Shell」选项
2. 在终端中输入以下命令：
   ```bash
   npx prisma generate && npx prisma migrate dev --name init
   ```
3. 等待迁移完成（约1-2分钟）

## 🌐 访问应用

1. 部署完成后，应用状态会显示为「Live」
2. 在应用详情页面顶部，你会看到一个URL（如：`https://family-tree-ai.onrender.com`）
3. 点击这个URL，即可访问你的中国家族树AI应用！

## 📊 免费额度说明

| 服务类型 | 免费额度 | 超出后的处理 |
|----------|----------|--------------|
| Web服务 | 750小时/月 | 自动停止 |
| PostgreSQL | 512MB存储空间 | 数据可能被清理 |
| 流量 | 无限制 | - |

## 🔧 常见问题解决

### 问题1：应用无法访问
- **检查**：应用状态是否为「Live」
- **解决**：查看「Logs」标签页，检查是否有错误信息

### 问题2：数据库连接失败
- **检查**：`DATABASE_URL`环境变量是否正确
- **解决**：重新复制数据库的连接字符串

### 问题3：AI功能不工作
- **检查**：API密钥是否正确配置
- **解决**：更新`VITE_AI_API_KEY`环境变量

### 问题4：构建失败
- **检查**：查看「Build Logs」了解具体错误
- **解决**：常见问题包括依赖安装失败，可尝试更新`package.json`

## 📱 应用使用

1. 打开应用后，你可以：
   - 创建和管理家族成员
   - 查看家族关系图
   - 使用AI助手获取家族历史建议
   - 查看应用日志

2. 首次使用时，需要先创建一些家族成员
3. 点击「AI助手」可以使用AI功能（需要有效的API密钥）

## 📈 升级建议

当你的应用用户增多时，可以考虑：
1. 升级到Render的付费计划（$7/月起）
2. 购买更多的数据库存储空间
3. 添加自定义域名

## 🆘 获取帮助

如果遇到问题，可以：
1. 查看Render的[官方文档](https://render.com/docs)
2. 搜索Render社区论坛
3. 检查应用的日志文件

---

## 🎉 恭喜！

你已经成功部署了中国家族树AI应用！

现在可以开始使用这个应用来管理你的家族信息，并利用AI功能获取更多 insights 了。

记得定期检查应用状态，确保它正常运行。如果有任何问题，随时可以参考本指南进行排查。

祝你使用愉快！