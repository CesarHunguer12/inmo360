import { PrismaClient, PropertyModality, PropertyStatus, PropertyType, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcrypt';

function required(name: string) {
  const value = process.env[name];
  if (!value || value.startsWith('replace_')) {
    throw new Error(`Set ${name} to a development-only value before running the seed.`);
  }
  return value;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: required('DATABASE_URL') })
});

async function seedUser(input: { email: string; password: string; fullName: string; role: UserRole }) {
  const passwordHash = await hash(input.password, 12);
  return prisma.user.upsert({
    where: { email: input.email.toLowerCase() },
    create: {
      email: input.email.toLowerCase(),
      fullName: input.fullName,
      passwordHash,
      role: input.role
    },
    update: { fullName: input.fullName, passwordHash, role: input.role, isActive: true }
  });
}

async function main() {
  const admin = await seedUser({
    email: required('DEMO_ADMIN_EMAIL'),
    password: required('DEMO_ADMIN_PASSWORD'),
    fullName: 'DEMO — Administrador',
    role: UserRole.ADMINISTRADOR
  });
  const agent = await seedUser({
    email: required('DEMO_AGENT_EMAIL'),
    password: required('DEMO_AGENT_PASSWORD'),
    fullName: 'DEMO — Agente',
    role: UserRole.AGENTE
  });
  const client = await seedUser({
    email: required('DEMO_CLIENT_EMAIL'),
    password: required('DEMO_CLIENT_PASSWORD'),
    fullName: 'DEMO — Cliente',
    role: UserRole.CLIENTE
  });
  const owner = await prisma.owner.upsert({
    where: { id: '00000000-0000-4000-8000-000000000101' },
    create: {
      id: '00000000-0000-4000-8000-000000000101',
      fullName: 'DEMO — Propietario',
      phone: '+591 00000000',
      notes: 'Registro de demostración insertado por el seed.'
    },
    update: { fullName: 'DEMO — Propietario' }
  });

  const property = await prisma.property.upsert({
    where: { code: 'DEMO-LPZ-001' },
    create: {
      code: 'DEMO-LPZ-001',
      title: 'DEMO — Departamento de ejemplo en La Paz',
      description: 'Registro demostrativo. No representa una oferta inmobiliaria real.',
      modality: PropertyModality.VENTA,
      type: PropertyType.DEPARTAMENTO,
      status: PropertyStatus.DISPONIBLE,
      price: '125000.00',
      zone: 'Zona de demostración',
      address: 'Dirección demostrativa, La Paz',
      bedrooms: 2,
      bathrooms: 1,
      areaM2: '72.00',
      hasGarage: false,
      features: ['DEMO'],
      ownerId: owner.id,
      agentId: agent.id
    },
    update: { title: 'DEMO — Departamento de ejemplo en La Paz', isDeleted: false }
  });

  await prisma.clientPreference.upsert({
    where: { clientId: client.id },
    create: {
      clientId: client.id,
      maxBudget: '150000.00',
      zones: ['Zona de demostración'],
      modalities: [PropertyModality.VENTA],
      types: [PropertyType.DEPARTAMENTO],
      minBedrooms: 1,
      features: []
    },
    update: {}
  });

  const opportunity = await prisma.opportunity.upsert({
    where: { id: '00000000-0000-4000-8000-000000000201' },
    create: {
      id: '00000000-0000-4000-8000-000000000201',
      clientId: client.id,
      propertyId: property.id,
      agentId: agent.id,
      stage: 'VISITA_PROGRAMADA'
    },
    update: {
      clientId: client.id,
      propertyId: property.id,
      agentId: agent.id,
      stage: 'VISITA_PROGRAMADA'
    }
  });

  await prisma.visit.upsert({
    where: { id: '00000000-0000-4000-8000-000000000301' },
    create: {
      id: '00000000-0000-4000-8000-000000000301',
      clientId: client.id,
      propertyId: property.id,
      agentId: agent.id,
      opportunityId: opportunity.id,
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PENDIENTE',
      notes: 'DEMO — Visita de desarrollo; no es una cita real.'
    },
    update: {
      clientId: client.id,
      propertyId: property.id,
      agentId: agent.id,
      opportunityId: opportunity.id,
      status: 'PENDIENTE',
      notes: 'DEMO — Visita de desarrollo; no es una cita real.'
    }
  });

  console.info(`Development-only seed completed for ${admin.email}, ${agent.email}, and ${client.email}.`);
}

main()
  .catch((error: unknown) => {
    console.error('Development seed failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
