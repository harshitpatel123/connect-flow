import { PrismaClient } from "@prisma/client";
import { LoginUserUseCase } from "./application/login.usecase";
import { RegisterUserUseCase } from "./application/register.usecase";
import { UserRepository } from "./infrastructure/user.repository";
import { PasswordService } from "./infrastructure/password.service";
import { JwtService } from "./infrastructure/jwt.service";

export class AuthService {
  private registerUseCase: RegisterUserUseCase;
  private loginUseCase: LoginUserUseCase;
  private userRepository: UserRepository;

  constructor(prisma: PrismaClient) {
    this.userRepository = new UserRepository(prisma);
    const passwordService = new PasswordService();
    const jwtService = new JwtService();
    
    this.registerUseCase = new RegisterUserUseCase(this.userRepository, passwordService, jwtService);
    this.loginUseCase = new LoginUserUseCase(this.userRepository, passwordService, jwtService);
  }

  register(input: { email: string; password: string }) {
    return this.registerUseCase.execute(input);
  }

  login(input: { email: string; password: string }) {
    return this.loginUseCase.execute(input);
  }

  getUsersByIds(userIds: string[]) {
    return this.userRepository.findByIds(userIds);
  }

  getUser(userId: string) {
    console.log("🔍 [AUTH SERVICE] Getting user by ID:", userId);
    return this.userRepository.findById(userId);
  }
}
