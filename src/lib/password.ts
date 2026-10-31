import bcrypt from "bcryptjs";

// Hash a password before saving it
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

// Compare a login password with its stored hash
export async function comparePassword(
  password: string,
  hashedPassword: string,
) {
  return bcrypt.compare(password, hashedPassword);
}
