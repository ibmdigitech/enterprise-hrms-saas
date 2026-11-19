import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Find the staff employee
  const staffEmployee = await prisma.employee.findFirst({
    where: { user: { email: 'staff@techsafe.com' } },
    include: { user: true }
  });

  const managerEmployee = await prisma.employee.findFirst({
    where: { user: { email: 'manager@techsafe.com' } },
    include: { user: true }
  });

  console.log('Staff:', staffEmployee?.id, staffEmployee?.user?.email);
  console.log('Manager:', managerEmployee?.id, managerEmployee?.user?.email);

  const notifications = [];

  if (staffEmployee) {
    notifications.push(
      {
        employeeId: staffEmployee.id,
        title: 'Welcome to MultiSaaS HRMS',
        message: 'Your account has been set up. Explore your dashboard to get started.',
        type: 'INFO',
        link: '/dashboard',
        isRead: false,
      },
      {
        employeeId: staffEmployee.id,
        title: 'Promotion Approved',
        message: 'Congratulations! Your promotion from Junior Developer to Senior Developer has been approved.',
        type: 'SUCCESS',
        link: '/promotions',
        isRead: false,
      },
      {
        employeeId: staffEmployee.id,
        title: 'Leave Request Update',
        message: 'Your annual leave request has been reviewed. Please check the leave section for details.',
        type: 'INFO',
        link: '/leaves',
        isRead: false,
      },
      {
        employeeId: staffEmployee.id,
        title: 'Payslip Available',
        message: 'Your payslip for October 2026 is now available for download.',
        type: 'SUCCESS',
        link: '/payroll/payslips',
        isRead: true,
      },
      {
        employeeId: staffEmployee.id,
        title: 'Training Enrollment Confirmed',
        message: 'You have been enrolled in Cybersecurity & Data Privacy 2026. Session starts Jan 10, 2026.',
        type: 'INFO',
        link: '/dashboard/training',
        isRead: true,
      }
    );
  }

  if (managerEmployee) {
    notifications.push(
      {
        employeeId: managerEmployee.id,
        title: 'Pending Leave Approval',
        message: 'A team member has submitted a leave request awaiting your approval.',
        type: 'WARNING',
        link: '/leaves',
        isRead: false,
      },
      {
        employeeId: managerEmployee.id,
        title: 'Team Attendance Report',
        message: 'Monthly attendance report for October 2026 is ready for your review.',
        type: 'INFO',
        link: '/attendance',
        isRead: false,
      },
      {
        employeeId: managerEmployee.id,
        title: 'Profile Change Request',
        message: 'An employee has submitted a profile update request pending your review.',
        type: 'WARNING',
        link: '/dashboard/approvals',
        isRead: false,
      }
    );
  }

  if (notifications.length === 0) {
    console.log('No employees found — check email addresses match seed data');
    return;
  }

  // Clear existing notifications first
  if (staffEmployee) {
    await prisma.notification.deleteMany({ where: { employeeId: staffEmployee.id } });
  }
  if (managerEmployee) {
    await prisma.notification.deleteMany({ where: { employeeId: managerEmployee.id } });
  }

  const result = await prisma.notification.createMany({ data: notifications });
  console.log(`Created ${result.count} notifications`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
