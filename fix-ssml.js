#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ssmlFile = process.argv[2] || './SSML/ski-3-concepts-podcast.ssml';

console.log(`Fixing SSML file: ${ssmlFile}`);

let content = fs.readFileSync(ssmlFile, 'utf-8');

// Fix 1: Move root-level breaks into the preceding voice tag
// Pattern: </voice>\n\n  <break time="XXXms"/>\n\n  <voice
content = content.replace(
  /(<\/voice>)\s*\n\s*\n\s*(<break time="[^"]+"\/>)\s*\n\s*\n\s*(<voice)/g,
  (match, closeVoice, breakTag, openVoice) => {
    return `    ${breakTag}\n  ${closeVoice}\n\n  ${openVoice}`;
  }
);

// Fix 2: Move standalone section breaks into the preceding voice tag
// Pattern: </voice>\n\n  <break time="XXXms"/>\n\n  <!-- comment -->
content = content.replace(
  /(<\/voice>)\s*\n\s*\n\s*(<break time="[^"]+"\/>)\s*\n/g,
  (match, closeVoice, breakTag) => {
    return `    ${breakTag}\n  ${closeVoice}\n`;
  }
);

// Write back
fs.writeFileSync(ssmlFile, content, 'utf-8');

console.log('✅ Fixed! Root-level breaks moved into voice tags.');
console.log('✅ SSML file is now valid for Azure TTS.');
