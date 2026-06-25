import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

/**
 * POST /api/register
 *
 * Body: { email, password, name? }
 * Crea el usuario con password hasheado. Si el email ya existe → 409.
 *
 * Decisión: NO devolvemos la sesión automáticamente — el usuario hace
 * login por separado. Esto evita dependencias circulares con NextAuth y
 * mantiene el register puro.
 */

const Body = z.object({
  email: z.string().email(),
  // Mínimo 8 caracteres — bcrypt hace el resto.
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  name: z.string().min(1).max(80).optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Body no es JSON válido" },
      { status: 400 }
    );
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_body",
        message: "Datos de entrada inválidos",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      {
        error: "email_taken",
        message: "Ya existe una cuenta con ese email",
      },
      { status: 409 }
    );
  }

  const passwordHash = await hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}