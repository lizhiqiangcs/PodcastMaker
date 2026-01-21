# 快速开始指南

## 第一步：安装依赖（已完成）

依赖已经安装完成！

## 第二步：配置 Azure Blob Storage

由于你有 Blob Storage 权限，我们使用 `server-blob.js` 来实现完整的批量转录功能。

### 获取 Blob Storage 配置

1. 登录 [Azure Portal](https://portal.azure.com)
2. 找到你的 Storage Account
3. 在左侧菜单选择"访问密钥"（Access keys）
4. 复制以下信息：
   - **存储账户名称**（Storage account name）
   - **密钥** (key1 或 key2)

### 配置服务器

编辑 `server-blob.js` 文件（大约在第 12-14 行）：

```javascript
const AZURE_STORAGE_ACCOUNT_NAME = '你的存储账户名称';
const AZURE_STORAGE_ACCOUNT_KEY = '你的存储账户密钥';
const AZURE_STORAGE_CONTAINER_NAME = 'audio-files'; // 容器名称，可以自定义
```

## 第三步：启动服务器

```bash
node server-blob.js
```

你应该看到类似这样的输出：
```
服务器运行在 http://localhost:3000
请在浏览器中打开上述地址使用转录工具
Azure Blob Storage 已配置
```

## 第四步：使用应用

1. 打开浏览器访问 `http://localhost:3000`
2. 点击"选择音频文件"上传你的音频
3. 点击"开始转录"
4. 等待转录完成（会显示实时状态）
5. 转录完成后，结果会显示在页面上
6. 点击"下载文本"可以保存转录结果

## 工作流程

1. **上传音频** → 文件保存到本地 `uploads/` 目录
2. **上传到 Blob** → 文件自动上传到 Azure Blob Storage
3. **创建转录任务** → 调用 Azure Batch Transcription API
4. **轮询状态** → 前端每 5 秒检查一次转录状态
5. **获取结果** → 转录完成后下载并保存到 `transcripts/` 目录
6. **显示结果** → 在网页上显示转录文本

## 功能说明

✅ **说话人分离**：自动识别最多 2 位说话人
✅ **时间戳**：每句话都有时间信息
✅ **标点符号**：自动添加标点
✅ **本地保存**：转录结果保存到 `transcripts/` 目录
✅ **在线显示**：实时在网页上查看结果

## 支持的音频格式

- WAV
- MP3
- M4A
- FLAC
- OGG
- 等其他常见格式

## 转录语言

当前设置为中文（zh-CN），如需修改，编辑 `server-blob.js` 中的 `locale` 字段。

支持的语言包括：
- zh-CN：简体中文
- zh-TW：繁体中文
- en-US：英语（美国）
- ja-JP：日语
- ko-KR：韩语
- 等更多...

## 故障排除

### 问题：Blob Storage 未配置

**解决**：检查 `server-blob.js` 中的配置是否正确填写。

### 问题：转录一直处于 Running 状态

**原因**：Azure 批量转录需要一些时间，根据音频长度不同，可能需要几分钟到十几分钟。

**解决**：耐心等待，或检查 Azure Portal 中的转录任务状态。

### 问题：上传失败

**解决**：
1. 检查音频文件大小是否超过 500MB
2. 检查网络连接
3. 查看服务器控制台的错误信息

### 问题：转录结果为空

**解决**：
1. 确认音频文件包含清晰的语音
2. 检查音频语言是否为中文
3. 尝试使用标准的音频格式（如 WAV 或 MP3）

## 高级配置

### 修改说话人数量

编辑 `server-blob.js` 中的 `createBatchTranscription` 函数：

```javascript
diarization: {
    speakers: {
        minCount: 1,
        maxCount: 2  // 修改这里，最大支持 10 位说话人
    }
}
```

### 修改服务器端口

编辑 `server-blob.js`：

```javascript
const PORT = 3000; // 修改为你想要的端口
```

## 替代方案

如果不想使用 Blob Storage，可以使用本地 SDK 版本：

```bash
node server-sdk.js
```

注意：SDK 版本对音频格式要求更严格，推荐使用 WAV 格式。
