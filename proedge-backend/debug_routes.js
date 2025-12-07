const path = require('path');

async function check() {
    const r = './src/controllers/admin.student.controller.js';
    try {
        console.log(`Checking ${r}...`);
        require(r);
        console.log(`✅ ${r} Loaded`);
    } catch (e) {
        console.error(`❌ ${r} FAILED:`);
        console.error(e);
    }
}

check();
Schedule