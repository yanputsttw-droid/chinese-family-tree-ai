# 飞牛NAS部署指南：中国家谱AI应用

## 准备工作

1. 确保您的飞牛NAS已安装并启用Docker功能
2. 在NAS上创建一个目录用于存放项目文件，例如：`/volume1/docker/family-tree-ai`
3. 将项目文件上传到该目录

## 配置说明

### 1. 配置API密钥

在部署前，您需要配置AI API密钥：

1. 打开 `docker-compose.yml` 文件
2. 将 `your_api_key_here` 替换为您的实际DeepSeek API密钥
3. 可选：根据需要调整其他配置参数

### 2. 环境变量配置

项目使用 `.env.local` 文件存储环境变量：

```
# AI API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
VITE_AI_API_KEY=your_deepseek_api_key_here
VITE_AI_BASE_URL=https://api.deepseek.com
VITE_AI_MODEL=deepseek-chat

# Database Configuration
DATABASE_URL=postgresql://family_user:family_password@db:5432/family_tree_db?schema=public
PORT=3000
```

## 部署方法一：通过飞牛NAS Web界面部署（推荐）

### 1. 登录飞牛NAS Web界面

- 打开浏览器，输入飞牛NAS的IP地址（如：`http://your_nas_ip:5000`）
- 输入用户名和密码登录

### 2. 打开Docker应用

- 在应用列表中找到并打开「Docker」应用

### 3. 创建项目网络（首次部署）

1. 点击左侧菜单的「网络」
2. 点击「添加」按钮
3. 网络名称：`family_net`
4. 驱动：`bridge`
5. 点击「确定」创建网络

### 4. 部署应用堆栈

1. 点击左侧菜单的「堆栈」
2. 点击「添加」按钮
3. 选择「上传docker-compose.yml文件」
4. 浏览并选择您上传到NAS的`docker-compose.yml`文件
5. 堆栈名称：`family-tree-ai`
6. 点击「确定」开始部署

### 5. 等待部署完成

- 部署过程可能需要几分钟时间（取决于NAS性能和网络速度）
- 您可以在「堆栈」页面查看部署进度和状态

### 6. 初始化数据库

首次部署需要初始化数据库：

1. 点击左侧菜单的「容器」
2. 找到名为`family_tree_app`的容器
3. 点击右侧的「详情」按钮
4. 切换到「终端」标签页
5. 点击「添加」按钮打开终端
6. 在终端中输入以下命令：

```bash
npx prisma generate && npx prisma migrate dev --name init
```

7. 按下回车执行命令

### 7. 访问应用

部署完成后，您可以通过以下地址访问应用：

```
http://your_nas_ip:9595
```

## 部署方法二：通过SSH命令行部署

### 1. 通过SSH连接到飞牛NAS

```bash
ssh admin@your_nas_ip
```

### 2. 进入项目目录

```bash
cd /volume1/docker/family-tree-ai
```

### 3. 启动Docker容器

```bash
docker-compose up -d
```

### 4. 初始化数据库

首次部署需要初始化数据库：

```bash
docker-compose exec app sh -c "npx prisma generate && npx prisma migrate dev --name init"
```

### 5. 访问应用

部署完成后，您可以通过以下地址访问应用：

```
http://your_nas_ip:9595
```

## 管理命令

### 查看容器状态

```bash
docker-compose ps
```

### 查看应用日志

```bash
docker-compose logs -f app
```

### 查看数据库日志

```bash
docker-compose logs -f db
```

### 停止应用

```bash
docker-compose down
```

### 重新启动应用

```bash
docker-compose restart
```

## 数据备份

### 备份数据库

```bash
docker-compose exec db pg_dump -U family_user family_tree_db > backup.sql
```

### 恢复数据库

```bash
docker-compose exec -T db psql -U family_user family_tree_db < backup.sql
```

## 注意事项

1. 首次部署时，数据库会自动创建，无需手动创建数据库
2. 数据会持久化存储在 `postgres_data` 目录中，请定期备份该目录
3. 如果需要修改端口号，请同时更新 `docker-compose.yml` 中的端口映射
4. AI功能需要有效的API密钥才能正常使用

## 常见问题

### 镜像拉取失败（401 Unauthorized错误）
- **问题**：`failed to resolve source metadata for docker.io/library/node:18-alpine: unexpected status from HEAD request to `https://docker.fnnas.com/v2/library/node/manifests/18-alpine?ns=docker.io:`  401 Unauthorized`
- **解决方案**：
  1. 我们已经将Dockerfile从使用Node.js 18-alpine简化为Node.js 16-alpine
  2. 同时简化了docker-compose.yml配置
  3. 请重新部署应用堆栈

### 应用无法访问
- 检查容器状态：`docker-compose ps`
- 检查端口是否开放：在NAS管理界面的防火墙设置中确认9595端口已开放
- 查看应用日志：`docker-compose logs -f app`

### 数据库连接错误
- 检查数据库容器：`docker-compose ps db`
- 查看数据库日志：`docker-compose logs -f db`

### AI功能不工作
- 确认API密钥是否正确配置
- 检查网络连接：容器需要能够访问外部API

## 更新应用

1. 停止当前应用：`docker-compose down`
2. 更新项目文件到最新版本
3. 重新构建并启动应用：`docker-compose up -d --build`
4. 运行数据库迁移（如果有）：`docker-compose exec app sh -c "npx prisma migrate dev"`

---

祝您使用愉快！