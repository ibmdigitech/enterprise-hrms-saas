/**
 * Multi-Database Tenant Pool Manager.
 *
 * Implements Database-Per-Tenant Architecture:
 * - Allows each tenant to operate on a completely isolated PostgreSQL database instance.
 * - Maintains a cached pool of PrismaClients keyed by tenant database URL.
 * - Gracefully falls back to the default database if a tenant does not specify a custom databaseUrl.
 */

import { PrismaClient } from "../../prisma/generated/client";
import prisma from "../prisma";

// Global cache of tenant-specific Prisma Client connections
const tenantDatabasePool = new Map<string, PrismaClient>();

/**
 * Returns a dedicated PrismaClient for a specific tenant database connection string.
 * Automatically pools clients to prevent socket exhaustion.
 */
export function getTenantDatabaseClient(tenantDatabaseUrl: string): PrismaClient {
    if (!tenantDatabaseUrl) {
        return prisma;
    }

    const existingClient = tenantDatabasePool.get(tenantDatabaseUrl);
    if (existingClient) {
        return existingClient;
    }

    const newClient = new PrismaClient({
        datasources: {
            db: {
                url: tenantDatabaseUrl,
            },
        },
    });

    tenantDatabasePool.set(tenantDatabaseUrl, newClient);
    return newClient;
}

/**
 * Disconnects and cleans up all active tenant database connections in the pool.
 * Useful during server shutdown or test teardown.
 */
export async function drainTenantDatabasePool(): Promise<void> {
    const clients = Array.from(tenantDatabasePool.values());
    await Promise.all(clients.map((client) => client.$disconnect()));
    tenantDatabasePool.clear();
}
