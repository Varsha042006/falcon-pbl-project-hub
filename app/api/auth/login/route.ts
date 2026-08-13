import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { createSession, getRoleRedirectPath, Role } from "@/lib/auth";

type UserRecord = {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  role: Role;
  faculty_id?: number;
  student_id?: number;
};

export async function POST(req: Request) {
  const formData = await req.formData();
  const identifier = String(formData.get("identifier") || formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const roleType = String(formData.get("role_type") || "ALL").trim().toUpperCase();

  if (!identifier || !password) {
    return NextResponse.redirect(new URL("/login?error=1", req.url), 303);
  }

  let users: UserRecord[] = [];

  // 1. Direct query in users table
  if (roleType === "STUDENT") {
    users = await query<UserRecord>(
      `
      SELECT u.* 
      FROM users u 
      LEFT JOIN students s ON u.student_id = s.id 
      WHERE u.is_active = true 
        AND (LOWER(s.usn) = LOWER($1) OR LOWER(u.username) = LOWER($1) OR LOWER(s.email) = LOWER($1))
      `,
      [identifier]
    );
  } else if (roleType === "COORDINATOR") {
    users = await query<UserRecord>(
      `
      SELECT u.* 
      FROM users u 
      LEFT JOIN faculty f ON u.faculty_id = f.id 
      WHERE u.is_active = true 
        AND (u.role = 'COORDINATOR' OR LOWER(f.faculty_code) = LOWER($1) OR LOWER(u.username) = LOWER($1))
      `,
      [identifier]
    );
  } else if (roleType === "SUPERVISOR") {
    users = await query<UserRecord>(
      `
      SELECT u.* 
      FROM users u 
      LEFT JOIN faculty f ON u.faculty_id = f.id 
      WHERE u.is_active = true 
        AND (u.role = 'SUPERVISOR' OR LOWER(f.faculty_code) = LOWER($1) OR LOWER(u.username) = LOWER($1))
      `,
      [identifier]
    );
  } else if (roleType === "FACULTY") {
    users = await query<UserRecord>(
      `
      SELECT u.* 
      FROM users u 
      LEFT JOIN faculty f ON u.faculty_id = f.id 
      WHERE u.is_active = true 
        AND (LOWER(f.faculty_code) = LOWER($1) OR LOWER(u.username) = LOWER($1) OR LOWER(f.email) = LOWER($1))
      `,
      [identifier]
    );
  } else if (roleType === "MENTOR") {
    users = await query<UserRecord>(
      `
      SELECT u.* 
      FROM users u 
      LEFT JOIN faculty f ON u.faculty_id = f.id 
      WHERE u.is_active = true 
        AND (LOWER(f.faculty_code) = LOWER($1) OR LOWER(u.username) = LOWER($1) OR LOWER(f.email) = LOWER($1))
      `,
      [identifier]
    );
  } else if (roleType === "ADMIN") {
    users = await query<UserRecord>(
      `
      SELECT u.* 
      FROM users u 
      LEFT JOIN faculty f ON u.faculty_id = f.id 
      WHERE u.is_active = true 
        AND (LOWER(u.username) = LOWER($1) OR LOWER(f.faculty_code) = LOWER($1))
      `,
      [identifier]
    );
  } else {
    users = await query<UserRecord>(
      `
      SELECT u.* 
      FROM users u 
      LEFT JOIN students s ON u.student_id = s.id 
      LEFT JOIN faculty f ON u.faculty_id = f.id 
      WHERE u.is_active = true 
        AND (
          LOWER(u.username) = LOWER($1) OR 
          LOWER(s.usn) = LOWER($1) OR 
          LOWER(f.faculty_code) = LOWER($1) OR 
          LOWER(s.email) = LOWER($1) OR 
          LOWER(f.email) = LOWER($1)
        )
      `,
      [identifier]
    );
  }

  let u = users[0];

  // 2. Dynamic Fallback: If user row not found, check if valid Faculty Code or Student USN exists in DB
  if (!u) {
    if (roleType === "FACULTY" || roleType === "COORDINATOR" || roleType === "SUPERVISOR" || roleType === "MENTOR" || roleType === "ALL") {
      const facRows = await query<{ id: number; faculty_code: string; name: string }>(
        `SELECT id, faculty_code, name FROM faculty WHERE LOWER(faculty_code) = LOWER($1) AND is_active = true`,
        [identifier]
      );
      if (facRows.length > 0) {
        const fac = facRows[0];
        const defaultHash = await bcrypt.hash("Falcon@123", 12);
        const assignedRole: Role = roleType === "COORDINATOR" ? "COORDINATOR" : roleType === "SUPERVISOR" ? "SUPERVISOR" : roleType === "MENTOR" ? "MENTOR" : "FACULTY";
        const newUser = await query<UserRecord>(
          `
          INSERT INTO users (username, password_hash, display_name, role, faculty_id)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (username) DO UPDATE SET password_hash=EXCLUDED.password_hash
          RETURNING *;
          `,
          [fac.faculty_code, defaultHash, fac.name, assignedRole, fac.id]
        );
        u = newUser[0];
      }
    }

    if (!u && (roleType === "STUDENT" || roleType === "ALL")) {
      const stuRows = await query<{ id: number; usn: string; name: string }>(
        `SELECT id, usn, name FROM students WHERE LOWER(usn) = LOWER($1) AND is_active = true`,
        [identifier]
      );
      if (stuRows.length > 0) {
        const stu = stuRows[0];
        const defaultHash = await bcrypt.hash("Falcon@123", 12);
        const newUser = await query<UserRecord>(
          `
          INSERT INTO users (username, password_hash, display_name, role, student_id)
          VALUES ($1, $2, $3, 'STUDENT', $4)
          ON CONFLICT (username) DO UPDATE SET password_hash=EXCLUDED.password_hash
          RETURNING *;
          `,
          [stu.usn, defaultHash, stu.name, stu.id]
        );
        u = newUser[0];
      }
    }
  }

  if (!u || !(await bcrypt.compare(password, u.password_hash))) {
    return NextResponse.redirect(new URL("/login?error=1", req.url), 303);
  }

  const effectiveRole: Role = roleType === "COORDINATOR" ? "COORDINATOR" : roleType === "SUPERVISOR" ? "SUPERVISOR" : roleType === "MENTOR" ? "MENTOR" : u.role;

  await createSession({
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    role: effectiveRole,
    facultyId: u.faculty_id,
    studentId: u.student_id,
  });

  const redirectPath = getRoleRedirectPath(effectiveRole);
  return NextResponse.redirect(new URL(redirectPath, req.url), 303);
}
