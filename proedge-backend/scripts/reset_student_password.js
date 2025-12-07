const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'student1@proedge.com';
    const newPassword = 'admin123';

    console.log(`Resetting password for ${email}...`);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error('User not found!');
        return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { email },
        data: {
            passwordHash,
            status: 'ACTIVE' // Ensure they are active too
        }
    });

    console.log(`Password for ${email} has been reset to: ${newPassword}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
