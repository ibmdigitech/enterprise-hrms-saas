# Permanent Authentication & Password Persistence Fix Report

**Project:** IBM DIGITECH ENTERPRISE HRMS  
**Component:** NextAuth v5, Credentials Provider, Prisma ORM, Docker PostgreSQL  
**Date:** November 18, 2026

---

## 1. Problem Statement
Users experienced recurring login failures and credential reversion after restarting the application, stopping Docker containers, or rebooting the host machine. Password changes made through `/account/change-password` were periodically lost or overwritten, reverting accounts to seeded/temporary credentials or generating invalid bcrypt states.

---

## 2. Root Cause Analysis

### Root Cause A: Dangerous Password Overwrite in `scripts/seed-docker-network.js`
- **Location:** `scripts/seed-docker-network.js` (lines 228–236 and 419–426)
- **Vulnerability:**
  The `seedUser` function had an `else` branch executed whenever a user already existed:
  ```javascript
  // DANGEROUS CODE BEFORE FIX:
  } else {
      user = await prisma.user.update({
          where: { email },
          data: {
              password: passwordHash, // <-- GENERATED RANDOM PASSWORD APPLIED ON EVERY RUN!
              role,
              name,
          }
      });
  }
  ```
  On every execution, this script generated a brand new random password using `crypto.randomBytes(16)` and unconditionally overwrote the existing hashed password in PostgreSQL. The same destructive logic existed for `superadmin@hrms.local`.

### Root Cause B: Non-Standard Connection Pool Timeout Parameters in `.env`
- **Location:** `.env` (`DATABASE_URL` and `DIRECT_URL`)
- **Vulnerability:**
  URL string had `?host=127.0.0.1&port=5434&connect_timeout=30` appended to `postgresql://hr_admin:postgres@127.0.0.1:5434/hr_system`.
  While valid for libpq/psql, these extra query parameters confuse Prisma's Rust connection pool engine when resolving localhost sockets on Windows, throwing:
  `"Timed out fetching a new connection from the connection pool"`.
  When connection timeouts occurred during startup scripts, credentials could get stuck in corrupted or half-seeded states.

### Root Cause C: Docker Volume Stability Check
- **Verification:**
  `docker-compose.yml` configures `hr_system-main_pgdata` as a named persistent volume. The underlying data in `/var/lib/postgresql/data` persists across host restarts and container recreations. The data loss was NOT caused by Docker volume drops, but by seed script overwrites upon container restart.

---

## 3. Permanent Fixes Implemented

### Fix 1: Patched `seedUser` and `superadmin` in `scripts/seed-docker-network.js`
- Modified the `else` branch so that existing accounts **never** have their `password` or `passwordHash` updated.
- Preserved user roles and manual credentials:
  ```javascript
  // PERMANENT FIX:
  } else {
      user = await prisma.user.update({
          where: { email },
          data: {
              name, // Only update non-credential metadata
          }
      });
      delete generatedPasswords[email];
      console.log('User already exists (password preserved):', email);
  }
  ```
- Similarly patched `superadmin@hrms.local` to retain its password and skip updates if already present in the database.

### Fix 2: Cleaned `DATABASE_URL` and `DIRECT_URL`
- Cleaned `.env` to the canonical Prisma connection format:
  ```env
  DATABASE_URL="postgresql://hr_admin:postgres@127.0.0.1:5434/hr_system"
  DIRECT_URL="postgresql://hr_admin:postgres@127.0.0.1:5434/hr_system"
  ```
- Re-generated Prisma client (`npx prisma generate`), eliminating the connection pool timeouts.

### Fix 3: Verified Safe Startup Flow
- `scripts/seed-standalone.js` (called by `___RUN_APP_CLICK_ME.bat` on boot) was verified: it only hashes and sets password on `prisma.user.create`. For existing users, it executes:
  `data: { name: userDef.name }` (never touches password).
- `AUTH_SECRET` in `.env` is a static, persistent CSPRNG base64 secret (`18UraABcd9b0m03QMPvMIqZ5WmsO702M6pqBnTch/yw=`). Sessions will not be invalidated across server reboots.

---

## 4. Verification & Testing Procedure
1. User changes password at `/account/change-password`.
2. Password is encrypted using `bcrypt.hash(newPassword, 10)` and committed to PostgreSQL.
3. System shutdown, restart, and re-execution of startup scripts.
4. Existing user password remains intact; previous password fails; new password authenticates successfully.
