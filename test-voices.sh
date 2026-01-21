#!/bin/bash

echo "🎙️  Azure TTS 声音对比测试工具"
echo "================================"
echo ""

# 测试文本（30秒左右）
TEST_TEXT="Welcome back to Ski Mastery Podcast! I'm your host, and today we have an incredibly exciting topic. Are you ready to dive into the three core concepts that will transform your skiing? Let's talk about the frameworks that aren't just theories—they're absolute game-changers!"

# 输出目录
OUTPUT_DIR="./voice-tests"
mkdir -p "$OUTPUT_DIR"

echo "📝 测试文本："
echo "\"$TEST_TEXT\""
echo ""
echo "🔄 生成测试样本..."
echo ""

# 测试的声音列表
declare -A VOICES=(
    ["Guy"]="en-US-GuyNeural"
    ["Brian"]="en-US-BrianNeural"
    ["Andrew"]="en-US-AndrewNeural"
    ["Davis"]="en-US-DavisNeural"
    ["AIGen1"]="en-US-AIGenerate1Neural"
    ["AIGen2"]="en-US-AIGenerate2Neural"
)

# 为每个声音生成测试
for name in "${!VOICES[@]}"; do
    voice="${VOICES[$name]}"
    output="$OUTPUT_DIR/${name}_test.mp3"

    echo "⏳ 生成: $name ($voice)..."

    # 创建临时SSML
    cat > /tmp/test-voice.ssml <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
  <voice name="$voice">
    <prosody rate="+23%">
      $TEST_TEXT
    </prosody>
  </voice>
</speak>
EOF

    # 使用API生成（需要服务器运行）
    # 这里简化为提示信息
    echo "   提示：在网页界面选择 $voice 并试听"
done

echo ""
echo "✅ 测试准备完成！"
echo ""
echo "📊 声音对比建议："
echo ""
echo "   1. AIGenerate1/2 - 最新AI，最自然"
echo "   2. Guy - 专业清晰，播客标配"
echo "   3. Brian - 新闻主播风格"
echo "   4. Andrew - 温和专业"
echo "   5. Davis - 温暖友好"
echo ""
echo "💡 测试方法："
echo "   1. 打开浏览器：http://localhost:3001/tts-generator.html"
echo "   2. 依次选择不同声音"
echo "   3. 点击"试听片段"生成样本"
echo "   4. 对比听感差异"
echo ""
echo "🎯 推荐："
echo "   - 快节奏播客：AIGenerate1 或 Guy"
echo "   - 专业讲解：Brian 或 AIGenerate2"
echo "   - 温暖访谈：Andrew 或 Davis"
