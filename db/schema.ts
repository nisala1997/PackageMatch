import {sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const packages=sqliteTable('packages',{id:text('id').primaryKey(),payload:text('payload').notNull()});
