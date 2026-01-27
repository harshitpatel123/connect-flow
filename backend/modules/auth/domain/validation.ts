export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new ValidationError("Invalid email format");
  }
};

export const validatePassword = (password: string): void => {
  if (!password || password.length < 6) {
    throw new ValidationError("Password must be at least 6 characters");
  }
};
