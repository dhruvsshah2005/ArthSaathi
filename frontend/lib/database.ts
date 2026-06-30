// lib/database.ts
import * as SQLite from 'expo-sqlite';

// Open or create the local database file
export const openDB = async () => {
  return await SQLite.openDatabaseAsync('arthasaathi.db');
};

// Initialize schema
export const initLocalDB = async () => {
  const db = await openDB();

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY NOT NULL,
      phone_number TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parametric_profiles (
      profile_id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT,
      language_code TEXT,
      occupation_type TEXT,
      education_level TEXT,
      income_type TEXT,
      income_value TEXT,
      current_balance REAL,
      crop_type TEXT,
      land_holding TEXT,
      income_pattern TEXT,
      is_blind INTEGER DEFAULT 0,
      trust_score INTEGER DEFAULT 75,
      FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      transaction_id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL, -- 'credit' or 'debit'
      reason TEXT NOT NULL,
      synced INTEGER DEFAULT 0, -- 0 for offline, 1 for synced
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
    );
  `);

  // Run schema migrations for existing database installations
  try {
    await db.execAsync("ALTER TABLE parametric_profiles ADD COLUMN is_blind INTEGER DEFAULT 0;");
    console.log("✅ SQLite Schema Migration: Added 'is_blind' column");
  } catch (error) {
    // Column already exists, safe to ignore
    console.log("ℹ️ SQLite Schema Migration: 'is_blind' column already exists");
  }

  // Farmer specific columns
  const farmerColumns = ['crop_type', 'land_holding', 'income_pattern'];
  for (const col of farmerColumns) {
    try {
      await db.execAsync(`ALTER TABLE parametric_profiles ADD COLUMN ${col} TEXT;`);
      console.log(`✅ SQLite Schema Migration: Added '${col}' column`);
    } catch (error) {
      console.log(`ℹ️ SQLite Schema Migration: '${col}' column already exists`);
    }
  }

  try {
    await db.execAsync("ALTER TABLE transactions ADD COLUMN created_at DATETIME;");
    await db.execAsync("UPDATE transactions SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;");
    console.log("✅ SQLite Schema Migration: Added 'created_at' column to transactions");
  } catch (error) {
    // Column already exists, safe to ignore
    console.log("ℹ️ SQLite Schema Migration: 'created_at' column already exists in transactions");
  }

  console.log("✅ Local SQLite DB & Tables Initialized");
};