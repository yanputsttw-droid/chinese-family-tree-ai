import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaAdapterPg } from '@prisma/adapter-pg';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Connection
const databaseUrl = process.env.DATABASE_URL || "postgresql://family_user:family_password@db:5432/family_tree_db?schema=public";

const app = express();

// Create a PostgreSQL connection pool
const pool = new pg.Pool({ connectionString: databaseUrl });

// Create the Prisma adapter with the pool
const adapter = new PrismaAdapterPg(pool);

// Create the Prisma Client with the adapter
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large photo uploads

// --- API Routes ---

// Login
app.post('/api/auth/login', async (req, res) => {
  const { code, password } = req.body;
  try {
    const family = await prisma.family.findUnique({
      where: { code }
    });
    if (family && family.password === password) {
      // Parse root JSON before sending
      const root = JSON.parse(family.root);
      res.json({ ...family, root });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  const { code, name, password, root } = req.body;
  try {
    const family = await prisma.family.create({
      data: {
        code,
        name,
        password,
        root: JSON.stringify(root)
      }
    });
    res.json({ ...family, root: JSON.parse(family.root) });
  } catch (error) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Family code already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Update Tree
app.post('/api/family/update', async (req, res) => {
  const { code, root } = req.body;
  try {
    const family = await prisma.family.update({
      where: { code },
      data: { root: JSON.stringify(root) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Family (Raw)
app.get('/api/family/:code', async (req, res) => {
  try {
    const family = await prisma.family.findUnique({
      where: { code: req.params.code }
    });
    if (family) {
      res.json({ ...family, root: JSON.parse(family.root) });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Link Requests
app.post('/api/link/request', async (req, res) => {
  const { fromCode, toCode, targetName, targetBirthYear } = req.body;
  try {
    // Check if request exists
    const existing = await prisma.linkRequest.findFirst({
      where: { fromCode, toCode, status: 'pending' }
    });
    if (existing) return res.json({ success: true });

    await prisma.linkRequest.create({
      data: { fromCode, toCode, targetName, targetBirthYear }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/link/incoming/:code', async (req, res) => {
  try {
    const list = await prisma.linkRequest.findMany({
      where: { toCode: req.params.code, status: 'pending' }
    });
    // Map to frontend interface
    const mapped = list.map(r => ({
      id: r.id,
      fromFamilyCode: r.fromCode,
      toFamilyCode: r.toCode,
      targetName: r.targetName,
      targetBirthYear: r.targetBirthYear,
      status: r.status,
      timestamp: r.createdAt.getTime()
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/link/outgoing/:code', async (req, res) => {
  try {
    const list = await prisma.linkRequest.findMany({
      where: { fromCode: req.params.code }
    });
    const mapped = list.map(r => ({
      id: r.id,
      fromFamilyCode: r.fromCode,
      toFamilyCode: r.toCode,
      targetName: r.targetName,
      targetBirthYear: r.targetBirthYear,
      status: r.status,
      timestamp: r.createdAt.getTime()
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/link/respond', async (req, res) => {
  const { id, status } = req.body;
  try {
    await prisma.linkRequest.update({
      where: { id },
      data: { status }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/link/toggle', async (req, res) => {
  const { id, isHidden } = req.body;
  try {
    await prisma.linkRequest.update({
      where: { id },
      data: { isHidden }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/link/network/:code', async (req, res) => {
  try {
    // Fetch all approved links for network building
    const allLinks = await prisma.linkRequest.findMany({
      where: { status: 'approved' }
    });
    
    const mapped = allLinks.map(r => ({
      id: r.id,
      fromFamilyCode: r.fromCode,
      toFamilyCode: r.toCode,
      targetName: r.targetName,
      targetBirthYear: r.targetBirthYear,
      status: r.status,
      isHidden: r.isHidden,
      timestamp: r.createdAt.getTime()
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SERVE STATIC FRONTEND ---

// Serve static files from the 'dist' directory (Vite build output)
app.use(express.static(path.join(__dirname, 'dist')));

// The "Catch-all" handler: for any request that doesn't match an API route above,
// send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});