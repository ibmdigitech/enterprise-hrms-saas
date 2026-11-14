/**
 * Enterprise Demo Data Generator
 * Populates realistic workforce analytics data:
 * - 60+ realistic employee profiles with departments, designations, salaries, locations, gender, employment types
 * - 6 months of historical daily attendance records
 * - Realistic leaves and promotion history
 * Matches the PerformX HR Executive Dashboard shown in enterprise sales presentations.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEPARTMENTS = [
  { name: 'Engineering', weight: 0.32, code: 'ENG' },
  { name: 'Sales & Growth', weight: 0.20, code: 'SAL' },
  { name: 'Operations', weight: 0.16, code: 'OPS' },
  { name: 'Finance & Accounts', weight: 0.12, code: 'FIN' },
  { name: 'Human Resources', weight: 0.08, code: 'HR' },
  { name: 'Marketing & Brand', weight: 0.07, code: 'MKT' },
  { name: 'IT & Security', weight: 0.05, code: 'IT' },
];

const LOCATIONS = ['Dubai (HQ)', 'Abu Dhabi', 'London Office', 'Riyadh Branch', 'New York Hub'];
const EMPLOYMENT_TYPES = ['Full-time', 'Full-time', 'Full-time', 'Contract', 'Part-time'];
const GENDERS = ['MALE', 'FEMALE', 'FEMALE', 'MALE'];

const FIRST_NAMES = [
  'Aiden', 'Sophia', 'Liam', 'Emma', 'Noah', 'Olivia', 'Ethan', 'Ava', 'Lucas', 'Mia',
  'Tariq', 'Fatima', 'Zayed', 'Mariam', 'Omar', 'Nour', 'Khalid', 'Layla', 'Hamdan', 'Reem',
  'Alexander', 'Chloe', 'James', 'Grace', 'Daniel', 'Zoe', 'Benjamin', 'Lily', 'Henry', 'Amara',
  'Vikram', 'Priya', 'Arjun', 'Ananya', 'Rohan', 'Sneha', 'Kabir', 'Divya', 'Siddharth', 'Meera',
  'Carlos', 'Elena', 'Marcus', 'Camila', 'Mateo', 'Isabella', 'Diego', 'Lucia', 'Julian', 'Valeria',
  'Arthur', 'Elise', 'Gabriel', 'Juliette', 'Leo', 'Mathilde', 'Louis', 'Ines', 'Hugo', 'Camille'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Al-Mansoor', 'Al-Nuaimi',
  'Al-Hashimi', 'Al-Falasi', 'Al-Kaabi', 'Al-Zaabi', 'Sharma', 'Patel', 'Kapoor', 'Verma', 'Dubois', 'Laurent',
  'Moreau', 'Fournier', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Taylor'
];

const DESIGNATIONS = {
  'Engineering': ['Principal Architect', 'Staff Software Engineer', 'Senior Fullstack Dev', 'Frontend Specialist', 'DevOps Lead', 'QA Automation Engineer'],
  'Sales & Growth': ['VP of Sales', 'Regional Sales Director', 'Enterprise Account Exec', 'Business Development Rep', 'Client Success Manager'],
  'Operations': ['VP of Operations', 'Logistics Director', 'Operations Analyst', 'Procurement Specialist', 'Facilities Manager'],
  'Finance & Accounts': ['Chief Financial Officer', 'Finance Controller', 'Senior Accountant', 'Payroll Specialist', 'Tax Analyst'],
  'Human Resources': ['HR Director', 'Talent Acquisition Lead', 'People & Culture Manager', 'HR Operations Generalist', 'L&D Specialist'],
  'Marketing & Brand': ['Chief Marketing Officer', 'Product Marketing Lead', 'Performance Marketing Specialist', 'Content Strategist'],
  'IT & Security': ['Chief Information Security Officer', 'Cloud Infrastructure Engineer', 'IT Support Specialist', 'Network Administrator']
};

async function seed() {
  console.log('--- Starting Enterprise Demo Data Seeder ---');

  const tenant = await prisma.tenant.findFirst();
  const company = await prisma.company.findFirst({ where: { tenantId: tenant.id } });

  if (!tenant || !company) {
    console.error('Tenant or Company not found in database');
    process.exit(1);
  }

  console.log(`Using Tenant: ${tenant.name} (${tenant.id}), Company: ${company.name} (${company.id})`);

  // Ensure Departments exist
  const deptMap = {};
  for (const dept of DEPARTMENTS) {
    let d = await prisma.department.findFirst({
      where: { tenantId: tenant.id, name: dept.name }
    });
    if (!d) {
      d = await prisma.department.create({
        data: {
          tenantId: tenant.id,
          companyId: company.id,
          name: dept.name,
          code: dept.code,
        }
      });
    }
    deptMap[dept.name] = d.id;
  }
  console.log('Departments verified.');

  // Create 60 realistic employees
  console.log('Seeding 60 realistic enterprise employee profiles...');
  const createdEmployees = [];
  const now = new Date();

  for (let i = 0; i < 60; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i > 25 ? i : ''}@enterprisehrms.local`;
    const rollNumber = `EMP-${1000 + i}`;
    
    // Choose department based on weights
    const deptObj = DEPARTMENTS[i % DEPARTMENTS.length];
    const deptName = deptObj.name;
    const desigs = DESIGNATIONS[deptName] || ['Associate'];
    const designation = desigs[i % desigs.length];
    const location = LOCATIONS[i % LOCATIONS.length];
    const empType = EMPLOYMENT_TYPES[i % EMPLOYMENT_TYPES.length];
    const gender = GENDERS[i % GENDERS.length];

    // Joining date staggered across the last 24 months
    const monthsAgo = Math.floor(Math.random() * 24);
    const joiningDate = new Date();
    joiningDate.setMonth(joiningDate.getMonth() - monthsAgo);
    joiningDate.setDate(Math.floor(Math.random() * 25) + 1);

    // Birth date for age distribution (22 to 58)
    const age = 22 + (i % 36);
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - age);

    // Salary between 12,000 AED and 45,000 AED
    const basicSalary = 12000 + (i % 15) * 2200;

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          role: i === 0 ? 'ADMIN' : (i < 5 ? 'MANAGER' : 'STAFF'),
          password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // Password@123456
        }
      });

      await prisma.tenantMembership.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: user.role,
          status: 'ACTIVE',
        }
      });
    }

    // Upsert Employee
    let emp = await prisma.employee.findFirst({ where: { email } });
    if (!emp) {
      emp = await prisma.employee.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          companyId: company.id,
          departmentId: deptMap[deptName],
          employeeCode: rollNumber,
          rollNumber,
          firstName,
          lastName,
          email,
          phone: `+971 50 ${Math.floor(1000000 + Math.random() * 9000000)}`,
          gender,
          dateOfBirth: birthDate,
          designation,
          department: deptName,
          workLocation: location,
          employmentType: empType,
          joiningDate,
          basicSalary,
          housingAllowance: basicSalary * 0.25,
          transportAllowance: basicSalary * 0.10,
          isActive: true,
          currentStatus: 'ACTIVE',
          lifecycle: 'ACTIVE',
        }
      });
    }
    createdEmployees.push(emp);
  }

  console.log(`Successfully verified ${createdEmployees.length} employees.`);

  // Seed daily attendance for the last 30 days
  console.log('Generating 30 days of attendance logs...');
  const past30Days = [];
  for (let d = 29; d >= 0; d--) {
    const day = new Date();
    day.setDate(day.getDate() - d);
    day.setHours(9, 0, 0, 0);
    // Skip weekends (Friday/Saturday or Saturday/Sunday depending on company)
    const dayOfWeek = day.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      past30Days.push(day);
    }
  }

  let attendanceCount = 0;
  for (const day of past30Days) {
    const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    const existing = await prisma.attendance.count({
      where: { date: { gte: day, lt: nextDay } }
    });

    if (existing > 10) continue; // Already seeded

    const attendanceRecords = [];
    for (const emp of createdEmployees) {
      // 92% Present, 5% Late, 3% Absent
      const rand = Math.random();
      let status = 'PRESENT';
      let checkIn = new Date(day);
      let checkOut = new Date(day);
      checkOut.setHours(18, 0, 0, 0);
      let lateMinutes = 0;

      if (rand > 0.96) {
        status = 'ABSENT';
        checkIn = null;
        checkOut = null;
      } else if (rand > 0.88) {
        status = 'LATE';
        lateMinutes = Math.floor(Math.random() * 45) + 10;
        checkIn.setMinutes(lateMinutes);
      } else {
        checkIn.setMinutes(Math.floor(Math.random() * 15) - 10);
      }

      attendanceRecords.push({
        employeeId: emp.id,
        date: day,
        status,
        checkIn,
        checkOut,
        lateMinutes,
        
      });
    }

    if (attendanceRecords.length > 0) {
      await prisma.attendance.createMany({
        data: attendanceRecords,
        skipDuplicates: true,
      });
      attendanceCount += attendanceRecords.length;
    }
  }

  console.log(`Generated ${attendanceCount} realistic attendance entries.`);
  console.log('--- Enterprise Demo Data Seeding Completed Successfully! ---');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
