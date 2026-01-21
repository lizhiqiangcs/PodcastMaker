#!/bin/bash

echo "Testing preview generation with fixed SSML..."
echo ""

curl -X POST http://localhost:3001/api/preview \
  -H "Content-Type: application/json" \
  -d '{
    "file": "ski-3-concepts-podcast.ssml",
    "johnVoice": "en-US-GuyNeural",
    "aliceVoice": "en-US-JennyNeural",
    "speed": 1,
    "quality": "audio-24khz-160kbitrate-mono-mp3"
  }' \
  --output /tmp/preview-test.mp3 \
  -w "\nHTTP Status: %{http_code}\n"

if [ -f /tmp/preview-test.mp3 ]; then
  SIZE=$(wc -c < /tmp/preview-test.mp3)
  echo "✅ Preview generated successfully!"
  echo "📦 File size: $SIZE bytes"
  echo "📁 Saved to: /tmp/preview-test.mp3"
else
  echo "❌ Preview generation failed"
fi
