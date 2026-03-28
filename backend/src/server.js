import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { seedDatabase } from "./seeds/seed.js";

async function start() {
  await connectDatabase();
  await seedDatabase();
  app.listen(env.port, () => {
    console.log(`Smart Classroom backend listening on port ${env.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
