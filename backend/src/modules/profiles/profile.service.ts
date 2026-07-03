import { Types } from "mongoose";
import {
  PROFILE_COLORS,
  Profile,
  type ProfileColor,
  type ProfileDocument,
} from "./profile.model.js";

const MAX_PROFILES = 5;
const DEFAULT_PROFILE_NAME = "you";
const DEFAULT_PROFILE_COLOR: ProfileColor = "#e50914";

export function formatProfile(profile: ProfileDocument) {
  return {
    id: profile._id.toString(),
    name: profile.name,
    color: profile.color,
    isDefault: profile.isDefault,
    createdAt: profile.createdAt,
  };
}

export async function ensureDefaultProfile(
  userId: string
): Promise<ProfileDocument> {
  const existing = await Profile.findOne({
    userId: new Types.ObjectId(userId),
    isDefault: true,
  });

  if (existing) return existing;

  const anyProfile = await Profile.findOne({
    userId: new Types.ObjectId(userId),
  });
  if (anyProfile) return anyProfile;

  return Profile.create({
    userId: new Types.ObjectId(userId),
    name: DEFAULT_PROFILE_NAME,
    color: DEFAULT_PROFILE_COLOR,
    isDefault: true,
  });
}

export async function listProfiles(userId: string) {
  await ensureDefaultProfile(userId);
  const profiles = await Profile.find({
    userId: new Types.ObjectId(userId),
  }).sort({ isDefault: -1, createdAt: 1 });

  return profiles.map(formatProfile);
}

export async function createProfile(
  userId: string,
  input: { name: string; color?: string }
) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Profile name is required.");
  }
  if (name.length > 20) {
    throw new Error("Profile name must be 20 characters or fewer.");
  }

  const count = await Profile.countDocuments({
    userId: new Types.ObjectId(userId),
  });
  if (count >= MAX_PROFILES) {
    throw new Error(`You can have at most ${MAX_PROFILES} profiles.`);
  }

  const duplicate = await Profile.findOne({
    userId: new Types.ObjectId(userId),
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });
  if (duplicate) {
    throw new Error("A profile with this name already exists.");
  }

  const color =
    input.color && PROFILE_COLORS.includes(input.color as ProfileColor)
      ? input.color
      : PROFILE_COLORS[count % PROFILE_COLORS.length];

  const profile = await Profile.create({
    userId: new Types.ObjectId(userId),
    name,
    color,
    isDefault: false,
  });

  return formatProfile(profile);
}
