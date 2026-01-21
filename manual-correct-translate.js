const fs = require('fs');
const path = require('path');

/**
 * 常见转录错误的修正映射
 */
const commonErrors = {
    // 基本错误
    'our bines kink': 'alpine skiing',
    'bines': 'alpine',
    'skies': 'skis',
    'ski ': 'skier ',
    'scare': 'skier',
    'skin': 'skiing',

    // 短语修正
    'straping in': 'strapping in',
    'deep dies': 'deep dive',
    'founders of asking': 'found yourself asking',
    'need and word': 'knee inward',
    'human korea': 'human choreography',
    'angelation': 'angulation',
    'late rotation': 'leg rotation',
    'foreign F pressure': 'fore-aft pressure',
    'four F pressure': 'fore-aft pressure',

    // 技术术语
    'center of manners': 'center of mass',
    'base of support': 'base of support',
    'anklefaction': 'ankle flexion',
    'neifaction': 'knee flexion',
    'hepenge': 'hip hinge',
    'benjanies': 'bend your knees',

    // 常见词汇
    'slops': 'slopes',
    'Fall line': 'fall line',
    'our glass shape': 'hourglass shape',
    'side cut': 'sidecut',
    'in tirelank': 'entire length',
    'shines': 'shins',
    'shuffle': 'shovel',
    'tale': 'tail',
    'anchor': 'ankle',

    // 短语
    "Let's impact": "Let's unpack",
    'stearing': 'steering',
    'stiring': 'steering',
    'minipulating': 'manipulating',
    'processly': 'precisely',
    'process': 'precise',

    // 时态修正
    'achieveing': 'achieving',
    'miming': 'mimicking',

    // 连接词
    '。': '.',
    '，': ',',
};

/**
 * 应用基本修正
 */
function applyBasicCorrections(text) {
    let corrected = text;

    for (const [error, correction] of Object.entries(commonErrors)) {
        const regex = new RegExp(error.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        corrected = corrected.replace(regex, correction);
    }

    return corrected;
}

/**
 * 更智能的修正（基于上下文）
 */
function intelligentCorrection(text) {
    let corrected = text;

    // 修正常见模式
    corrected = corrected.replace(/\ba ski\b/gi, 'a skier');
    corrected = corrected.replace(/\bthe ski\b(?! boot| tip| tail)/gi, 'the skier');
    corrected = corrected.replace(/\byou ski\b/gi, 'you skier');

    // 修正标点
    corrected = corrected.replace(/\s+([.,!?])/g, '$1');
    corrected = corrected.replace(/([.,!?])(\w)/g, '$1 $2');

    // 修正大小写
    corrected = corrected.replace(/(^|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());

    return corrected;
}

/**
 * 完整处理
 */
function processTranscript(transcriptId) {
    const transcriptPath = path.join(__dirname, 'transcripts', `transcript-${transcriptId}.txt`);

    if (!fs.existsSync(transcriptPath)) {
        console.error('转录文件不存在:', transcriptPath);
        return;
    }

    console.log('读取转录文件...');
    const content = fs.readFileSync(transcriptPath, 'utf8');

    const paragraphs = content.split('\n\n').filter(p => p.trim());

    console.log(`开始处理 ${paragraphs.length} 个段落...`);

    let results = [];

    for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].trim();

        if (!paragraph) continue;

        const speakerMatch = paragraph.match(/^(Speaker \d+):\s*(.*)$/);

        if (speakerMatch) {
            const speaker = speakerMatch[1];
            const original = speakerMatch[2];

            if (original && original.length > 10) {
                // 应用修正
                let corrected = applyBasicCorrections(original);
                corrected = intelligentCorrection(corrected);

                results.push({
                    speaker,
                    original,
                    corrected,
                    needsTranslation: true
                });
            }
        }

        console.log(`处理进度: ${i + 1}/${paragraphs.length}`);
    }

    // 保存修正后的英文
    const correctedPath = path.join(__dirname, 'transcripts', `transcript-${transcriptId}-corrected.txt`);
    const correctedContent = results.map(r =>
        `${r.speaker}: ${r.corrected}`
    ).join('\n\n');

    fs.writeFileSync(correctedPath, correctedContent, 'utf8');

    console.log('✅ 修正完成！');
    console.log('修正后文件:', correctedPath);
    console.log('');
    console.log('注意：这是自动修正，建议人工review重要内容');
    console.log('需要中文翻译请使用外部翻译服务或 AI 工具');
}

const transcriptId = process.argv[2];

if (!transcriptId) {
    console.error('用法: node manual-correct-translate.js <transcription-id>');
    process.exit(1);
}

processTranscript(transcriptId);
