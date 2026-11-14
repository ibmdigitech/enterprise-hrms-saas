import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log("[CHECK_PASSWORD_REQUIRED] Checking:", normalizedEmail);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        password: true,
        securityFlag: {
          select: { mustChangePassword: true },
        },
      },
    });

    if (!user) {
      console.log("[CHECK_PASSWORD_REQUIRED] User not found:", normalizedEmail);
      return NextResponse.json({ passwordChangeRequired: false });
    }

    console.log("[CHECK_PASSWORD_REQUIRED] User found:", user.email, "mustChange:", user.securityFlag?.mustChangePassword);

    const mustChange = user.securityFlag?.mustChangePassword ?? false;

    return NextResponse.json({
      passwordChangeRequired: mustChange,
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error("[CHECK_PASSWORD_REQUIRED_ERROR]", error);
    return NextResponse.json({ error: "Failed to check password status" }, { status: 500 });
  }
}
