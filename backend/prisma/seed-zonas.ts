import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

dotenv.config({ path: ['.env', '../.env'] });

const zonas = [
  {
    nombre: 'Delta del Tigre',
    descripcion: 'Canales del delta entre Tigre y el río Luján',
  },
  {
    nombre: 'San Fernando',
    descripcion: 'Ribera norte de San Fernando y rada exterior',
  },
  {
    nombre: 'Escobar',
    descripcion: 'Delta medio y costa de Escobar',
  },
];

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    for (const zona of zonas) {
      const creada = await prisma.zona.upsert({
        where: { nombre: zona.nombre },
        update: { descripcion: zona.descripcion },
        create: { ...zona, activa: true },
      });
      console.log(`Zona lista: ${creada.nombre} (${creada.id})`);
    }
    console.log(`Seed de zonas listo: ${zonas.length} zonas.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Seed de zonas falló:', error);
  process.exit(1);
});
