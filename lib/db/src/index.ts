import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null as any;

function createMockDb() {
  const handler: ProxyHandler<any> = {
    get: function(target: any, prop: any) {
      if (prop === 'then') {
        return (resolve: any) => resolve([
          { 
            id: 1, 
            clerkId: "mock-user-123",
            userId: "mock-user-123",
            posterUserId: "mock-user-123",
            createdAt: new Date(),
            updatedAt: new Date(),
            name: "Mock User",
            email: "mock@example.com",
            role: "Other",
            title: "Mock Project",
            description: "This is a mock project running without a database.",
            status: "open",
            rating: 5,
            content: "Mock message content"
          }
        ]);
      }
      return new Proxy(() => {}, handler);
    },
    apply: function() {
      return new Proxy(() => {}, handler);
    }
  };
  return new Proxy(() => {}, handler);
}

export const db = pool ? drizzle(pool, { schema }) : createMockDb();

export * from "./schema";
