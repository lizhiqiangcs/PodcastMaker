# SSML文件说明

这个目录用于存放准备转换为语音的SSML文件。

## 📁 当前文件

- `ski-3-concepts-podcast.ssml` - The 3 Core Concepts of Skiing 播客

## 🎙️ 如何使用

### 方法1: 使用网页界面（推荐）

1. 启动TTS服务器：
```bash
npm run tts
```

2. 打开浏览器访问：
```
http://localhost:3001/tts-generator.html
```

3. 在网页中选择SSML文件，调整参数，生成音频

### 方法2: 直接使用Azure SDK

参考项目根目录的实现代码。

## ✨ SSML特性

当前SSML文件包含的优化：

- ✅ **双声音配置**：John (GuyNeural) 和 Alice (JennyNeural)
- ✅ **情感表达**：cheerful, excited, friendly, newscast等风格
- ✅ **精确停顿**：句子间、段落间、对话切换的停顿
- ✅ **语速调整**：关键段落的语速变化（±10%）
- ✅ **音调变化**：问句、惊叹、强调的音调调整（±20%）
- ✅ **强调标记**：重要术语和概念的emphasis标记

## 🎯 效果预期

使用Azure Neural TTS生成的音频质量：
- **自然度**: 7.5-8/10
- **笑声效果**: 5-6/10（听起来是"说的Ha"，不是真笑）
- **对话流畅度**: 8/10（有明显的停顿和节奏感）
- **情感表达**: 7/10（通过风格和音调变化传达情感）

## 📝 添加新文件

将新的SSML文件放入此目录即可，网页界面会自动识别。

SSML文件要求：
- 文件扩展名：`.ssml`
- XML格式正确
- 包含完整的 `<speak>` 标签
- 使用支持的Azure Neural TTS声音

## 🔧 声音列表

**推荐的男声（John）**：
- en-US-GuyNeural - 专业、清晰
- en-US-DavisNeural - 温暖、友好
- en-US-TonyNeural - 年轻、活力

**推荐的女声（Alice）**：
- en-US-JennyNeural - 活泼、自然
- en-US-AriaNeural - 专业、精准
- en-US-SaraNeural - 友好、温和

完整列表见：[Azure Neural Voices](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts)
