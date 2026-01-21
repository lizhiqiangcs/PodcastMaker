// Azure 配置 - 从环境变量读取
// 请创建 .env 文件并填入你的配置信息（参考 .env.example）

require('dotenv').config();

module.exports = {
    // Azure Speech Service 配置
    azure: {
        subscriptionKey: process.env.AZURE_SPEECH_KEY || '',
        region: process.env.AZURE_SPEECH_REGION || 'eastus2',
        endpoint: process.env.AZURE_SPEECH_ENDPOINT || ''
    },

    // Azure Blob Storage 配置（仅在使用 server-blob.js 时需要）
    storage: {
        accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
        accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
        containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'audio-files'
    },

    // 服务器配置
    server: {
        port: process.env.PORT || 3000
    }
};
