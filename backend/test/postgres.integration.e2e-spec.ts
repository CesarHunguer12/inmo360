import { UserRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaPropertyImageRepository } from '../src/adapters/outbound/persistence/prisma/prisma-property-image.repository';
import { PrismaRealEstateRepository } from '../src/adapters/outbound/persistence/prisma/prisma-real-estate.repository';
import { PrismaReportsRepository } from '../src/adapters/outbound/persistence/prisma/prisma-reports.repository';
import { PrismaUserAdministrationRepository } from '../src/adapters/outbound/persistence/prisma/prisma-user-administration.repository';
import { PrismaService } from '../src/adapters/outbound/persistence/prisma/prisma.service';

const connectionString = process.env.TEST_DATABASE_URL;
const suite = connectionString ? describe : describe.skip;

if (connectionString) {
  const databaseName = new URL(connectionString).pathname.replace(/^\//, '');
  if (!databaseName.endsWith('_test')) {
    throw new Error('PostgreSQL integration tests require a dedicated database whose name ends in _test.');
  }
}

suite('PostgreSQL integration (dedicated *_test database only)', () => {
  let prisma: PrismaService;
  let userRepository: PrismaUserAdministrationRepository;
  let realEstateRepository: PrismaRealEstateRepository;
  let imageRepository: PrismaPropertyImageRepository;
  let reportsRepository: PrismaReportsRepository;
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const agentEmail = `integration-agent-${suffix}@example.test`;
  const otherAgentEmail = `integration-other-${suffix}@example.test`;
  const clientEmail = `integration-client-${suffix}@example.test`;
  const crudEmail = `crud-${suffix}@example.test`;
  const actor = { id: '', role: 'AGENTE' as const };
  let ownerId: string;
  let otherOwnerId: string;
  let propertyId: string;
  let otherPropertyId: string;
  const propertyIds: string[] = [];
  let agentId: string;
  let otherAgentId: string;
  let clientId: string;
  let reportFrom: Date;
  let reportTo: Date;

  beforeAll(async () => {
    if (!connectionString) throw new Error('TEST_DATABASE_URL is required.');
    prisma = new PrismaService(new ConfigService({ DATABASE_URL: connectionString }));
    await prisma.$connect();
    userRepository = new PrismaUserAdministrationRepository(prisma);
    realEstateRepository = new PrismaRealEstateRepository(prisma);
    imageRepository = new PrismaPropertyImageRepository(prisma);
    reportsRepository = new PrismaReportsRepository(prisma);

    const [agent, otherAgent] = await Promise.all([
      prisma.user.create({
        data: { email: agentEmail, fullName: 'Integration Agent', passwordHash: 'test-hash', role: UserRole.AGENTE }
      }),
      prisma.user.create({
        data: { email: otherAgentEmail, fullName: 'Other Integration Agent', passwordHash: 'test-hash', role: UserRole.AGENTE }
      })
    ]);
    agentId = agent.id;
    otherAgentId = otherAgent.id;
    actor.id = agent.id;
    const client = await prisma.user.create({
      data: { email: clientEmail, fullName: 'Integration Client', passwordHash: 'test-hash', role: UserRole.CLIENTE }
    });
    clientId = client.id;
    const owner = await realEstateRepository.createOwner(actor, {
      fullName: 'Integration Owner',
      email: `owner-${suffix}@example.test`,
      phone: '5550100',
      notes: 'Fixture de integración automatizada'
    }) as { id: string };
    ownerId = owner.id;
    const otherOwner = await prisma.owner.create({
      data: {
        fullName: 'Other Integration Owner',
        phone: '5550101',
        notes: 'Separate fixture for agent-scope verification'
      }
    });
    otherOwnerId = otherOwner.id;
    const propertyData = {
      code: `IT-${suffix.slice(-24)}`,
      title: 'Integration test property',
      description: 'Property fixture used only by the PostgreSQL integration test.',
      modality: 'VENTA' as const,
      type: 'CASA' as const,
      status: 'DISPONIBLE' as const,
      price: '100000.00',
      areaM2: '90.00',
      zone: 'Integration Test',
      address: 'Integration test address',
      ownerId,
      bedrooms: 2,
      bathrooms: 1,
      hasGarage: false,
      agentId: agent.id
    };
    reportFrom = new Date(Date.now() - 2_000);
    const property = await prisma.property.create({ data: propertyData });
    propertyId = property.id;
    propertyIds.push(property.id);
    const additionalProperty = await prisma.property.create({ data: { ...propertyData, code: `IA-${suffix.slice(-24)}` } });
    propertyIds.push(additionalProperty.id);
    const otherProperty = await prisma.property.create({
      data: {
        ...propertyData,
        code: `OT-${suffix.slice(-24)}`,
        ownerId: otherOwner.id,
        agentId: otherAgent.id
      }
    });
    reportTo = new Date(Date.now() + 2_000);
    otherPropertyId = otherProperty.id;
    propertyIds.push(otherProperty.id);
  });

  afterAll(async () => {
    if (!prisma) return;
    if (propertyIds.length) {
      await prisma.propertyImage.deleteMany({
        where: { propertyId: { in: propertyIds } }
      });
      await prisma.property.deleteMany({ where: { id: { in: propertyIds } } });
    }
    if (ownerId) await prisma.owner.deleteMany({ where: { id: ownerId } });
    if (otherOwnerId) await prisma.owner.deleteMany({ where: { id: otherOwnerId } });
    await prisma.user.deleteMany({
      where: { email: { in: [agentEmail, otherAgentEmail, clientEmail, crudEmail] } }
    });
    await prisma.$disconnect();
  });

  it('creates, reads, updates and deactivates user records through the Prisma adapter', async () => {
    const created = await userRepository.createUser({
      email: crudEmail,
      fullName: 'CRUD Test User',
      passwordHash: 'test-hash',
      role: UserRole.CLIENTE
    }) as { id: string; email: string };
    expect(created.email).toBe(crudEmail);
    await userRepository.updateUser(created.id, { fullName: 'Updated CRUD Test User' });
    expect((await userRepository.getUser(created.id) as { fullName: string }).fullName).toBe('Updated CRUD Test User');
    await userRepository.setUserActive(created.id, false);
    expect((await userRepository.getUser(created.id) as { isActive: boolean }).isActive).toBe(false);
  });

  it('persists owner and photograph changes, and blocks an agent from another agent property', async () => {
    await realEstateRepository.updateOwner(actor, ownerId, { fullName: 'Updated Integration Owner' });
    const owner = await realEstateRepository.getOwner(actor, ownerId) as { fullName: string; properties: unknown[] };
    expect(owner.fullName).toBe('Updated Integration Owner');
    expect(owner.properties).toHaveLength(2);
    const image = await imageRepository.add(actor, propertyId, {
      url: 'https://example.test/integration.jpg',
      position: 0,
      caption: 'Integration photo'
    }) as { id: string };
    expect(await imageRepository.list(actor, propertyId)).toHaveLength(1);
    await imageRepository.update(actor, propertyId, image.id, { caption: 'Updated integration photo' });
    expect((await imageRepository.list(actor, propertyId) as Array<{ caption: string }>)[0].caption)
      .toBe('Updated integration photo');
    await expect(imageRepository.list(actor, otherPropertyId)).rejects.toThrow();
    await imageRepository.remove(actor, propertyId, image.id);
    expect(await imageRepository.list(actor, propertyId)).toHaveLength(0);
  });

  it('returns report rows from PostgreSQL while restricting agent scope', async () => {
    const records = await reportsRepository.get(actor, 'properties', reportFrom, reportTo) as Array<{ _count: { _all: number } }>;
    const agentTotal = records.reduce((total, row) => total + row._count._all, 0);
    expect(agentTotal).toBe(2);
    const inquiries = await reportsRepository.get(actor, 'inquiries', reportFrom, reportTo) as unknown[];
    expect(Array.isArray(inquiries)).toBe(true);
    const otherActor = { id: otherAgentId, role: 'AGENTE' as const };
    const isolated = await reportsRepository.get(otherActor, 'properties', reportFrom, reportTo) as Array<{ _count: { _all: number } }>;
    expect(isolated.reduce((total, row) => total + row._count._all, 0)).toBe(1);
    const csv = await reportsRepository.exportCsv(actor, 'properties', reportFrom, reportTo);
    expect(csv).toContain('modality,status,_count');
    expect(agentId).not.toBe(otherAgentId);
    expect(clientId).toBeTruthy();
  });
});
