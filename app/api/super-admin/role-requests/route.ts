import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin("platform.roles.manage");

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status") || "";
    const role = searchParams.get("role") || "";
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (role) where.requestedRole = role;
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

const [requests, total] = await Promise.all([
    prisma.roleRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
      },
    }),
    prisma.roleRequest.count({ where }),
  ]);

    return NextResponse.json({
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch role requests" }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireSuperAdmin("platform.roles.manage");

    const body = await request.json();
    const { requestId, action, reason } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const roleRequest = await prisma.roleRequest.findUnique({
      where: { id: requestId },
      include: { 
        user: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!roleRequest) {
      return NextResponse.json({ error: "Role request not found" }, { status: 404 });
    }

    if (roleRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Request already processed" }, { status: 400 });
    }

    if (action === "approve") {
      await prisma.$transaction(async (tx) => {
        await tx.roleRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED", updatedAt: new Date() },
        });

        await tx.user.update({
          where: { id: roleRequest.userId },
          data: { role: roleRequest.requestedRole },
        });

        // Create notification for the user
        if (roleRequest.user.employee?.id) {
          await tx.notification.create({
            data: {
              employeeId: roleRequest.user.employee.id,
              title: "Role Access Approved",
              message: `Your request for ${roleRequest.requestedRole} access has been approved.`,
              type: "SUCCESS",
              link: "/dashboard",
            },
          });
        }
      });
    } else if (action === "reject") {
      await prisma.$transaction(async (tx) => {
        await tx.roleRequest.update({
          where: { id: requestId },
          data: { status: "REJECTED", updatedAt: new Date() },
        });

        // Create notification for the user
        if (roleRequest.user.employee?.id) {
          await tx.notification.create({
            data: {
              employeeId: roleRequest.user.employee.id,
              title: "Role Access Request Declined",
              message: `Your request for ${roleRequest.requestedRole} access was declined.${reason ? ` Reason: ${reason}` : ""}`,
              type: "ALERT",
              link: "/dashboard/request-access",
            },
          });
        }
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    revalidatePath("/super-admin/role-requests");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}