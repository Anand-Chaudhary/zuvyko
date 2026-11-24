import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

router.get('/', async (_req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'unreachable';
  }

  return res.success({
    success: true,
    message: 'Server health check',
    status: 200,
    data: {
      uptime: process.uptime(),
      database: dbStatus,
      timestamp: new Date().toISOString()
    }
  });
});

export default router