import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../../config/env.js";
import { ensureDefaultProfile } from "../profiles/profile.service.js";
import { User, type UserDocument } from "../users/user.model.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AuthTokenPayload {
  sub: string;
  email: string;
}

export function formatUser(user: UserDocument) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

export function signToken(user: UserDocument): string {
  const payload: AuthTokenPayload = {
    sub: user._id.toString(),
    email: user.email,
  };
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as SignOptions);
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}

function validateCredentials(email: string, password: string): void {
  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
}

export async function registerUser(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ user: UserDocument; token: string }> {
  const email = input.email.trim().toLowerCase();
  validateCredentials(email, input.password);

  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({
    email,
    name: input.name?.trim() ?? "",
    passwordHash,
  });

  await ensureDefaultProfile(user._id.toString());

  return { user, token: signToken(user) };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user: UserDocument; token: string }> {
  const email = input.email.trim().toLowerCase();
  validateCredentials(email, input.password);

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw new Error("Incorrect email or password.");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new Error("Incorrect email or password.");
  }

  return { user, token: signToken(user) };
}

export async function getUserById(id: string): Promise<UserDocument | null> {
  return User.findById(id);
}

export async function emailExists(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalized)) return false;
  const user = await User.findOne({ email: normalized }).select("_id");
  return Boolean(user);
}
