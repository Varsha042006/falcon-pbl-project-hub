import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type Role = "ADMIN" | "COORDINATOR" | "FACULTY" | "SUPERVISOR" | "MENTOR" | "STUDENT";

export type SessionUser = {
  id: number;
  username: string;
  displayName: string;
  role: Role;
  facultyId?: number;
  studentId?: number;
};

const COOKIE = "falcon_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "development-only-secret-change-me"
);

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function requireRole(roles: Role[]) {
  const user = await getSession();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}

export function getRoleRedirectPath(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "COORDINATOR":
      return "/coordinator";
    case "FACULTY":
      return "/faculty";
    case "SUPERVISOR":
      return "/supervisor";
    case "MENTOR":
      return "/mentor";
    case "STUDENT":
    default:
      return "/dashboard";
  }
}
