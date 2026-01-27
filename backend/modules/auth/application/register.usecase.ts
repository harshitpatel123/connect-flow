import { JwtService } from "../infrastructure/jwt.service";
import { PasswordService } from "../infrastructure/password.service";
import { UserRepository } from "../infrastructure/user.repository";
import { validateEmail, validatePassword } from "../domain/validation";

export class RegisterUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService,
    private jwtService: JwtService
  ) {}

  async execute(input: { email: string; password: string }) {
    validateEmail(input.email);
    validatePassword(input.password);

    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) throw new Error("User already exists");

    const hash = await this.passwordService.hash(input.password);
    const user = await this.userRepository.create(input.email, hash);

    return {
      accessToken: this.jwtService.generateToken({
        userId: user.id,
        email: user.email
      })
    };
  }
}
