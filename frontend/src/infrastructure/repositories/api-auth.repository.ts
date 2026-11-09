import type { AuthRepository } from '../../domain/repositories/auth.repository';
import type { Session, User } from '../../domain/entities/user';
import { httpClient, TOKEN_KEY } from '../api/http-client';

export class ApiAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<Session> {
    const { data } = await httpClient.post<Session>('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    return data;
  }

  async register(input: { email: string; fullName: string; password: string; phone?: string }) {
    const { data } = await httpClient.post<User>('/auth/register', input);
    return data;
  }

  async currentUser() {
    const { data } = await httpClient.get<User>('/auth/me');
    return data;
  }

  async logout() {
    // JWT logout is stateless in the API; discarding the client token ends this session.
    localStorage.removeItem(TOKEN_KEY);
  }
}
