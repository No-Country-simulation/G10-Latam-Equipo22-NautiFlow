import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

dotenv.config({ path: ['.env', '../.env'] });

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const seedDemoUsers = process.env.SEED_DEMO_USERS === 'true';
const zones = [
  { nombre: 'Delta del Tigre', descripcion: 'Canales del delta entre Tigre y el río Luján' },
  { nombre: 'San Fernando', descripcion: 'Ribera norte de San Fernando y rada exterior' },
  { nombre: 'Escobar', descripcion: 'Delta medio y costa de Escobar' },
];

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    for (const zone of zones) {
      await prisma.zona.upsert({
        where: { nombre: zone.nombre },
        update: { descripcion: zone.descripcion },
        create: { ...zone, activa: true },
      });
    }
    console.log(`Seed de zonas listo: ${zones.length} zonas.`);

    if (!adminEmail || !adminPassword) {
      console.warn('Admin omitido: definí SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en el .env.');
    } else {
      if (adminPassword.length < 16 || /reemplazar|placeholder|cambiar/i.test(adminPassword)) {
        throw new Error('SEED_ADMIN_PASSWORD debe ser una clave propia de al menos 16 caracteres.');
      }

      const passwordHash = await bcrypt.hash(adminPassword, 12);
      const admin = await prisma.user.upsert({
        where: { email: adminEmail.trim().toLowerCase() },
        update: {},
        create: { name: 'Administración NautiFlow', email: adminEmail.trim().toLowerCase(), passwordHash, role: 'ADMIN' },
      });
      console.log(`Seed listo. Admin: ${admin.email} (${admin.id})`);
    }

    if (seedDemoUsers) {
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('Las cuentas demo solo se pueden crear con NODE_ENV=development.');
      }

      const demoPasswords = {
        owner: process.env.SEED_DEMO_OWNER_PASSWORD,
        client: process.env.SEED_DEMO_CLIENT_PASSWORD,
        admin: process.env.SEED_DEMO_ADMIN_PASSWORD,
      };
      if (Object.values(demoPasswords).some((password) => !password || password.length < 12)) {
        throw new Error('Definí las tres contraseñas demo, cada una con al menos 12 caracteres.');
      }

      const ownerEmail = 'lanchero@nautiflow.test';
      const clientEmail = 'cliente@nautiflow.test';
      const demoAdminEmail = 'admin@nautiflow.test';

      const [ownerHash, clientHash, demoAdminHash] = await Promise.all([
        bcrypt.hash(demoPasswords.owner!, 12),
        bcrypt.hash(demoPasswords.client!, 12),
        bcrypt.hash(demoPasswords.admin!, 12),
      ]);

      const owner = await prisma.user.upsert({
        where: { email: ownerEmail },
        update: {},
        create: {
          name: 'Carlos Ramírez',
          email: ownerEmail,
          passwordHash: ownerHash,
          role: 'OWNER',
          owner: { create: { status: 'PENDING' } },
        },
      });
      const client = await prisma.user.upsert({
        where: { email: clientEmail },
        update: {},
        create: {
          name: 'María González',
          email: clientEmail,
          passwordHash: clientHash,
          role: 'CLIENT',
          client: {
            create: {
              nombre: 'María González',
              telefono: '+540000000000',
              email: clientEmail,
            },
          },
        },
      });
      const demoAdmin = await prisma.user.upsert({
        where: { email: demoAdminEmail },
        update: {},
        create: {
          name: 'Admin NautiFlow',
          email: demoAdminEmail,
          passwordHash: demoAdminHash,
          role: 'ADMIN',
        },
      });

      console.log(`Usuarios demo listos (sin actualizar registros existentes): ${owner.email}, ${client.email}, ${demoAdmin.email}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Seed falló:', error);
  process.exit(1);
});
