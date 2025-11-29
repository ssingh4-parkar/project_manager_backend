import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/user.model.js";

(async () => {
  try {
    await connectDB();

    const name = process.env.SEED_ADMIN_NAME || "Seeded Admin";
    const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
    const password = process.env.SEED_ADMIN_PASSWORD || "Admin@123";

    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.role !== "admin") {
        existing.role = "admin";
        await existing.save();
        console.log(`Updated existing user to admin: ${email}`);
      } else {
        console.log(`Admin already exists: ${email}`);
      }
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const adminUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "admin",
        profileImageUrl: ""
      });
      console.log(`Seeded admin created: ${adminUser.email}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Seeding admin failed:", err);
    process.exit(1);
  }
})();