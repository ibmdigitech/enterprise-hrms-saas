# CRITICAL FIX: PERMANENT AUTHENTICATION & PASSWORD PERSISTENCE

Act as a Senior Authentication Engineer and Database Architect.

Investigate and permanently resolve the recurring authentication issue across the entire HRMS application.

**Problem:**
After restarting, stopping, or turning the application off and on, users experience login failures. Password changes are not consistently preserved, and seeded/default passwords sometimes become active again.

Do not apply temporary password resets. Identify and fix the actual root cause.

## A. Audit database persistence

1. Identify the exact database used by the application.
2. Verify DATABASE_URL across development, production and deployment environments.
3. Verify PostgreSQL Docker volume persistence.
4. Ensure application restarts never recreate or reset user records.
5. Verify Prisma migrations and database connection configuration.
6. Check whether seed scripts run automatically during startup or deployment.

## B. Fix seed scripts permanently

This is mandatory.

- Seed scripts must create missing users only.
- Existing users must retain their current passwordHash.
- Never overwrite an existing password with a default or seeded password.
- Never reset a password during application startup.
- Do not delete and recreate users during seeding.
- Do not overwrite existing user roles, account status or profile information unintentionally.
- Use safe upsert logic that preserves existing credentials.
- Separate initial administrator provisioning from normal database seeding.

Example logic:

```typescript
const existingUser = await prisma.user.findUnique({
  where: { email: normalizedEmail },
});

if (!existingUser) {
  await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(initialPassword, 12),
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
}

// Never update passwordHash for an existing user here.
```

Adapt this example to the actual Prisma schema.

## C. Password change functionality

Audit the complete password lifecycle:

1. Initial password creation.
2. Login verification.
3. Change password.
4. Forgot password.
5. Password reset.
6. Admin password reset.
7. Session invalidation.
8. Subsequent login.

Requirements:

- Use bcrypt or the existing approved secure password hashing mechanism consistently.
- Hash passwords exactly once.
- Never store plaintext passwords.
- Verify passwords against the stored hash.
- Validate current password before allowing a password change.
- Ensure new password hashes are committed to the persistent database.
- Never log passwords or password hashes.
- Do not allow seed operations to reverse a user password change.

## D. Authentication architecture

Audit NextAuth v5 Credentials authentication and all associated authorization logic.

Verify:

- Email normalization.
- Password comparison.
- User ACTIVE/INACTIVE status.
- Role and permission validation.
- Session and JWT configuration.
- Session expiry and refresh.
- Database adapter configuration, if applicable.
- Login behavior after server restart.
- Authentication behavior after database reconnection.

Do not invalidate all sessions unnecessarily.

## E. All environments

Test authentication in:

- Local development.
- Application restart.
- Docker restart.
- Production build.
- Production deployment.
- Database restart.
- Repeated database seed execution.

Ensure all environments use the intended persistent database.

## F. Mandatory regression tests

Create automated tests confirming:

1. New user can log in.
2. Existing user can change password.
3. Changed password works after application restart.
4. Old password is rejected after password change.
5. Running seed multiple times does not change the password.
6. Restarting Docker does not change credentials.
7. Existing users are not recreated.
8. Inactive users cannot log in.
9. Password reset works correctly.
10. Admin-created accounts retain their credentials.
11. All authorized roles can log in.
12. Sessions behave correctly after restart.

## G. Security requirements

- Never introduce a universal default password.
- Never automatically reset administrator passwords.
- Do not expose password hashes through APIs.
- Protect password reset endpoints.
- Record password changes in the audit log without recording credentials.
- Preserve existing users, employees, roles, permissions and business data.

## H. Final deliverables

Before declaring completion, provide:

1. Root cause identified.
2. Files and functions responsible.
3. Database persistence audit.
4. Seed script corrections.
5. Authentication corrections.
6. Password change corrections.
7. Automated regression test results.
8. Build and TypeScript results.
9. Confirmation that existing user accounts and data were preserved.

**Important: Do not delete existing functionality, users, database records, modules or application configurations. Do not perform destructive database resets. Audit first, implement second, and test thoroughly.**
