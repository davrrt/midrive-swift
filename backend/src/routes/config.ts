import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/config - Récupérer la configuration
router.get('/', async (req: Request, res: Response) => {
  try {
    let config = await prisma.configFlotte.findFirst();

    // Créer une config par défaut si elle n'existe pas
    if (!config) {
      config = await prisma.configFlotte.create({
        data: {
          versementJournalier: 80000,
          joursExploitation: 26,
          coutVidange: 250000,
          intervalleVidange: 60,
          coutPiecesEstime: 100000,
          assuranceAnnuelle: 100000,
          objectifVoitures: 15,
          prixVoiture: 12000000,
          injectionMensuelle: 4000000
        }
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Erreur récupération config:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/config - Modifier la configuration
router.put('/', async (req: Request, res: Response) => {
  try {
    const {
      versementJournalier,
      joursExploitation,
      coutVidange,
      intervalleVidange,
      coutPiecesEstime,
      assuranceAnnuelle,
      objectifVoitures,
      prixVoiture,
      injectionMensuelle
    } = req.body;

    let config = await prisma.configFlotte.findFirst();

    if (!config) {
      config = await prisma.configFlotte.create({
        data: {
          versementJournalier: parseFloat(versementJournalier) || 80000,
          joursExploitation: parseInt(joursExploitation) || 26,
          coutVidange: parseFloat(coutVidange) || 250000,
          intervalleVidange: parseInt(intervalleVidange) || 60,
          coutPiecesEstime: parseFloat(coutPiecesEstime) || 100000,
          assuranceAnnuelle: parseFloat(assuranceAnnuelle) || 100000,
          objectifVoitures: parseInt(objectifVoitures) || 15,
          prixVoiture: parseFloat(prixVoiture) || 12000000,
          injectionMensuelle: parseFloat(injectionMensuelle) || 4000000
        }
      });
    } else {
      config = await prisma.configFlotte.update({
        where: { id: config.id },
        data: {
          ...(versementJournalier !== undefined && {
            versementJournalier: parseFloat(versementJournalier)
          }),
          ...(joursExploitation !== undefined && {
            joursExploitation: parseInt(joursExploitation)
          }),
          ...(coutVidange !== undefined && {
            coutVidange: parseFloat(coutVidange)
          }),
          ...(intervalleVidange !== undefined && {
            intervalleVidange: parseInt(intervalleVidange)
          }),
          ...(coutPiecesEstime !== undefined && {
            coutPiecesEstime: parseFloat(coutPiecesEstime)
          }),
          ...(assuranceAnnuelle !== undefined && {
            assuranceAnnuelle: parseFloat(assuranceAnnuelle)
          }),
          ...(objectifVoitures !== undefined && {
            objectifVoitures: parseInt(objectifVoitures)
          }),
          ...(prixVoiture !== undefined && {
            prixVoiture: parseFloat(prixVoiture)
          }),
          ...(injectionMensuelle !== undefined && {
            injectionMensuelle: parseFloat(injectionMensuelle)
          })
        }
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Erreur modification config:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
