const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Azure Translator 配置
// 如果你有 Azure Translator 资源，填入 key 和 region
// 否则我们使用免费的翻译 API
const TRANSLATOR_KEY = ''; // 填入你的 Azure Translator Key（如果有）
const TRANSLATOR_REGION = 'eastus2';
const TRANSLATOR_ENDPOINT = 'https://api.cognitive.microsofttranslator.com';

// 使用免费翻译服务作为备选方案
async function translateTextFree(text, fromLang = 'en', toLang = 'zh-Hans') {
    try {
        // 使用 Google Translate 的免费 API（非官方）
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await axios.get(url);

        if (response.data && response.data[0]) {
            return response.data[0].map(item => item[0]).join('');
        }
        return text;
    } catch (error) {
        console.error('翻译失败:', error.message);
        return text;
    }
}

// 使用 Azure Translator（如果有配置）
async function translateTextAzure(text, fromLang = 'en', toLang = 'zh-Hans') {
    try {
        const url = `${TRANSLATOR_ENDPOINT}/translate?api-version=3.0&from=${fromLang}&to=${toLang}`;

        const response = await axios.post(url, [{ text: text }], {
            headers: {
                'Ocp-Apim-Subscription-Key': TRANSLATOR_KEY,
                'Ocp-Apim-Subscription-Region': TRANSLATOR_REGION,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data[0] && response.data[0].translations) {
            return response.data[0].translations[0].text;
        }
        return text;
    } catch (error) {
        console.error('Azure 翻译失败:', error.message);
        return text;
    }
}

// 选择翻译方法
async function translateText(text) {
    if (TRANSLATOR_KEY) {
        return await translateTextAzure(text);
    } else {
        return await translateTextFree(text);
    }
}

// 翻译转录文件
async function translateTranscript(transcriptId) {
    const transcriptPath = path.join(__dirname, 'transcripts', `transcript-${transcriptId}.txt`);

    if (!fs.existsSync(transcriptPath)) {
        console.error('转录文件不存在:', transcriptPath);
        return;
    }

    console.log('读取转录文件...');
    const content = fs.readFileSync(transcriptPath, 'utf8');

    // 按段落分割
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    console.log(`开始翻译 ${paragraphs.length} 个段落...`);
    console.log(TRANSLATOR_KEY ? '使用 Azure Translator' : '使用免费翻译服务');

    let bilingualContent = [];

    for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].trim();

        if (!paragraph) continue;

        console.log(`翻译进度: ${i + 1}/${paragraphs.length}`);

        // 检查是否是说话人标记
        const speakerMatch = paragraph.match(/^(Speaker \d+):\s*(.*)$/);

        if (speakerMatch) {
            const speaker = speakerMatch[1];
            const text = speakerMatch[2];

            if (text) {
                // 翻译文本
                const translation = await translateText(text);

                // 格式化为中英对照
                bilingualContent.push(`${speaker}:`);
                bilingualContent.push(`EN: ${text}`);
                bilingualContent.push(`CN: ${translation}`);
                bilingualContent.push('');
            } else {
                bilingualContent.push(paragraph);
                bilingualContent.push('');
            }

            // 避免请求过快
            await new Promise(resolve => setTimeout(resolve, 200));
        } else {
            // 非说话人段落直接添加
            bilingualContent.push(paragraph);
            bilingualContent.push('');
        }
    }

    // 保存双语文件
    const bilingualPath = path.join(__dirname, 'transcripts', `transcript-${transcriptId}-bilingual.txt`);
    fs.writeFileSync(bilingualPath, bilingualContent.join('\n'), 'utf8');

    console.log('✅ 翻译完成！');
    console.log('双语文件已保存到:', bilingualPath);
}

// 从命令行参数获取转录ID
const transcriptId = process.argv[2];

if (!transcriptId) {
    console.error('请提供转录ID');
    console.error('用法: node translate-transcript.js <transcription-id>');
    process.exit(1);
}

translateTranscript(transcriptId);
