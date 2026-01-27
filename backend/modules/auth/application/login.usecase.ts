import { JwtService } from "../infrastructure/jwt.service";
import { PasswordService } from "../infrastructure/password.service";
import { UserRepository } from "../infrastructure/user.repository";
import { validateEmail } from "../domain/validation";

export class LoginUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService,
    private jwtService: JwtService
  ) {}

  async execute(input: { email: string; password: string }) {
    validateEmail(input.email);

    const user = await this.userRepository.findByEmail(input.email);
    if (!user) throw new Error("Invalid credentials");

    const valid = await this.passwordService.compare(
      input.password,
      user.passwordHash
    );
    if (!valid) throw new Error("Invalid credentials");

    return {
      accessToken: this.jwtService.generateToken({
        userId: user.id,
        email: user.email
      })
    };
  }
}
