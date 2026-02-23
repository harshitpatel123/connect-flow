import { UserRepository } from '../infrastructure/user.repository.js';
import { PasswordService } from '../infrastructure/password.service.js';
import { JwtService } from '../infrastructure/jwt.service.js';
import { AuthResponse } from '../domain/types.js';

export class LoginUseCase {
  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService,
    private jwtService: JwtService
  ) {}

  async execute(email: string, password: string): Promise<AuthResponse> {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await this.passwordService.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.jwtService.generateToken({
      userId: user.id,
      email: user.email
    });

    return {
      accessToken: token
    };
  }
}
