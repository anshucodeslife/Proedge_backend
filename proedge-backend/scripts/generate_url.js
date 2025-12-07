const s3Service = require('../src/services/s3.service');
const fs = require('fs');

async function generate() {
    try {
        const key = 'lessons/videos/Commercial AD 1.MOV';
        const url = await s3Service.getSignedUrl(key, 3600); // 1 hour expiry

        fs.writeFileSync('temp_url.txt', url);
        console.log('URL written to temp_url.txt');

    } catch (error) {
        console.error('Error:', error);
    }
}

generate();
