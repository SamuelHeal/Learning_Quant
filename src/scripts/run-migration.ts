#!/usr/bin/env node
import migrateToSubjects from "./migrate-to-subjects";

/**
 * This script runs the migration to convert existing blog posts
 * to the new subject-lesson structure.
 */
async function runMigration() {
  console.log("=== Running migration to subject-lesson structure ===");

  try {
    await migrateToSubjects();
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(console.error);
