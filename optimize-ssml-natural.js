#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ssmlFile = process.argv[2] || './SSML/ski-3-concepts-podcast.ssml';

console.log(`优化SSML自然度: ${ssmlFile}`);

let content = fs.readFileSync(ssmlFile, 'utf-8');

// 1. 减少停顿时间 - 让对话更流畅
const breakReductions = {
  '1500ms': '700ms',  // 章节停顿：大幅减少
  '1200ms': '600ms',  // 段落停顿：减半
  '1000ms': '500ms',  // 长停顿：减半
  '800ms': '400ms',   // 对话切换：减半
  '600ms': '350ms',   // 中等停顿
  '500ms': '300ms',   // 句子停顿
  '400ms': '250ms',   // 短停顿
  '300ms': '200ms',   // 更短停顿
  '250ms': '150ms',   // 极短停顿
  '200ms': '150ms'    // 最小停顿
};

for (const [oldTime, newTime] of Object.entries(breakReductions)) {
  const regex = new RegExp(`time="${oldTime}"`, 'g');
  content = content.replace(regex, `time="${newTime}"`);
}

// 2. 提高整体语速 - 给所有voice添加默认语速
// 为John添加稍快语速（主持人）
content = content.replace(
  /<voice name="en-US-GuyNeural">/g,
  '<voice name="en-US-GuyNeural">\n    <prosody rate="+8%">'
);

// 为Alice添加正常偏快语速（嘉宾）
content = content.replace(
  /<voice name="en-US-JennyNeural">/g,
  '<voice name="en-US-JennyNeural">\n    <prosody rate="+6%">'
);

// 在voice结束前添加对应的</prosody>
// 需要在最后一个break之后、</voice>之前添加
content = content.replace(
  /(<break time="[^"]+"\/>)\s*\n\s*(<\/voice>)/g,
  (match, breakTag, closeVoice) => {
    return `${breakTag}\n    </prosody>\n  ${closeVoice}`;
  }
);

// 3. 移除部分过短的停顿（150ms以下的在快速对话中不明显）
content = content.replace(/<break time="150ms"\/>\s*/g, ' ');

// 4. 调整express-as的styledegree，过高会显得做作
content = content.replace(/styledegree="1\.5"/g, 'styledegree="1.1"');
content = content.replace(/styledegree="1\.4"/g, 'styledegree="1.0"');
content = content.replace(/styledegree="1\.3"/g, 'styledegree="1.0"');
content = content.replace(/styledegree="1\.2"/g, 'styledegree="0.9"');

// 5. 减少过多的prosody嵌套（简化）
// 移除一些不必要的pitch调整（±5%以下的调整不明显）
content = content.replace(/<prosody pitch="\+2%">(.*?)<\/prosody>/g, '$1');
content = content.replace(/<prosody pitch="\+3%">(.*?)<\/prosody>/g, '$1');
content = content.replace(/<prosody pitch="\+5%" rate="\+3%">/g, '<prosody rate="+3%">');

// 写回文件
fs.writeFileSync(ssmlFile, content, 'utf-8');

console.log('');
console.log('✅ 优化完成！调整内容：');
console.log('   - 停顿时间减少50-60%（更流畅）');
console.log('   - 整体语速提升6-8%（更自然）');
console.log('   - 移除过短停顿（150ms以下）');
console.log('   - 降低情感强度（更自然不做作）');
console.log('   - 简化prosody嵌套（减少不必要调整）');
console.log('');
console.log('💡 建议：重新试听30秒预览，如果还是太快/太慢可继续调整');
