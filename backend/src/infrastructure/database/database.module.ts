import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../../adapters/outbound/persistence/prisma/prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class DatabaseModule {}
