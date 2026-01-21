# 转录文本翻译指南

## 已完成的配置

✅ **转录语言已改为英文**
- 配置文件：`server-blob.js`
- 语言设置：`locale: 'en-US'`
- 以后上传的音频将按英文转录

## 生成的文件

### 1. 原始转录文件
- 文件名：`transcript-613db601-9e4e-46ac-bdec-31d3044fb572.txt`
- 大小：45K
- 内容：纯英文转录（按说话人分段）

### 2. 中英对照翻译文件 ✨
- 文件名：`transcript-613db601-9e4e-46ac-bdec-31d3044fb572-bilingual.txt`
- 大小：82K
- 格式：
  ```
  Speaker 2:
  EN: Welcome back to the deep dive today...
  CN: 欢迎回到今天的深入探讨...

  Speaker 3:
  EN: That's right. If you ever been on a lesson...
  CN: 没错。如果你曾经上过课...
  ```

## 如何翻译其他转录文件

### 方法 1：使用翻译脚本（推荐）

```bash
node translate-transcript.js <转录ID>
```

**示例**：
```bash
# 如果转录文件是 transcript-abc123.txt
node translate-transcript.js abc123
```

这将生成一个双语文件：`transcript-abc123-bilingual.txt`

### 方法 2：配置 Azure Translator（更快更准确）

如果你有 Azure Translator 资源：

1. 编辑 `translate-transcript.js` 文件
2. 填入你的配置：
   ```javascript
   const TRANSLATOR_KEY = '你的Translator密钥';
   const TRANSLATOR_REGION = 'eastus2';
   ```

使用 Azure Translator 的优点：
- ✅ 翻译质量更高
- ✅ 速度更快
- ✅ 支持更多语言对

### 当前使用的翻译服务

目前使用**免费翻译服务**（Google Translate 非官方 API）：
- 优点：免费，无需配置
- 缺点：速度较慢（241段落约1分钟），翻译质量一般

## 翻译格式说明

生成的双语文件格式：

```
Speaker X:
EN: [英文原文]
CN: [中文翻译]

Speaker Y:
EN: [英文原文]
CN: [中文翻译]
```

**特点**：
- ✅ 保留说话人信息
- ✅ 英文和中文逐行对照
- ✅ 易于阅读和对比
- ✅ Git 友好（纯文本格式）

## 批量翻译

如果需要翻译多个文件，可以创建一个批处理脚本：

```bash
# 创建批处理脚本
cat > batch-translate.sh << 'EOF'
#!/bin/bash
for file in transcripts/transcript-*.txt; do
    if [[ ! "$file" =~ bilingual ]]; then
        id=$(basename "$file" .txt | sed 's/transcript-//')
        echo "翻译: $id"
        node translate-transcript.js "$id"
    fi
done
EOF

chmod +x batch-translate.sh
./batch-translate.sh
```

## 费用估算（如果使用 Azure Translator）

Azure Translator 定价（2026）：
- 标准版：$10 / 百万字符
- 免费层：每月 200 万字符

一个典型的 1 小时播客转录：
- 约 10,000-15,000 字符
- 费用：$0.10 - $0.15

## 故障排除

### 问题：翻译失败

**解决方法**：
1. 检查网络连接
2. 查看控制台错误信息
3. 如果是免费服务限流，等待几分钟后重试

### 问题：翻译质量不佳

**解决方法**：
1. 配置 Azure Translator（推荐）
2. 或使用其他专业翻译服务

### 问题：特定术语翻译不准确

**解决方法**：
1. 手动编辑双语文件中的 CN 行
2. 或在翻译脚本中添加术语词典

## 下一步改进

可选的功能增强：
1. 自动检测音频语言
2. 支持更多翻译方向（如英文→日文、韩文等）
3. 生成 .docx 格式的双语对照文档
4. 添加术语词典功能
5. 集成到网页界面，自动翻译

需要这些功能吗？告诉我！
