import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import connectDB from './config/db.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.get("/", (req, res) => {
  res.send("ok");
});
connectDB();

import authRoutes from './routes/auth.route.js';
import reportRoutes from './routes/report.route.js';
import taskRoutes from './routes/task.route.js';
import userRoutes from './routes/user.route.js';

app.use("/api/auth",authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/tasks",taskRoutes);
app.use("/api/reports",reportRoutes);






app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});