import { LoginUserUseCase } from "./application/login.usecase";
import { RegisterUserUseCase } from "./application/register.usecase";

export class AuthService {
  constructor(
    private registerUseCase: RegisterUserUseCase,
    private loginUseCase: LoginUserUseCase
  ) {}

  register(input: { email: string; password: string }) {
    return this.registerUseCase.execute(input);
  }

  login(input: { email: string; password: string }) {
    return this.loginUseCase.execute(input);
  }
}
