require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const sdk = require('microsoft-cognitiveservices-speech-sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// Azure Speech Service 配置 - 从环境变量读取
const AZURE_SUBSCRIPTION_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION || 'eastus2';

// 配置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB 限制
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 存储转录任务信息
const transcriptions = new Map();

// 上传音频并开始转录
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        console.log('收到文件:', req.file.filename);

        const transcriptionId = `trans-${Date.now()}`;
        const audioFilePath = path.join(__dirname, 'uploads', req.file.filename);

        // 保存转录任务信息
        transcriptions.set(transcriptionId, {
            fileName: req.file.filename,
            originalName: req.file.originalname,
            status: 'Running',
            createdAt: new Date(),
            audioFilePath: audioFilePath
        });

        console.log('转录任务已创建:', transcriptionId);

        // 异步开始转录
        performTranscription(transcriptionId, audioFilePath).catch(err => {
            console.error('转录错误:', err);
            if (transcriptions.has(transcriptionId)) {
                transcriptions.get(transcriptionId).status = 'Failed';
                transcriptions.get(transcriptionId).error = err.message;
            }
        });

        res.json({
            success: true,
            transcriptionId: transcriptionId,
            message: '转录任务已创建'
        });

    } catch (error) {
        console.error('转录失败:', error.message);
        res.status(500).json({
            error: '转录失败: ' + error.message
        });
    }
});

// 执行转录
async function performTranscription(transcriptionId, audioFilePath) {
    return new Promise((resolve, reject) => {
        try {
            // 配置 Speech SDK
            const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SUBSCRIPTION_KEY, AZURE_REGION);
            speechConfig.speechRecognitionLanguage = 'zh-CN';

            // 启用详细输出
            speechConfig.outputFormat = sdk.OutputFormat.Detailed;

            // 创建音频配置
            const audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(audioFilePath));

            // 配置对话转录（支持说话人分离）
            const conversationTranscriber = new sdk.ConversationTranscriber(speechConfig, audioConfig);

            let transcriptSegments = [];
            let isTranscribing = true;

            // 监听转录事件
            conversationTranscriber.transcribed = (s, e) => {
                if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
                    const speakerId = e.result.speakerId || 'Unknown';
                    console.log(`说话人 ${speakerId}: ${e.result.text}`);

                    transcriptSegments.push({
                        speaker: speakerId,
                        text: e.result.text,
                        offset: e.result.offset,
                        duration: e.result.duration
                    });
                }
            };

            conversationTranscriber.canceled = (s, e) => {
                console.log('转录被取消:', e.errorDetails);

                if (e.reason === sdk.CancellationReason.Error) {
                    transcriptions.get(transcriptionId).status = 'Failed';
                    transcriptions.get(transcriptionId).error = e.errorDetails;
                    reject(new Error(e.errorDetails));
                }

                conversationTranscriber.stopTranscribingAsync();
                isTranscribing = false;
            };

            conversationTranscriber.sessionStopped = (s, e) => {
                console.log('转录会话结束');
                conversationTranscriber.stopTranscribingAsync();
                isTranscribing = false;

                // 保存转录结果
                const transcript = formatTranscriptSegments(transcriptSegments);
                const transcriptFileName = `transcript-${transcriptionId}.txt`;
                const transcriptPath = path.join(__dirname, 'transcripts', transcriptFileName);
                fs.writeFileSync(transcriptPath, transcript, 'utf8');

                // 更新状态
                transcriptions.get(transcriptionId).status = 'Succeeded';
                transcriptions.get(transcriptionId).transcript = transcript;
                transcriptions.get(transcriptionId).transcriptFile = transcriptFileName;

                console.log('转录完成，已保存:', transcriptFileName);
                resolve(transcript);
            };

            // 开始转录
            conversationTranscriber.startTranscribingAsync(
                () => {
                    console.log('开始转录...');
                },
                err => {
                    console.error('启动转录失败:', err);
                    transcriptions.get(transcriptionId).status = 'Failed';
                    transcriptions.get(transcriptionId).error = err;
                    reject(new Error(err));
                }
            );

        } catch (error) {
            console.error('转录过程错误:', error);
            reject(error);
        }
    });
}

// 格式化转录片段
function formatTranscriptSegments(segments) {
    if (segments.length === 0) {
        return '无转录内容';
    }

    // 按说话人分组
    let result = [];
    let currentSpeaker = null;
    let currentText = [];

    segments.forEach(segment => {
        if (segment.speaker !== currentSpeaker) {
            if (currentText.length > 0) {
                result.push(currentText.join(' '));
            }
            currentSpeaker = segment.speaker;
            result.push(`\n\nSpeaker ${currentSpeaker}:`);
            currentText = [segment.text];
        } else {
            currentText.push(segment.text);
        }
    });

    if (currentText.length > 0) {
        result.push(currentText.join(' '));
    }

    return result.join(' ').trim();
}

// 检查转录状态
app.get('/api/transcription/:id', async (req, res) => {
    try {
        const transcriptionId = req.params.id;

        if (!transcriptions.has(transcriptionId)) {
            return res.status(404).json({ error: '转录任务不存在' });
        }

        const transcription = transcriptions.get(transcriptionId);

        res.json({
            status: transcription.status,
            transcript: transcription.transcript || '',
            transcriptFile: transcription.transcriptFile || '',
            error: transcription.error || null
        });

    } catch (error) {
        console.error('获取转录状态失败:', error.message);
        res.status(500).json({
            error: '获取状态失败: ' + error.message
        });
    }
});

// 下载转录文本
app.get('/api/download/:id', (req, res) => {
    const transcriptionId = req.params.id;
    const transcriptFileName = `transcript-${transcriptionId}.txt`;
    const transcriptPath = path.join(__dirname, 'transcripts', transcriptFileName);

    if (fs.existsSync(transcriptPath)) {
        res.download(transcriptPath, transcriptFileName);
    } else {
        res.status(404).send('转录文件不存在');
    }
});

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('请在浏览器中打开上述地址使用转录工具');
});
