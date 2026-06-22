# 🎙️ CCTTS — Legado × MiMo TTS

**[中文]**
为 [Legado 阅读 App](https://github.com/gedoor/legado) 接入小米 MiMo-V2.5-TTS 语音合成引擎的代理服务。

一键部署到 Vercel，在手机 Legado App 中朗读小说，享受 MiMo 高保真中文语音。

## 功能

- ✅ **高质量中文 TTS** — 基于小米 MiMo-V2.5-TTS 模型
- ✅ **8 种内置音色** — 冰糖、茉莉（女声）、苏打、白桦（男声）、Mia、Chloe、Milo、Dean
- ✅ **句间静音控制** — 可调 200-3000ms 停顿时长，朗读更有节奏感
- ✅ **Legado 一键导入** — 扫码或复制链接，自动添加朗读引擎
- ✅ **在线试听** — 在浏览器中直接测试效果
- ✅ **密码保护** — 可选的页面访问密码（ACCESS_PASSWORD）
- ✅ **一键部署** — GitHub + Vercel，Push to Deploy

## 技术栈

- **框架**: Nuxt.js 3 (Vue 3 + Nitro Server)
- **样式**: Tailwind CSS
- **TTS 引擎**: 小米 MiMo-V2.5-TTS API
- **部署**: Vercel (Serverless Functions)

## 一键部署

### 准备工作

1. 在 [小米 MiMo 开放平台](https://platform.xiaomimimo.com) 注册账号并获取 **API Key**（当前限时免费）
2. 一个 [GitHub](https://github.com) 账号
3. 一个 [Vercel](https://vercel.com) 账号（GitHub 登录即可）

### 部署步骤

### 方式一：点击按钮一键部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xydwdy/cctts&env=MIMO_API_KEY)

点击上方按钮 → 填入 `MIMO_API_KEY` 环境变量 → 点击 Deploy → 等待部署完成 → 获得 `https://你的项目名.vercel.app` 域名

### 方式二：手动部署

1. Fork / Clone 本仓库
2. 在 Vercel 导入项目
3. 设置环境变量 `MIMO_API_KEY`
4. 部署
5. 获得域名

### 在 Legado 中配置

1. 打开 Legado 阅读 App
2. 进入 **设置** → **朗读设置** → **朗读引擎** → **添加朗读引擎**
3. 选择「网络导入」，粘贴本页面生成的导入链接
4. 或扫描二维码，按引导页操作完成导入

## 配置说明

| 环境变量 | 说明 | 获取地址 |
|---------|------|---------|
| `MIMO_API_KEY` | 小米 MiMo API Key | https://platform.xiaomimimo.com |
| `ACCESS_PASSWORD` | 页面访问密码（留空则无需密码） | 自定义 |

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（端口 3000）
npm run dev

# 构建
npm run build

# 预览
npm run preview
```

## 开源协议

MIT License

---

*本项目的代码开源在 GitHub，欢迎 Star 和贡献。*