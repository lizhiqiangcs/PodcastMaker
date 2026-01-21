# 音频转录工具

这是一个本地网页应用，可以上传音频文件并使用 Azure Speech Service 进行批量转录，支持说话人分离功能。

## 功能特点

- 🎙️ 上传音频文件（支持多种格式）
- 🤖 使用 Azure Speech Service 进行转录
- 👥 自动识别说话人（最多 2 位说话人）
- 💾 保存转录结果到本地文件
- 🌐 在网页上显示转录结果
- ⬇️ 下载转录文本文件

## 安装步骤

1. 安装依赖：
```bash
npm install
```

## 使用方法

### 方式一：使用 Azure Batch Transcription API + Blob Storage（推荐）

这是标准的 Azure 批量转录方案，支持说话人分离功能。

**配置步骤：**

1. 在 Azure Portal 获取你的 Blob Storage 配置信息：
   - Storage Account Name（存储账户名称）
   - Storage Account Key（存储账户密钥）

2. 编辑 `server-blob.js`，填入你的配置：
```javascript
const AZURE_STORAGE_ACCOUNT_NAME = 'your-storage-account-name';
const AZURE_STORAGE_ACCOUNT_KEY = 'your-storage-account-key';
```

3. 启动服务器：
```bash
node server-blob.js
```

### 方式二：使用 Azure Speech SDK（本地处理）

这个方法可以直接在本地处理音频文件，不需要 Blob Storage。

启动服务器：
```bash
node server-sdk.js
```

**注意**：SDK 方式可能对音频格式有更严格的要求（推荐使用 WAV 格式）。

## 访问应用

打开浏览器访问：
```
http://localhost:3000
```

## 使用说明

1. 点击"选择音频文件"按钮上传音频
2. 点击"开始转录"按钮
3. 等待转录完成（根据音频长度，可能需要几分钟）
4. 转录完成后，结果会显示在页面上
5. 点击"下载文本"可以下载转录结果

## 文件说明

- `public/index.html` - 前端网页界面
- `server.js` - 使用 REST API 的后端服务器（需要公网 URL）
- `server-sdk.js` - 使用 Speech SDK 的后端服务器（推荐）
- `uploads/` - 上传的音频文件存储目录
- `transcripts/` - 转录结果文本文件存储目录

## Azure 配置信息

**重要：** 配置信息通过环境变量管理，不直接写在代码中。

### 配置步骤：

1. 复制 `.env.example` 为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入你的 Azure 配置：
   ```bash
   AZURE_SPEECH_KEY=your_azure_speech_key_here
   AZURE_SPEECH_REGION=eastus2
   AZURE_SPEECH_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com
   ```

3. `.env` 文件已加入 `.gitignore`，不会被提交到 Git

## 说话人分离设置

已配置：
- 启用 Speaker Diarization
- 最大说话人数：2
- 自动识别不同说话人

## 支持的音频格式

- WAV
- MP3
- M4A
- FLAC
- 等常见音频格式

## 注意事项

1. 音频文件大小限制：500MB
2. 转录语言设置为中文（zh-CN），可在代码中修改
3. 转录结果会自动保存到 `transcripts/` 目录
4. 上传的音频文件会保存在 `uploads/` 目录

## 故障排除

### 使用 SDK 版本时的常见问题

1. **音频格式不支持**：确保音频文件是 WAV 格式，如果不是，可以使用 ffmpeg 转换：
```bash
ffmpeg -i input.mp3 -acodec pcm_s16le -ar 16000 output.wav
```

2. **转录失败**：检查 Azure API Key 和 Region 是否正确

### 使用 REST API 版本时的常见问题

1. **Azure 无法访问音频文件**：确保 ngrok 正在运行，并且 URL 已更新到代码中
2. **转录一直处于运行状态**：检查 Azure 服务状态和网络连接

## 技术栈

- 前端：HTML5, CSS3, JavaScript
- 后端：Node.js, Express
- Azure：Speech Service (Batch Transcription API / Speech SDK)
- 文件上传：Multer

## 开发说明

如需修改配置，请编辑对应的服务器文件：
- 修改语言：更改 `locale` 或 `speechRecognitionLanguage`
- 修改说话人数量：更改 `diarization.speakers.maxCount`
- 修改端口：更改 `PORT` 变量
