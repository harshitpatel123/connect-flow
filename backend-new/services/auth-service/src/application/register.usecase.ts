import { UserRepository } from '../infrastructure/user.repository.js';
import { PasswordService } from '../infrastructure/password.service.js';
import { JwtService } from '../infrastructure/jwt.service.js';
import { validateRegisterInput } from '../domain/validation.js';
import { AuthResponse } from '../domain/types.js';

export class RegisterUseCase {
  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService,
    private jwtService: JwtService
  ) {}

  async execute(email: string, password: string): Promise<AuthResponse> {
    validateRegisterInput(email, password);

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await this.passwordService.hash(password);
    const user = await this.userRepository.create(email, passwordHash);

    const token = this.jwtService.generateToken({
      userId: user.id,
      email: user.email
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email
      }
    };
  }
}
