import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.redirect('/login');

  const { amount, description } = await req.json();
  const employee = await prisma.employee.findFirst({
    where: { user: { email: session.user.email } },
    select: { id: true },
  });
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  const record = await prisma.travelAllowanceRequest.create({
    data: {
      employeeId: employee.id,
      amount,
      description,
      status: 'PENDING',
    },
  });
  return NextResponse.json(record);
}
