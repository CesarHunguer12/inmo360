import type { DashboardData, Recommendation } from '../../domain/entities/dashboard';
import type { User } from '../../domain/entities/user';
import type { ClientPreference, Favorite, Owner, RealEstateRepository } from '../../domain/repositories/real-estate.repository';
import { httpClient } from '../api/http-client';

export class ApiRealEstateRepository implements RealEstateRepository {
  async dashboard(role: User['role']) {
    const route = role === 'ADMINISTRADOR' ? '/dashboard/admin' : '/dashboard/agent';
    const { data } = await httpClient.get<DashboardData>(route);
    return data;
  }

  async users() {
    const { data } = await httpClient.get<User[]>('/users');
    return data;
  }

  async clients() {
    const { data } = await httpClient.get<User[]>('/clients');
    return data;
  }

  async owners() {
    const { data } = await httpClient.get<Owner[]>('/owners');
    return data;
  }

  async getOwner(id: string) {
    const { data } = await httpClient.get<Owner>(`/owners/${id}`);
    return data;
  }

  async createOwner(input: Omit<Owner, 'id' | '_count' | 'properties'>) {
    const { data } = await httpClient.post<Owner>('/owners', input);
    return data;
  }

  async updateOwner(id: string, input: Partial<Omit<Owner, 'id' | '_count' | 'properties'>>) {
    const { data } = await httpClient.patch<Owner>(`/owners/${id}`, input);
    return data;
  }

  async recommendations() {
    const { data } = await httpClient.get<Recommendation[]>('/recommendations/me');
    return data;
  }

  async preferences() {
    const { data } = await httpClient.get<ClientPreference | null>('/preferences/me');
    return data;
  }

  async savePreferences(input: ClientPreference) {
    const { data } = await httpClient.put<ClientPreference>('/preferences/me', input);
    return data;
  }

  async favorites() {
    const { data } = await httpClient.get<Favorite[]>('/favorites');
    return data;
  }

  async addFavorite(propertyId: string) {
    const { data } = await httpClient.post<Favorite>('/favorites', { propertyId });
    return data;
  }

  async removeFavorite(id: string) {
    await httpClient.delete(`/favorites/${id}`);
  }

  async inquiries() {
    const { data } = await httpClient.get<Array<Record<string, unknown>>>('/inquiries/agent');
    return data;
  }

  async visits() {
    const { data } = await httpClient.get<Array<Record<string, unknown>>>('/visits');
    return data;
  }

  async opportunities() {
    const { data } = await httpClient.get<Array<Record<string, unknown>>>('/opportunities');
    return data;
  }

  async createInquiry(propertyId: string, message: string) {
    const { data } = await httpClient.post('/inquiries', { propertyId, message });
    return data;
  }

  async createVisit(propertyId: string, scheduledAt: string, notes?: string) {
    const { data } = await httpClient.post('/visits', { propertyId, scheduledAt, notes });
    return data;
  }
}
