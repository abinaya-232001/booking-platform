import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: '1', email: 'a@a.com' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('token') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('value') },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should register a new user and return tokens', async () => {
    const result = await authService.register({
      email: 'a@a.com',
      password: 'password123',
    });
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  it('should throw ConflictException if email already exists', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue({ id: '1' });
    await expect(
      authService.register({ email: 'a@a.com', password: 'password123' }),
    ).rejects.toThrow(ConflictException);
  });
});