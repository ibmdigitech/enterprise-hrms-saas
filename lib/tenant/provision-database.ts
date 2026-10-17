/**
 * Tenant Database Provisioning Utility.
 *
 * Automates creating and migrating a separate, dedicated database for a tenant:
 * 1. Connects to PostgreSQL management server.
 * 2. Creates a dedicated database: `CREATE DATABASE "tenant_<slug>"`
 * 3. Runs Prisma migrations to apply the schema to the dedicated database.
 * 4. Updates Tenant.databaseUrl in the primary catalog.
 */

import { Client } from "pg";
import { exec } from "child_process";
import { promisify } from "util";
import prisma from "@/lib/prisma";

const execAsync = promisify(exec);

export interface ProvisionTenantDatabaseOptions {
    tenantId: string;
    slug: string;
    postgresAdminUrl?: string; // e.g. postgresql://postgres:postgres@localhost:5433/postgres
}

/**
 * Creates a dedicated PostgreSQL database for a tenant and applies migrations.
 */
export async function provisionTenantDatabase(options: ProvisionTenantDatabaseOptions): Promise<string> {
    const { tenantId, slug, postgresAdminUrl } = options;
    const adminUrl = postgresAdminUrl || process.env.DIRECT_URL || process.env.DATABASE_URL;

    if (!adminUrl) {
        throw new Error("No database administrative URL available to provision tenant database.");
    }

    // Sanitize database name
    const sanitizedDbName = `hrms_tenant_${slug.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()}`;

    // Connect to PostgreSQL to create the new database
    const client = new Client({ connectionString: adminUrl });
    await client.connect();

    try {
        // Check if database already exists
        const checkRes = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [sanitizedDbName]
        );

        if (checkRes.rowCount === 0) {
            await client.query(`CREATE DATABASE "${sanitizedDbName}"`);
        }
    } finally {
        await client.end();
    }

    // Construct the connection URL for the newly created tenant database
    const parsedUrl = new URL(adminUrl);
    parsedUrl.pathname = `/${sanitizedDbName}`;
    const tenantDbUrl = parsedUrl.toString();

    // Run Prisma db push or deploy to initialize tables in the new tenant database
    await execAsync(`npx prisma db push --schema=prisma/schema.prisma --skip-generate`, {
        env: {
            ...process.env,
            DATABASE_URL: tenantDbUrl,
            DIRECT_URL: tenantDbUrl,
        },
    });

    // Update Tenant record with dedicated databaseUrl
    await prisma.tenant.update({
        where: { id: tenantId },
        data: { databaseUrl: tenantDbUrl },
    });

    return tenantDbUrl;
}
