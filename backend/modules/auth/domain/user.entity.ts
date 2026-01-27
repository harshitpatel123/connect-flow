export class AuthUser {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly isActive: boolean
  ) {}
}
