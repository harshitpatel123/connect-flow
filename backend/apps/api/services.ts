import { PrismaClient } from "@prisma/client";
import { RegisterUserUseCase } from "../../modules/auth/application/register.usecase";
import { LoginUserUseCase } from "../../modules/auth/application/login.usecase";
import { UserRepository } from "../../modules/auth/infrastructure/user.repository";
import { PasswordService } from "../../modules/auth/infrastructure/password.service";
import { JwtService } from "../../modules/auth/infrastructure/jwt.service";
import { AuthService } from "../../modules/auth/authService";

const prisma = new PrismaClient();

const userRepo = new UserRepository(prisma);
const passwordService = new PasswordService();
const jwtService = new JwtService();

const registerUseCase = new RegisterUserUseCase(
  userRepo,
  passwordService,
  jwtService
);

const loginUseCase = new LoginUserUseCase(
  userRepo,
  passwordService,
  jwtService
);

export const authService = new AuthService(
  registerUseCase,
  loginUseCase
);
