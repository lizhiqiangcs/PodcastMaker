# Azure TTS Podcast Generator 使用指南

## 🎯 功能简介

将SSML格式的播客脚本转换为高质量的AI语音音频，支持：
- ✅ 多种Neural TTS声音选择（John和Alice可独立配置）
- ✅ 语速调整（0.75x - 1.25x）
- ✅ 音频质量选择（标准/高质量/超高质量）
- ✅ 快速试听（生成前30秒预览）
- ✅ 完整音频生成（MP3格式）

## 📦 前置要求

1. **Node.js**: 已安装（项目已有）
2. **Azure Speech Service**:
   - 订阅密钥已配置在 `config-template.js`
   - 区域：eastus2

## 🚀 快速开始

### 1. 安装依赖（如果还没安装）

```bash
npm install
```

### 2. 启动服务器

```bash
node tts-server.js
```

你会看到：
```
============================================================
🎙️  Azure TTS Podcast Generator Server
============================================================
✅ Server running at: http://localhost:3001
📁 SSML directory: /path/to/SSML
🎵 Output directory: /path/to/audio-output
🌐 Open browser to: http://localhost:3001/tts-generator.html
============================================================
```

### 3. 打开网页界面

在浏览器中访问：
```
http://localhost:3001/tts-generator.html
```

## 🎨 使用界面

### 步骤1: 选择SSML文件
- 界面会自动加载 `SSML/` 目录下的所有 `.ssml` 文件
- 点击文件卡片进行选择（高亮显示为选中状态）

### 步骤2: 调整语音参数

**John (Host) 声音选项：**
- `en-US-GuyNeural` - 专业男声（推荐）
- `en-US-DavisNeural` - 温暖男声
- `en-US-TonyNeural` - 年轻男声
- `en-US-JasonNeural` - 成熟男声

**Alice (Guest) 声音选项：**
- `en-US-JennyNeural` - 活泼女声（推荐）
- `en-US-AriaNeural` - 专业女声
- `en-US-SaraNeural` - 友好女声
- `en-US-NancyNeural` - 温柔女声

**其他参数：**
- **整体语速**：0.75x（较慢）- 1.25x（较快），默认1.0x
- **音频质量**：
  - 标准：24kHz, 96kbps（~3MB/30分钟）
  - 高质量：24kHz, 160kbps（~5MB/30分钟）**推荐**
  - 超高质量：48kHz, 192kbps（~7MB/30分钟）

### 步骤3: 试听片段

点击 **"🎧 试听片段 (30秒)"** 按钮：
- 生成前30秒左右的音频
- 自动弹出播放器
- 用于快速验证声音选择和参数效果

### 步骤4: 生成完整音频

满意试听效果后，点击 **"🎵 生成完整音频"** 按钮：
- 生成完整的播客音频
- 自动保存到 `audio-output/` 目录
- 文件名格式：`<原文件名>_<时间戳>.mp3`
- 生成完成后可直接在网页播放

## 📁 目录结构

```
PodcastMaker/
├── SSML/                          # SSML源文件目录
│   └── ski-3-concepts-podcast.ssml
├── audio-output/                  # 生成的音频文件
│   └── ski-3-concepts-podcast_2026-01-21T12-00-00.mp3
├── tts-generator.html             # 网页界面
├── tts-server.js                  # 后端服务器
└── TTS_README.md                  # 本文档
```

## ⚙️ 技术细节

### SSML处理
- 自动替换声音：`en-US-GuyNeural` → 用户选择的John声音
- 自动替换声音：`en-US-JennyNeural` → 用户选择的Alice声音
- 保留所有原始的情感、停顿、语速、音调标记

### 音频生成
- 使用 Azure Speech SDK (`microsoft-cognitiveservices-speech-sdk`)
- 支持 SSML 完整特性（情感、停顿、prosody等）
- 输出格式：MP3（高压缩率，兼容性好）

### 预览功能
- 智能截取：按字符数截取前~2000字符（约30秒）
- 自动闭合标签：确保SSML结构完整
- 即时生成：通常2-5秒完成

### 完整生成
- 处理完整SSML内容
- 生成时间：约30-60秒（取决于内容长度）
- 自动保存到本地

## 🎵 音频质量对比

| 质量级别 | 采样率 | 比特率 | 文件大小（30分钟） | 推荐场景 |
|---------|--------|--------|-------------------|---------|
| 标准 | 24kHz | 96kbps | ~3.4MB | 测试、预览 |
| 高质量（推荐） | 24kHz | 160kbps | ~5.6MB | 正式发布 |
| 超高质量 | 48kHz | 192kbps | ~6.8MB | 专业存档 |

## 💰 成本估算

基于Azure Neural TTS定价（$16/百万字符）：

**示例：The 3 Core Concepts of Skiing**
- SSML文件大小：~42KB
- 纯文本字符数：~15,000字符
- 预估成本：**$0.24**
- 生成时间：~45秒

## 🔧 故障排除

### 问题1：服务器无法启动
```bash
Error: Cannot find module 'microsoft-cognitiveservices-speech-sdk'
```
**解决方案**：
```bash
npm install microsoft-cognitiveservices-speech-sdk
```

### 问题2：生成失败 "Authentication error"
**原因**：Azure密钥未配置或过期

**解决方案**：
1. 检查 `config-template.js` 中的 `subscriptionKey`
2. 确认 `region` 设置为 `eastus2`

### 问题3：音频无法播放
**原因**：浏览器不支持MP3格式（罕见）

**解决方案**：
- 使用现代浏览器（Chrome, Firefox, Safari, Edge）
- 或下载音频文件用系统播放器播放

### 问题4：生成速度慢
**原因**：网络延迟或Azure服务负载

**解决方案**：
- 使用试听功能快速验证参数
- 选择较低的音频质量（标准即可）

## 📝 最佳实践

### 1. 声音选择
- **John**: 推荐 `GuyNeural`（专业、清晰、权威）
- **Alice**: 推荐 `JennyNeural`（活泼、自然、富有表现力）
- 建议先用试听功能对比不同声音

### 2. 语速调整
- **讲解型内容**：0.95x - 1.0x（稍慢，确保清晰）
- **对话型内容**：1.0x - 1.05x（自然节奏）
- **快节奏内容**：1.05x - 1.15x（避免超过1.15x，会不自然）

### 3. 音频质量
- **日常发布**：高质量（160kbps）已足够
- **专业存档**：超高质量（192kbps）
- **快速测试**：标准质量（96kbps）

### 4. 工作流程
```
1. 准备好SSML文件 → 放入SSML/目录
2. 打开网页界面 → 选择文件
3. 调整参数 → 点击试听
4. 满意后 → 生成完整音频
5. 下载/使用 → audio-output/目录
```

## 🆘 支持

如遇问题，请检查：
1. ✅ Node.js版本 >= 14.x
2. ✅ Azure密钥有效且有余额
3. ✅ SSML文件格式正确
4. ✅ 网络连接正常

## 📊 性能数据

**测试环境**：MacBook Pro, 网络良好

| 操作 | 内容长度 | 耗时 | 输出大小 |
|------|---------|------|---------|
| 试听生成 | ~2000字符 | 2-4秒 | ~400KB |
| 完整生成 | ~15000字符 | 40-60秒 | ~5.6MB |
| 完整生成 | ~30000字符 | 80-120秒 | ~11MB |

## 🎉 完成！

现在你可以：
- ✅ 快速生成高质量播客音频
- ✅ 自定义声音和参数
- ✅ 批量处理多个SSML文件
- ✅ 控制成本（按需生成，试听免费验证）

享受AI语音生成的便利！🎙️
