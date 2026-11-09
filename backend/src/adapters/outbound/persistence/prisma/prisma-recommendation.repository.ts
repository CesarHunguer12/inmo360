import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  PreferenceSnapshot,
  RecommendationCandidate,
  RecommendationRepository
} from '../../../../domain/ports/recommendation-repository.port';

@Injectable()
export class PrismaRecommendationRepository implements RecommendationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(clientId: string): Promise<PreferenceSnapshot | null> {
    const record = await this.prisma.clientPreference.findUnique({ where: { clientId } });
    if (!record) return null;
    return {
      minBudget: record.minBudget?.toNumber() ?? null,
      maxBudget: record.maxBudget?.toNumber() ?? null,
      zones: record.zones,
      modalities: record.modalities,
      types: record.types,
      minBedrooms: record.minBedrooms,
      minBathrooms: record.minBathrooms,
      minAreaM2: record.minAreaM2?.toNumber() ?? null,
      requiresGarage: record.requiresGarage,
      features: record.features
    };
  }

  async listAvailableProperties(): Promise<RecommendationCandidate[]> {
    const records = await this.prisma.property.findMany({
      where: { status: 'DISPONIBLE', isDeleted: false },
      select: {
        id: true,
        code: true,
        title: true,
        modality: true,
        type: true,
        price: true,
        zone: true,
        bedrooms: true,
        bathrooms: true,
        areaM2: true,
        hasGarage: true,
        features: true
      }
    });
    return records.map((record) => ({
      ...record,
      price: record.price.toNumber(),
      areaM2: record.areaM2.toNumber()
    }));
  }
}
