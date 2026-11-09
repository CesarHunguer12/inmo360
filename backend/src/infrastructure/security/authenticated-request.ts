import { Request } from 'express';
import { AuthenticatedUser } from '../../domain/entities/user.entity';

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
