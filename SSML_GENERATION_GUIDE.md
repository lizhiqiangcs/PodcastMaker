# 📝 SSML生成完全指南

## 目录
1. [快速开始](#快速开始)
2. [SSML基础结构](#ssml基础结构)
3. [Azure Neural TTS标签详解](#azure-neural-tts标签详解)
4. [自然度优化技巧](#自然度优化技巧)
5. [参数推荐值](#参数推荐值)
6. [自动化生成脚本](#自动化生成脚本)

---

## 快速开始

### 从Markdown Transcript生成SSML的步骤

**输入格式**（Markdown Transcript）：
```markdown
**John**: Welcome back to Ski Mastery Podcast! I'm John, and today we have Alice with us.

**Alice**: Hi everyone! I'm so excited to be here.
```

**输出格式**（SSML）：
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">

  <voice name="en-US-GuyNeural">
    <prosody rate="+23%">
      Welcome back to Ski Mastery Podcast! I'm John, and today we have Alice with us.
    </prosody>
  </voice>

  <voice name="en-US-JennyNeural">
    <prosody rate="+21%">
      Hi everyone! I'm so excited to be here.
    </prosody>
  </voice>

</speak>
```

---

## SSML基础结构

### 最小SSML模板

```xml
<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">

  <voice name="en-US-GuyNeural">
    <prosody rate="+23%">
      你的内容在这里
    </prosody>
  </voice>

</speak>
```

### 结构说明

| 元素 | 必需 | 说明 |
|------|------|------|
| `<?xml>` | 可选 | XML声明，建议添加 |
| `<speak>` | **必需** | 根元素，必须包含所有内容 |
| `xmlns:mstts` | **必需** | Azure特有命名空间，用于express-as |
| `<voice>` | **必需** | 指定说话者声音 |
| `<prosody>` | 推荐 | 控制语速、音调、音量 |

---

## Azure Neural TTS标签详解

### 1. `<voice>` - 声音选择

**语法**：
```xml
<voice name="声音名称">内容</voice>
```

**推荐声音**：

| 角色 | 声音名称 | 特点 | 适用场景 |
|------|----------|------|----------|
| 男主持 | `en-US-GuyNeural` | 专业、清晰 | 主持人、讲解者 |
| 女主持 | `en-US-JennyNeural` | 活泼、自然 | 主持人、嘉宾 |
| 男嘉宾 | `en-US-DavisNeural` | 温暖、友好 | 嘉宾、访谈对象 |
| 女嘉宾 | `en-US-AriaNeural` | 专业、精准 | 专家、教师 |

### 2. `<prosody>` - 语音属性调整

**语法**：
```xml
<prosody rate="语速" pitch="音调" volume="音量">内容</prosody>
```

#### 参数详解

**rate（语速）**：
```xml
<!-- 相对值（推荐） -->
<prosody rate="+23%">快23%</prosody>
<prosody rate="-10%">慢10%</prosody>

<!-- 绝对值 -->
<prosody rate="fast">快速</prosody>
<prosody rate="slow">慢速</prosody>
```

**pitch（音调）**：
```xml
<!-- 相对值（推荐） -->
<prosody pitch="+15%">高15%</prosody>
<prosody pitch="-10%">低10%</prosody>

<!-- 绝对值 -->
<prosody pitch="high">高音</prosody>
<prosody pitch="low">低音</prosody>
```

**volume（音量）**：
```xml
<prosody volume="+10dB">大声</prosody>
<prosody volume="-5dB">小声</prosody>
<prosody volume="loud">响亮</prosody>
<prosody volume="soft">轻柔</prosody>
```

### 3. `<break>` - 停顿控制

**语法**：
```xml
<break time="时长"/>
```

**⚠️ 重要规则**：
- `<break>` **必须**在 `<voice>` 标签内，不能在根级别
- 时长单位：`ms`（毫秒）或 `s`（秒）

**示例**：
```xml
<voice name="en-US-GuyNeural">
  <prosody rate="+23%">
    Hello!
    <break time="300ms"/>
    How are you?
  </prosody>
</voice>
```

### 4. `<mstts:express-as>` - 情感风格（Azure专属）

**语法**：
```xml
<mstts:express-as style="风格" styledegree="强度">内容</mstts:express-as>
```

**可用风格**：

| 风格 | 说明 | 适用场景 |
|------|------|----------|
| `cheerful` | 开心、愉快 | 欢迎、庆祝、积极内容 |
| `excited` | 兴奋、激动 | 惊喜、重大发现 |
| `friendly` | 友好、亲切 | 日常对话 |
| `newscast` | 新闻播报 | 专业讲解、知识分享 |
| `newscast-casual` | 轻松播报 | 播客主持 |
| `customerservice` | 客服风格 | 解答问题 |

**styledegree（强度）**：
- 范围：`0.01` - `2.0`
- 推荐：`0.8` - `1.1`（太高会显得做作）
- 默认：`1.0`

**示例**：
```xml
<mstts:express-as style="cheerful" styledegree="0.9">
  <prosody pitch="+10%">That's amazing!</prosody>
</mstts:express-as>
```

### 5. `<emphasis>` - 强调重点

**语法**：
```xml
<emphasis level="级别">要强调的内容</emphasis>
```

**级别**：
- `strong` - 强烈强调
- `moderate` - 中等强调
- `reduced` - 减弱强调

**示例**：
```xml
The <emphasis level="strong">DIRT</emphasis> framework is essential.
```

---

## 自然度优化技巧

### ✅ 推荐做法

#### 1. **合理的停顿时长**

```xml
<!-- ✅ 好的停顿设置 -->
<voice name="en-US-GuyNeural">
  <prosody rate="+23%">
    This is a sentence.
    <break time="300ms"/>  <!-- 句子间 -->
    This is another one.
    <break time="200ms"/>  <!-- 短语间 -->
    And here's more.
  </prosody>
</voice>
```

**停顿时长参考表**：

| 位置 | 推荐时长 | 说明 |
|------|----------|------|
| 逗号后 | 不需要 | 靠语速自然停顿 |
| 句号后 | 200-300ms | 正常句子间隔 |
| 问号/感叹号后 | 250-350ms | 稍长停顿 |
| 对话切换 | 不需要 | 不同voice自带间隔 |
| 段落间 | 350-500ms | 主题切换 |
| 章节间 | 500-700ms | 大段落切换 |

#### 2. **语速设置**

```xml
<!-- ✅ 自然的语速 -->
<voice name="en-US-GuyNeural">
  <prosody rate="+23%">  <!-- 主持人：稍快 -->
    Welcome to the show!
  </prosody>
</voice>

<voice name="en-US-JennyNeural">
  <prosody rate="+21%">  <!-- 嘉宾：接近主持人 -->
    Thanks for having me!
  </prosody>
</voice>
```

**语速建议**：
- **快节奏播客**：+20% ~ +25%
- **正常对话**：+10% ~ +20%
- **教学内容**：+5% ~ +10%
- **朗读文章**：0% ~ +5%

#### 3. **情感表达要克制**

```xml
<!-- ✅ 好的情感表达（克制） -->
<mstts:express-as style="cheerful" styledegree="0.9">
  I'm so happy to hear that!
</mstts:express-as>

<!-- ❌ 避免过度（会显得做作） -->
<mstts:express-as style="cheerful" styledegree="2.0">
  I'm so happy to hear that!
</mstts:express-as>
```

#### 4. **音调调整要适度**

```xml
<!-- ✅ 适度的音调变化 -->
<prosody pitch="+10%">Really?</prosody>  <!-- 问句稍高 -->
<prosody pitch="+15%">Wow!</prosody>     <!-- 惊叹稍高 -->

<!-- ❌ 避免过大变化 -->
<prosody pitch="+50%">Really?</prosody>  <!-- 太夸张 -->
```

### ❌ 避免的做法

```xml
<!-- ❌ 不要：根级别的break -->
</voice>
<break time="500ms"/>  <!-- 错误：不在voice内 -->
<voice name="...">

<!-- ❌ 不要：过多的prosody嵌套 -->
<prosody rate="+10%">
  <prosody pitch="+5%">
    <prosody volume="+3dB">
      太复杂了！
    </prosody>
  </prosody>
</prosody>

<!-- ❌ 不要：过长的停顿 -->
<break time="3000ms"/>  <!-- 3秒太长！ -->

<!-- ❌ 不要：每个单词都强调 -->
<emphasis>This</emphasis> <emphasis>is</emphasis>
<emphasis>too</emphasis> <emphasis>much</emphasis>!
```

---

## 参数推荐值

### 快速参考表

| 场景 | rate | pitch | break | styledegree |
|------|------|-------|-------|-------------|
| **快节奏播客** | +20~25% | 0~+5% | 200-350ms | 0.8-1.0 |
| **轻松对话** | +15~20% | 0~+5% | 250-400ms | 0.9-1.1 |
| **专业讲解** | +10~15% | 0% | 300-500ms | 1.0 |
| **教学内容** | +5~10% | 0% | 350-600ms | 1.0 |
| **严肃新闻** | +5~10% | -5~0% | 400-700ms | 1.0-1.2 |

### 声音配对建议

| 组合 | John声音 | Alice声音 | 风格 |
|------|----------|-----------|------|
| **活力播客** | GuyNeural (+23%) | JennyNeural (+21%) | cheerful/friendly |
| **专业讲解** | DavisNeural (+15%) | AriaNeural (+15%) | newscast |
| **轻松访谈** | GuyNeural (+18%) | SaraNeural (+18%) | friendly |

---

## 自动化生成脚本

### 方法1：从Markdown自动生成SSML

创建 `generate-ssml.js`：

```javascript
#!/usr/bin/env node

const fs = require('fs');

// 读取markdown transcript
const markdown = fs.readFileSync('transcript.md', 'utf-8');

// 解析对话
const lines = markdown.split('\n');
let ssml = `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
`;

const voices = {
  'John': 'en-US-GuyNeural',
  'Alice': 'en-US-JennyNeural'
};

const speeds = {
  'John': '+23%',
  'Alice': '+21%'
};

for (const line of lines) {
  // 匹配 **John**: 或 **Alice**: 格式
  const match = line.match(/\*\*(\w+)\*\*:\s*(.+)/);

  if (match) {
    const [_, speaker, text] = match;
    const voice = voices[speaker];
    const speed = speeds[speaker];

    if (voice) {
      // 清理文本（转义XML特殊字符）
      const cleanText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .trim();

      ssml += `
  <voice name="${voice}">
    <prosody rate="${speed}">
      ${cleanText}
    </prosody>
  </voice>
`;
    }
  }
}

ssml += '\n</speak>';

// 保存SSML文件
fs.writeFileSync('output.ssml', ssml, 'utf-8');
console.log('✅ SSML生成完成：output.ssml');
```

**使用方法**：
```bash
node generate-ssml.js
```

### 方法2：增强版（添加自动停顿和情感）

创建 `generate-ssml-enhanced.js`：

```javascript
#!/usr/bin/env node

const fs = require('fs');

// 配置
const config = {
  voices: {
    'John': { name: 'en-US-GuyNeural', speed: '+23%' },
    'Alice': { name: 'en-US-JennyNeural', speed: '+21%' }
  },
  // 自动情感检测关键词
  emotions: {
    'cheerful': ['excited', 'happy', 'great', 'wonderful', 'amazing', '!'],
    'friendly': ['welcome', 'hello', 'hi', 'thanks'],
    'newscast': ['first', 'second', 'important', 'key', 'framework']
  },
  // 停顿规则
  breaks: {
    '.': '300ms',
    '?': '300ms',
    '!': '300ms',
    '...': '400ms'
  }
};

// 检测情感
function detectEmotion(text) {
  for (const [emotion, keywords] of Object.entries(config.emotions)) {
    if (keywords.some(kw => text.toLowerCase().includes(kw))) {
      return emotion;
    }
  }
  return null;
}

// 添加停顿
function addBreaks(text) {
  let result = text;
  for (const [punct, time] of Object.entries(config.breaks)) {
    const regex = new RegExp(`\\${punct} `, 'g');
    result = result.replace(regex, `${punct} <break time="${time}"/> `);
  }
  return result;
}

// 强调专业术语
function emphasizeTerms(text) {
  const terms = ['DIRT', 'CAP', 'VAK', 'pressure control', 'edging'];
  let result = text;

  for (const term of terms) {
    const regex = new RegExp(`\\b(${term})\\b`, 'gi');
    result = result.replace(regex, '<emphasis level="moderate">$1</emphasis>');
  }

  return result;
}

// 主函数
function generateSSML(markdownFile) {
  const markdown = fs.readFileSync(markdownFile, 'utf-8');
  const lines = markdown.split('\n');

  let ssml = `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
`;

  for (const line of lines) {
    const match = line.match(/\*\*(\w+)\*\*:\s*(.+)/);

    if (match) {
      const [_, speaker, rawText] = match;
      const voiceConfig = config.voices[speaker];

      if (voiceConfig) {
        // 处理文本
        let text = rawText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

        // 添加增强
        text = emphasizeTerms(text);
        text = addBreaks(text);

        // 检测情感
        const emotion = detectEmotion(text);

        ssml += `
  <voice name="${voiceConfig.name}">
    <prosody rate="${voiceConfig.speed}">`;

        if (emotion) {
          ssml += `
      <mstts:express-as style="${emotion}" styledegree="0.9">
        ${text}
      </mstts:express-as>`;
        } else {
          ssml += `
      ${text}`;
        }

        ssml += `
    </prosody>
  </voice>
`;
      }
    }
  }

  ssml += '\n</speak>';

  return ssml;
}

// 运行
const inputFile = process.argv[2] || 'transcript.md';
const outputFile = process.argv[3] || 'output.ssml';

const ssml = generateSSML(inputFile);
fs.writeFileSync(outputFile, ssml, 'utf-8');

console.log(`✅ SSML生成完成：${outputFile}`);
console.log(`📝 从 ${inputFile} 生成`);
```

**使用方法**：
```bash
node generate-ssml-enhanced.js input.md output.ssml
```

### 方法3：批量生成

创建 `batch-generate-ssml.js`：

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const transcriptDir = './transcripts';
const outputDir = './SSML';

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 获取所有markdown文件
const files = fs.readdirSync(transcriptDir)
  .filter(f => f.endsWith('.md'))
  .filter(f => f.includes('podcast'));

console.log(`找到 ${files.length} 个transcript文件\n`);

for (const file of files) {
  const inputPath = path.join(transcriptDir, file);
  const outputPath = path.join(outputDir, file.replace('.md', '.ssml'));

  console.log(`处理: ${file}`);

  // 这里调用你的生成函数
  // const ssml = generateSSML(inputPath);
  // fs.writeFileSync(outputPath, ssml, 'utf-8');

  console.log(`✅ 生成: ${path.basename(outputPath)}\n`);
}

console.log('🎉 批量生成完成！');
```

---

## 完整示例

### 输入：Markdown Transcript

```markdown
# Ski Mastery Podcast - Episode 1

**John**: Welcome back to Ski Mastery Podcast! I'm John.

**Alice**: Hi everyone! I'm Alice. I'm excited to learn about the three core concepts today.

**John**: Let's start with the first one - DIRT framework. It's a game-changer.

**Alice**: Really? Tell me more!
```

### 输出：优化的SSML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">

  <voice name="en-US-GuyNeural">
    <prosody rate="+23%">
      <mstts:express-as style="friendly" styledegree="0.9">
        Welcome back to Ski Mastery Podcast!
        <break time="300ms"/>
        I'm John.
      </mstts:express-as>
    </prosody>
  </voice>

  <voice name="en-US-JennyNeural">
    <prosody rate="+21%">
      <mstts:express-as style="cheerful" styledegree="0.9">
        Hi everyone!
        <break time="200ms"/>
        I'm Alice.
        <break time="300ms"/>
        I'm excited to learn about the three core concepts today.
      </mstts:express-as>
    </prosody>
  </voice>

  <voice name="en-US-GuyNeural">
    <prosody rate="+23%">
      <mstts:express-as style="newscast" styledegree="1.0">
        Let's start with the first one - <emphasis level="strong">DIRT</emphasis> framework.
        <break time="300ms"/>
        It's a game-changer.
      </mstts:express-as>
    </prosody>
  </voice>

  <voice name="en-US-JennyNeural">
    <prosody rate="+21%" pitch="+10%">
      Really?
      <break time="200ms"/>
      Tell me more!
    </prosody>
  </voice>

</speak>
```

---

## 调试和优化

### 快速测试流程

1. **生成30秒预览**
   ```bash
   # 在浏览器中点击"试听片段"按钮
   # 或使用curl测试
   curl -X POST http://localhost:3001/api/preview \
     -H "Content-Type: application/json" \
     -d '{"file":"your-file.ssml","johnVoice":"en-US-GuyNeural","aliceVoice":"en-US-JennyNeural","speed":1,"quality":"audio-24khz-160kbitrate-mono-mp3"}' \
     --output preview.mp3
   ```

2. **调整参数**
   - 太快？降低rate值（+23% → +18%）
   - 太慢？提高rate值（+18% → +25%）
   - 停顿太长？减少break时间（300ms → 200ms）
   - 不够自然？降低styledegree（1.0 → 0.8）

3. **批量替换**
   ```bash
   # 全局调整语速
   sed -i '' 's/rate="+23%"/rate="+20%"/g' your-file.ssml

   # 全局调整停顿
   sed -i '' 's/time="300ms"/time="250ms"/g' your-file.ssml
   ```

---

## 常见问题

### Q: 为什么生成的音频听起来不自然？

**A: 检查以下几点**：
1. 停顿是否过多/过长？建议不超过500ms
2. styledegree是否过高？建议≤1.1
3. rate变化是否过大？同一对话中角色语速差别不要超过5%
4. 是否有过多的prosody嵌套？尽量简化

### Q: break标签报错？

**A: 确保break在voice内**：
```xml
<!-- ✅ 正确 -->
<voice name="...">
  <prosody rate="+23%">
    Text here.
    <break time="300ms"/>
  </prosody>
</voice>

<!-- ❌ 错误 -->
</voice>
<break time="300ms"/>
<voice name="...">
```

### Q: 如何让笑声更自然？

**A: 使用文本+情感**：
```xml
<mstts:express-as style="cheerful" styledegree="1.1">
  <prosody pitch="+15%">Ha!</prosody>
  <break time="200ms"/>
</mstts:express-as>
That's funny!
```

### Q: 成本控制？

**A: 预估公式**：
- 成本 = (字符数 / 1000) × $0.016
- 15,000字符 ≈ $0.24
- 建议：先用preview测试（2000字符≈$0.03）

---

## 资源链接

- [Azure Neural TTS官方文档](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice)
- [SSML规范](https://www.w3.org/TR/speech-synthesis11/)
- [Azure支持的声音列表](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts)
- [定价信息](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/)

---

## 总结

**核心原则**：
1. ✅ **简洁** - 少用嵌套标签
2. ✅ **克制** - 参数变化不要过大
3. ✅ **测试** - 多用preview快速迭代
4. ✅ **一致** - 同角色保持风格统一

**推荐配置**（快节奏播客）：
```xml
<voice name="en-US-GuyNeural">
  <prosody rate="+23%">
    <mstts:express-as style="newscast-casual" styledegree="0.9">
      内容，停顿250-350ms
    </mstts:express-as>
  </prosody>
</voice>
```

现在开始创建你的自然AI播客吧！🎙️
