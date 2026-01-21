require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const { BlobServiceClient, StorageSharedKeyCredential, BlobSASPermissions, generateBlobSASQueryParameters } = require('@azure/storage-blob');

const app = express();
const PORT = process.env.PORT || 3000;

// Azure Speech Service 配置 - 从环境变量读取
const AZURE_SUBSCRIPTION_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION || 'eastus2';
const AZURE_ENDPOINT = process.env.AZURE_SPEECH_ENDPOINT;

// Azure Blob Storage 配置 - 从环境变量读取
const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const AZURE_STORAGE_CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || 'audio-files';

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

// 检查 Blob Storage 配置
function checkBlobStorageConfig() {
    if (!AZURE_STORAGE_ACCOUNT_NAME || !AZURE_STORAGE_ACCOUNT_KEY) {
        console.error('警告：Azure Blob Storage 未配置');
        console.error('请在 server-blob.js 中设置 AZURE_STORAGE_ACCOUNT_NAME 和 AZURE_STORAGE_ACCOUNT_KEY');
        console.error('如果没有 Azure Storage Account，请使用 server-sdk.js 代替');
        return false;
    }
    return true;
}

// 检测音频信息
function getAudioInfo(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
                resolve({
                    channels: audioStream?.channels || 0,
                    codec: audioStream?.codec_name || 'unknown',
                    duration: metadata.format.duration,
                    format: metadata.format.format_name
                });
            }
        });
    });
}

// 转换音频为单声道 MP3
async function convertToMonoMP3(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        console.log(`开始转换音频: ${inputPath} -> ${outputPath}`);

        ffmpeg(inputPath)
            .audioChannels(1)  // 单声道
            .audioCodec('libmp3lame')  // MP3 编码
            .audioBitrate('128k')  // 128kbps 比特率
            .audioFrequency(16000)  // 16kHz 采样率（Azure 推荐）
            .format('mp3')
            .on('start', (commandLine) => {
                console.log('FFmpeg 命令:', commandLine);
            })
            .on('progress', (progress) => {
                if (progress.percent) {
                    console.log(`转换进度: ${Math.round(progress.percent)}%`);
                }
            })
            .on('end', () => {
                console.log('音频转换完成');
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('音频转换失败:', err);
                reject(err);
            })
            .save(outputPath);
    });
}

// 处理音频文件，必要时转换
async function processAudioFile(originalPath, originalName) {
    try {
        // 检测音频信息
        const audioInfo = await getAudioInfo(originalPath);
        console.log('音频信息:', audioInfo);

        const ext = path.extname(originalName).toLowerCase();
        const needsConversion = audioInfo.channels > 1 || ext !== '.mp3';

        if (needsConversion) {
            console.log(`检测到 ${audioInfo.channels} 声道 ${ext} 文件，需要转换为单声道 MP3`);

            // 生成输出文件路径
            const baseName = path.basename(originalName, ext);
            const outputName = `${baseName}-converted.mp3`;
            const outputPath = path.join(path.dirname(originalPath), outputName);

            // 转换音频
            await convertToMonoMP3(originalPath, outputPath);

            return {
                filePath: outputPath,
                fileName: outputName,
                converted: true,
                originalFile: originalPath
            };
        } else {
            console.log('音频已经是单声道 MP3，无需转换');
            return {
                filePath: originalPath,
                fileName: originalName,
                converted: false
            };
        }
    } catch (error) {
        console.error('处理音频文件失败:', error);
        throw error;
    }
}

// 上传文件到 Azure Blob Storage
async function uploadToBlob(filePath, blobName) {
    const sharedKeyCredential = new StorageSharedKeyCredential(
        AZURE_STORAGE_ACCOUNT_NAME,
        AZURE_STORAGE_ACCOUNT_KEY
    );

    const blobServiceClient = new BlobServiceClient(
        `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
        sharedKeyCredential
    );

    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);

    // 确保容器存在
    await containerClient.createIfNotExists({
        access: 'blob' // 设置为公共读取
    });

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // 上传文件
    const uploadResponse = await blockBlobClient.uploadFile(filePath);

    // 生成 SAS token（有效期 24 小时）
    const expiresOn = new Date();
    expiresOn.setHours(expiresOn.getHours() + 24);

    const sasToken = generateBlobSASQueryParameters(
        {
            containerName: AZURE_STORAGE_CONTAINER_NAME,
            blobName: blobName,
            permissions: BlobSASPermissions.parse('r'),
            expiresOn: expiresOn
        },
        sharedKeyCredential
    ).toString();

    const blobUrl = `${blockBlobClient.url}?${sasToken}`;

    return blobUrl;
}

// 上传音频并开始转录
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!checkBlobStorageConfig()) {
            return res.status(500).json({
                error: 'Azure Blob Storage 未配置，请使用 server-sdk.js 或配置 Blob Storage'
            });
        }

        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        console.log('收到文件:', req.file.filename);

        const audioFilePath = path.join(__dirname, 'uploads', req.file.filename);

        // 处理音频文件（必要时转换为单声道 MP3）
        console.log('检查音频格式...');
        const processedAudio = await processAudioFile(audioFilePath, req.file.originalname);

        if (processedAudio.converted) {
            console.log('音频已转换为单声道 MP3');
            // 删除原始文件
            if (fs.existsSync(processedAudio.originalFile)) {
                fs.unlinkSync(processedAudio.originalFile);
                console.log('已删除原始文件:', processedAudio.originalFile);
            }
        }

        // 上传处理后的文件到 Azure Blob Storage
        console.log('正在上传到 Blob Storage...');
        const blobUrl = await uploadToBlob(processedAudio.filePath, processedAudio.fileName);
        console.log('Blob URL:', blobUrl);

        // 创建转录任务
        const transcriptionResponse = await createBatchTranscription(blobUrl, req.file.originalname);

        const transcriptionId = transcriptionResponse.self.split('/').pop().split('?')[0];

        // 保存转录任务信息
        transcriptions.set(transcriptionId, {
            fileName: processedAudio.fileName,
            originalName: req.file.originalname,
            converted: processedAudio.converted,
            status: 'NotStarted',
            createdAt: new Date(),
            blobUrl: blobUrl
        });

        console.log('转录任务已创建:', transcriptionId);

        res.json({
            success: true,
            transcriptionId: transcriptionId,
            message: '转录任务已创建',
            converted: processedAudio.converted,
            processedFileName: processedAudio.fileName
        });

    } catch (error) {
        console.error('转录失败:', error.response?.data || error.message);
        res.status(500).json({
            error: '转录失败: ' + (error.response?.data?.message || error.message)
        });
    }
});

// 创建 Azure Batch Transcription
async function createBatchTranscription(audioUrl, fileName) {
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
        locale: 'en-US',
        displayName: `Transcription-${Date.now()}`
    };

    const response = await axios.post(url, transcriptionDefinition, {
        headers: {
            'Ocp-Apim-Subscription-Key': AZURE_SUBSCRIPTION_KEY,
            'Content-Type': 'application/json'
        }
    });

    return response.data;
}

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

    if (checkBlobStorageConfig()) {
        console.log('Azure Blob Storage 已配置');
    } else {
        console.log('提示：如需使用批量转录 API，请配置 Azure Blob Storage');
        console.log('或使用 server-sdk.js 进行本地转录');
    }
});
