#!/usr/bin/env node

const fs = require('fs');

const ssmlFile = './SSML/ski-3-concepts-podcast.ssml';

console.log('提速15%...');

let content = fs.readFileSync(ssmlFile, 'utf-8');

// 当前语速：John +8%, Alice +6%
// 目标：John +23%, Alice +21%

content = content.replace(
  /<voice name="en-US-GuyNeural">\s*\n\s*<prosody rate="\+8%">/g,
  '<voice name="en-US-GuyNeural">\n    <prosody rate="+23%">'
);

content = content.replace(
  /<voice name="en-US-JennyNeural">\s*\n\s*<prosody rate="\+6%">/g,
  '<voice name="en-US-JennyNeural">\n    <prosody rate="+21%">'
);

fs.writeFileSync(ssmlFile, content, 'utf-8');

console.log('✅ 提速完成！');
console.log('   John: +8% → +23%');
console.log('   Alice: +6% → +21%');
