const http = require('http');

function postLogin(email, password, role) {
    const data = JSON.stringify({ email, password });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
        },
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log(`✅ ${role} Login: SUCCESS`);
                        console.log(`   User: ${parsed.data.user.email} (${parsed.data.user.role})`);
                        console.log(`   Token: ${parsed.data.token ? 'Received' : 'Missing'}`);
                        resolve(true);
                    } else {
                        console.error(`❌ ${role} Login: FAILED (Status ${res.statusCode})`);
                        console.error(`   Message: ${parsed.message || body}`);
                        resolve(false);
                    }
                } catch (e) {
                    console.error(`❌ ${role} Login: FAILED (Parse Error)`);
                    console.error(`   Body: ${body}`);
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`❌ ${role} Login: ERROR (${e.message})`);
            resolve(false);
        });

        req.write(data);
        req.end();
    });
}

async function verify() {
    console.log('Verifying Logins...');
    console.log('Target: http://localhost:3000/api/auth/login\n');

    // Test Admin
    await postLogin('admin@proedge.com', 'admin123', 'Admin');

    // Test Student
    await postLogin('student1@proedge.com', 'student123', 'Student');
}

verify();
