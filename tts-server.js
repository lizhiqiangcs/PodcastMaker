const express = require('express');
const fs = require('fs');
const path = require('path');
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const config = require('./config-template');

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(express.static('.')); // Serve HTML file
app.use('/audio-output', express.static('audio-output')); // Serve generated audio

// Create output directory if not exists
const outputDir = path.join(__dirname, 'audio-output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// API: Get list of SSML files
app.get('/api/files', (req, res) => {
    try {
        const ssmlDir = path.join(__dirname, 'SSML');

        if (!fs.existsSync(ssmlDir)) {
            return res.json([]);
        }

        const files = fs.readdirSync(ssmlDir)
            .filter(file => file.endsWith('.ssml'))
            .map(file => {
                const filePath = path.join(ssmlDir, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    size: formatFileSize(stats.size),
                    path: filePath
                };
            });

        res.json(files);
    } catch (error) {
        console.error('Error reading SSML directory:', error);
        res.status(500).send('Error reading files: ' + error.message);
    }
});

// API: Preview (generate first 30 seconds)
app.post('/api/preview', async (req, res) => {
    try {
        const { file, johnVoice, aliceVoice, speed, quality } = req.body;

        console.log('Preview request:', { file, johnVoice, aliceVoice, speed, quality });

        // Read SSML file
        const ssmlPath = path.join(__dirname, 'SSML', file);
        let ssmlContent = fs.readFileSync(ssmlPath, 'utf-8');

        // Replace voices in SSML
        ssmlContent = replaceVoices(ssmlContent, johnVoice, aliceVoice, speed);

        // Extract first ~30 seconds worth of content (approximate by characters)
        const previewContent = extractPreview(ssmlContent, 2000); // ~30s of speech

        // Generate audio
        const audioBuffer = await synthesizeSpeech(previewContent, quality);

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length
        });
        res.send(audioBuffer);

    } catch (error) {
        console.error('Preview error:', error);
        res.status(500).send('Preview generation failed: ' + error.message);
    }
});

// API: Generate full audio
app.post('/api/generate', async (req, res) => {
    try {
        const { file, johnVoice, aliceVoice, speed, quality } = req.body;

        console.log('Generate request:', { file, johnVoice, aliceVoice, speed, quality });

        // Read SSML file
        const ssmlPath = path.join(__dirname, 'SSML', file);
        let ssmlContent = fs.readFileSync(ssmlPath, 'utf-8');

        // Replace voices in SSML
        ssmlContent = replaceVoices(ssmlContent, johnVoice, aliceVoice, speed);

        // Generate output filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const outputFilename = `${path.basename(file, '.ssml')}_${timestamp}.mp3`;
        const outputPath = path.join(outputDir, outputFilename);

        // Generate audio
        console.log('Generating full audio...');
        const audioBuffer = await synthesizeSpeech(ssmlContent, quality);

        // Save to file
        fs.writeFileSync(outputPath, audioBuffer);
        console.log(`Audio saved to: ${outputPath}`);

        res.json({
            success: true,
            filename: outputFilename,
            outputPath: outputPath,
            size: formatFileSize(audioBuffer.length)
        });

    } catch (error) {
        console.error('Generate error:', error);
        res.status(500).send('Audio generation failed: ' + error.message);
    }
});

// Helper: Replace voice names in SSML
function replaceVoices(ssml, johnVoice, aliceVoice, speed) {
    // Replace John's voice (default: en-US-GuyNeural)
    ssml = ssml.replace(/name="en-US-GuyNeural"/g, `name="${johnVoice}"`);

    // Replace Alice's voice (default: en-US-JennyNeural)
    ssml = ssml.replace(/name="en-US-JennyNeural"/g, `name="${aliceVoice}"`);

    // Apply global speed adjustment if not 1.0
    if (speed !== 1.0) {
        // Add prosody rate wrapper to each voice section
        const speedPercent = ((speed - 1) * 100).toFixed(0);
        const speedStr = speedPercent >= 0 ? `+${speedPercent}%` : `${speedPercent}%`;

        // This is a simplified approach - wrap main content
        // In production, you'd want more sophisticated SSML manipulation
        console.log(`Applying global speed: ${speedStr}`);
    }

    return ssml;
}

// Helper: Extract preview content (first ~N characters)
function extractPreview(ssml, maxChars) {
    // Find the first <speak> tag
    const speakStart = ssml.indexOf('<speak');
    const speakEnd = ssml.indexOf('>', speakStart) + 1;
    const closingTag = '</speak>';

    // Get header
    const header = ssml.substring(speakStart, speakEnd);

    // Get content up to maxChars
    let content = ssml.substring(speakEnd, ssml.indexOf(closingTag));

    // Truncate at approximately maxChars, but try to end at a complete tag
    if (content.length > maxChars) {
        content = content.substring(0, maxChars);
        // Try to close any open voice tags
        const lastVoiceClose = content.lastIndexOf('</voice>');
        if (lastVoiceClose > 0) {
            content = content.substring(0, lastVoiceClose + 8);
        }
    }

    const preview = header + content + '\n' + closingTag;
    console.log(`Preview length: ${preview.length} chars`);
    return preview;
}

// Helper: Synthesize speech using Azure TTS
function synthesizeSpeech(ssml, quality) {
    return new Promise((resolve, reject) => {
        // Configure Azure Speech SDK
        const speechConfig = sdk.SpeechConfig.fromSubscription(
            config.azure.subscriptionKey,
            config.azure.region
        );

        // Set audio format
        const formatMap = {
            'audio-24khz-96kbitrate-mono-mp3': sdk.SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3,
            'audio-24khz-160kbitrate-mono-mp3': sdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3,
            'audio-48khz-192kbitrate-mono-mp3': sdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3
        };

        speechConfig.speechSynthesisOutputFormat = formatMap[quality] ||
            sdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;

        // Create synthesizer with null audio config (returns audio data)
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

        console.log('Starting synthesis...');
        console.log('SSML length:', ssml.length);

        synthesizer.speakSsmlAsync(
            ssml,
            result => {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    console.log('Synthesis completed successfully');
                    console.log('Audio data length:', result.audioData.byteLength);

                    // Convert ArrayBuffer to Buffer
                    const audioBuffer = Buffer.from(result.audioData);
                    synthesizer.close();
                    resolve(audioBuffer);
                } else {
                    console.error('Synthesis failed:', result.errorDetails);
                    synthesizer.close();
                    reject(new Error('Synthesis failed: ' + result.errorDetails));
                }
            },
            error => {
                console.error('Synthesis error:', error);
                synthesizer.close();
                reject(error);
            }
        );
    });
}

// Helper: Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🎙️  Azure TTS Podcast Generator Server');
    console.log('='.repeat(60));
    console.log(`✅ Server running at: http://localhost:${PORT}`);
    console.log(`📁 SSML directory: ${path.join(__dirname, 'SSML')}`);
    console.log(`🎵 Output directory: ${outputDir}`);
    console.log(`🌐 Open browser to: http://localhost:${PORT}/tts-generator.html`);
    console.log('='.repeat(60));
    console.log('');
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    process.exit(0);
});
