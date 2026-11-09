import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  hash(plainText: string) {
    return hash(plainText, 12);
  }

  verify(plainText: string, passwordHash: string) {
    return compare(plainText, passwordHash);
  }
}
