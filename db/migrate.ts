import path from 'node:path';
import { createSqliteClient } from './client';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

export async function main(): Promise<void> {
   const dbPath = process.env.CIRCLE_DB_PATH ?? path.join(process.cwd(), 'data', 'circle.db');
   const db = createSqliteClient(dbPath);
   migrate(db, { migrationsFolder: path.join(process.cwd(), 'db', 'migrations') });
   db.$client.close();
   console.log('migrated:', dbPath);
}

if (process.argv[1]?.endsWith('migrate.ts')) {
   main()
      .then(() => process.exit(0))
      .catch((e) => {
         console.error(e);
         process.exit(1);
      });
}
