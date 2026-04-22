import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import des routes
import dashboardRoutes from './routes/dashboard.js';
import voituresRoutes from './routes/voitures.js';
import chauffeursRoutes from './routes/chauffeurs.js';
import versementsRoutes from './routes/versements.js';
import reparationsRoutes from './routes/reparations.js';
import tresorerieRoutes from './routes/tresorerie.js';
import rhRoutes from './routes/rh.js';
import projectionRoutes from './routes/projection.js';
import configRoutes from './routes/config.js';
import employesRoutes from './routes/employes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  process.env.FRONTEND_URL,
  'https://frontend-production-e45d.up.railway.app',
  'https://midev-swift.work'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (comme les apps mobiles ou Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Autoriser tous les origines pour le dev
    }
  },
  credentials: true
}));
app.use(express.json());

// Routes API
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/voitures', voituresRoutes);
app.use('/api/chauffeurs', chauffeursRoutes);
app.use('/api/versements', versementsRoutes);
app.use('/api/reparations', reparationsRoutes);
app.use('/api/tresorerie', tresorerieRoutes);
app.use('/api/rh', rhRoutes);
app.use('/api/projection', projectionRoutes);
app.use('/api/config', configRoutes);
app.use('/api/employes', employesRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});

export default app;
