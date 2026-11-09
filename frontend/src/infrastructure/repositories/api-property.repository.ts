import type { Property, PropertyFilters } from '../../domain/entities/property';
import type { PropertyRepository, PropertyWrite } from '../../domain/repositories/property.repository';
import { httpClient } from '../api/http-client';

export class ApiPropertyRepository implements PropertyRepository {
  async list(filters: PropertyFilters = {}, managed = false) {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined),
    );
    const { data } = await httpClient.get<Property[]>(managed ? '/properties/managed' : '/properties', { params });
    return data;
  }

  async get(id: string) {
    const { data } = await httpClient.get<Property>(`/properties/${id}`);
    return data;
  }

  async create(input: PropertyWrite) {
    const { data } = await httpClient.post<Property>('/properties', input);
    return data;
  }

  async update(id: string, input: Partial<PropertyWrite>) {
    const { data } = await httpClient.patch<Property>(`/properties/${id}`, input);
    return data;
  }
}
