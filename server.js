require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

// Azure Speech Service 配置 - 从环境变量读取
const AZURE_SUBSCRIPTION_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION || 'eastus2';
const AZURE_ENDPOINT = process.env.AZURE_SPEECH_ENDPOINT;

// 获取本地服务器地址（用于提供音频文件访问）
const getLocalServerUrl = () => {
    // 在生产环境中，这应该是一个公网可访问的 URL
    // 对于本地测试，你可能需要使用 ngrok 或类似工具
    return `http://localhost:${PORT}`;
};

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

        // 读取音频文件
        const audioFilePath = path.join(__dirname, 'uploads', req.file.filename);
        const audioData = fs.readFileSync(audioFilePath);

        // 创建转录任务
        const transcriptionResponse = await createTranscription(audioData, req.file.originalname);

        const transcriptionId = transcriptionResponse.self.split('/').pop().split('?')[0];

        // 保存转录任务信息
        transcriptions.set(transcriptionId, {
            fileName: req.file.filename,
            originalName: req.file.originalname,
            status: 'NotStarted',
            createdAt: new Date()
        });

        console.log('转录任务已创建:', transcriptionId);

        res.json({
            success: true,
            transcriptionId: transcriptionId,
            message: '转录任务已创建'
        });

    } catch (error) {
        console.error('转录失败:', error.response?.data || error.message);
        res.status(500).json({
            error: '转录失败: ' + (error.response?.data?.message || error.message)
        });
    }
});

// 创建 Azure Batch Transcription
async function createTranscription(audioData, fileName) {
    // Azure Batch Transcription API v3.2 需要从 URL 访问音频文件
    // 我们提供本地服务器的 URL
    // 注意：在生产环境中，需要使用 ngrok 或公网可访问的 URL

    const audioUrl = `${getLocalServerUrl()}/uploads/${fileName}`;
    const url = `${AZURE_ENDPOINT}/speechtotext/v3.2/transcriptions`;

    const transcriptionDefinition = {
        contentUrls: [audioUrl],
        properties: {
            diarizationEnabled: true,
            diarization: {
                speakers: {
                    minCount: 1,
                    maxCount: 2
                }
            },
            wordLevelTimestampsEnabled: true,
            punctuationMode: 'DictatedAndAutomatic',
            profanityFilterMode: 'Masked'
        },
        locale: 'zh-CN',
        displayName: `Transcription-${Date.now()}`
    };

    try {
        const response = await axios.post(url, transcriptionDefinition, {
            headers: {
                'Ocp-Apim-Subscription-Key': AZURE_SUBSCRIPTION_KEY,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Azure API 错误:', error.response?.data);
        throw error;
    }
}

// 由于 Azure Batch Transcription 需要从 URL 访问文件，我们需要提供一个公共端点
// 提供上传的音频文件访问
app.get('/uploads/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('文件不存在');
    }
});

// 检查转录状态
app.get('/api/transcription/:id', async (req, res) => {
    try {
        const transcriptionId = req.params.id;
        const url = `${AZURE_ENDPOINT}/speechtotext/v3.2/transcriptions/${transcriptionId}`;

        const response = await axios.get(url, {
            headers: {
                'Ocp-Apim-Subscription-Key': AZURE_SUBSCRIPTION_KEY
            }
        });

        const status = response.data.status;
        console.log('转录状态:', status);

        // 更新本地状态
        if (transcriptions.has(transcriptionId)) {
            transcriptions.get(transcriptionId).status = status;
        }

        if (status === 'Succeeded') {
            // 获取转录结果
            const filesUrl = `${AZURE_ENDPOINT}/speechtotext/v3.2/transcriptions/${transcriptionId}/files`;
            const filesResponse = await axios.get(filesUrl, {
                headers: {
                    'Ocp-Apim-Subscription-Key': AZURE_SUBSCRIPTION_KEY
                }
            });

            // 查找转录结果文件
            const transcriptFile = filesResponse.data.values.find(f =>
                f.kind === 'Transcription'
            );

            if (transcriptFile) {
                // 下载转录结果
                const transcriptResponse = await axios.get(transcriptFile.links.contentUrl);
                const transcript = formatTranscript(transcriptResponse.data);

                // 保存转录结果到文件
                const transcriptFileName = `transcript-${transcriptionId}.txt`;
                const transcriptPath = path.join(__dirname, 'transcripts', transcriptFileName);
                fs.writeFileSync(transcriptPath, transcript, 'utf8');

                console.log('转录结果已保存:', transcriptFileName);

                res.json({
                    status: status,
                    transcript: transcript,
                    transcriptFile: transcriptFileName
                });
            } else {
                res.json({ status: status, transcript: '' });
            }
        } else {
            res.json({ status: status });
        }

    } catch (error) {
        console.error('获取转录状态失败:', error.response?.data || error.message);
        res.status(500).json({
            error: '获取状态失败: ' + (error.response?.data?.message || error.message)
        });
    }
});

// 格式化转录结果
function formatTranscript(data) {
    if (!data.recognizedPhrases) {
        return '无转录内容';
    }

    let result = [];
    let currentSpeaker = null;

    data.recognizedPhrases.forEach(phrase => {
        const speaker = phrase.speaker || 0;
        const text = phrase.nBest && phrase.nBest[0] ? phrase.nBest[0].display : '';

        if (text) {
            if (speaker !== currentSpeaker) {
                currentSpeaker = speaker;
                result.push(`\n\nSpeaker ${speaker + 1}:`);
            }
            result.push(text);
        }
    });

    return result.join(' ').trim();
}

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
