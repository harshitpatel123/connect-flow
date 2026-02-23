import { Router, Request, Response } from 'express';
import { RegisterUseCase } from '../application/register.usecase.js';
import { LoginUseCase } from '../application/login.usecase.js';
import { UserRepository } from '../infrastructure/user.repository.js';
import { PasswordService } from '../infrastructure/password.service.js';
import { JwtService } from '../infrastructure/jwt.service.js';
import { prisma } from '../infrastructure/prisma.client.js';

const router = Router();

// Initialize dependencies
const userRepository = new UserRepository(prisma);
const passwordService = new PasswordService();
const jwtService = new JwtService();
const registerUseCase = new RegisterUseCase(userRepository, passwordService, jwtService);
const loginUseCase = new LoginUseCase(userRepository, passwordService, jwtService);

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log(`[AUTH-SERVICE] Processing register for email: ${email}`);
    const result = await registerUseCase.execute(email, password);
    res.status(201).json(result);
  } catch (error: any) {
    console.error(`[AUTH-SERVICE] ❌ Register failed: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log(`[AUTH-SERVICE] Processing login for email: ${email}`);
    const result = await loginUseCase.execute(email, password);
    res.status(200).json(result);
  } catch (error: any) {
    console.error(`[AUTH-SERVICE] ❌ Login failed: ${error.message}`);
    res.status(401).json({ error: error.message });
  }
});

// POST /auth/validate (for API Gateway)
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    const payload = jwtService.verifyToken(token);
    res.status(200).json(payload);
  } catch (error: any) {
    console.error(`[AUTH-SERVICE] ❌ Token validation failed: ${error.message}`);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// GET /auth/user/:id (for API Gateway)
router.get('/user/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userRepository.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({
      id: user.id,
      email: user.email
    });
  } catch (error: any) {
    console.error(`[AUTH-SERVICE] ❌ Get user failed: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// POST /auth/users/batch (for API Gateway - get multiple users)
router.post('/users/batch', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids must be an array' });
    }
    const users = await userRepository.findByIds(ids);
    res.status(200).json(users.map(u => ({
      id: u.id,
      email: u.email
    })));
  } catch (error: any) {
    console.error(`[AUTH-SERVICE] ❌ Batch get users failed: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

export default router;
