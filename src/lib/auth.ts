import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = process.env.JWT_SECRET;

if (!secret || secret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

const secretKey = new TextEncoder().encode(secret);

const COOKIE_NAME = "token";

export async function createToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifyAuthToken(token: string | undefined) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey);

    if (typeof payload.userId !== "string") return null;

    return payload.userId;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey);

    if (typeof payload.userId !== "string") return null;

    return payload.userId;
  } catch {
    return null;
  }
}
