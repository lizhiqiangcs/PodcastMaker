const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// 注意：这个脚本需要 ANTHROPIC_API_KEY 环境变量
// 或者你可以直接在代码中设置 API key

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || ''
});

async function translateWithClaude(text, context = '') {
    try {
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 4096,
            messages: [{
                role: 'user',
                content: `You are translating a skiing podcast transcript. The original transcript may contain errors from speech-to-text conversion.

Your tasks:
1. First, identify and correct any obvious transcription errors in the English text (e.g., "our bines kink" should be "alpine skiing", "founders" should be "found yourself", etc.)
2. Then translate the CORRECTED English to natural, fluent Chinese

Context: This is a technical podcast about skiing mechanics and physics.

Original English text:
${text}

Please provide your response in this exact format:
CORRECTED_EN: [Your corrected English text]
TRANSLATION_CN: [Your Chinese translation]`
            }]
        });

        const response = message.content[0].text;

        // Parse response
        const correctedMatch = response.match(/CORRECTED_EN:\s*(.+?)(?=TRANSLATION_CN:|$)/s);
        const translationMatch = response.match(/TRANSLATION_CN:\s*(.+)/s);

        return {
            corrected: correctedMatch ? correctedMatch[1].trim() : text,
            translation: translationMatch ? translationMatch[1].trim() : ''
        };
    } catch (error) {
        console.error('Translation error:', error.message);
        return {
            corrected: text,
            translation: '[翻译失败]'
        };
    }
}

async function processTranscript(transcriptId) {
    const transcriptPath = path.join(__dirname, 'transcripts', `transcript-${transcriptId}.txt`);

    if (!fs.existsSync(transcriptPath)) {
        console.error('转录文件不存在:', transcriptPath);
        return;
    }

    console.log('读取转录文件...');
    const content = fs.readFileSync(transcriptPath, 'utf8');

    // 按段落分割
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    console.log(`开始处理 ${paragraphs.length} 个段落...`);
    console.log('使用 Claude AI 进行纠错和翻译');

    let bilingualContent = [];
    let processedCount = 0;

    for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].trim();

        if (!paragraph) continue;

        console.log(`处理进度: ${i + 1}/${paragraphs.length}`);

        // 检查是否是说话人标记
        const speakerMatch = paragraph.match(/^(Speaker \d+):\s*(.*)$/);

        if (speakerMatch) {
            const speaker = speakerMatch[1];
            const text = speakerMatch[2];

            if (text && text.length > 10) {
                // 使用 Claude 纠错和翻译
                const result = await translateWithClaude(text);

                bilingualContent.push(`${speaker}:`);
                bilingualContent.push(`EN (Original): ${text}`);
                if (result.corrected !== text) {
                    bilingualContent.push(`EN (Corrected): ${result.corrected}`);
                }
                bilingualContent.push(`CN: ${result.translation}`);
                bilingualContent.push('');

                processedCount++;

                // 避免 rate limit
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                bilingualContent.push(paragraph);
                bilingualContent.push('');
            }
        } else {
            bilingualContent.push(paragraph);
            bilingualContent.push('');
        }
    }

    // 保存结果
    const outputPath = path.join(__dirname, 'transcripts', `transcript-${transcriptId}-ai-bilingual.txt`);
    fs.writeFileSync(outputPath, bilingualContent.join('\n'), 'utf8');

    console.log('✅ 处理完成！');
    console.log(`已处理 ${processedCount} 个段落`);
    console.log('文件已保存到:', outputPath);
}

// 从命令行获取转录ID
const transcriptId = process.argv[2];

if (!transcriptId) {
    console.error('请提供转录ID');
    console.error('用法: node ai-translate.js <transcription-id>');
    console.error('');
    console.error('注意：需要设置 ANTHROPIC_API_KEY 环境变量');
    process.exit(1);
}

processTranscript(transcriptId);
