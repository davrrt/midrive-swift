import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { subDays, startOfDay, endOfDay } from 'date-fns';

const router = Router();

// GET /api/chauffeurs - Liste des chauffeurs
router.get('/', async (req: Request, res: Response) => {
  try {
    const chauffeurs = await prisma.chauffeur.findMany({
      include: {
        voiture: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calcul des statistiques pour chaque chauffeur
    const config = await prisma.configFlotte.findFirst();
    const objectifJournalier = config?.versementJournalier || 80000;
    const trenteDerniersJours = subDays(new Date(), 30);

    const chauffeursAvecStats = await Promise.all(
      chauffeurs.map(async (chauffeur) => {
        const versements = await prisma.versement.findMany({
          where: {
            chauffeurId: chauffeur.id,
            date: { gte: trenteDerniersJours }
          }
        });

        const totalVersements = versements.reduce((acc, v) => acc + v.montant, 0);
        const nbVersements = versements.length;
        const moyenneVersement = nbVersements > 0 ? totalVersements / nbVersements : 0;
        const versementsOk = versements.filter(v => v.statut === 'ok').length;
        const tauxPonctualite = nbVersements > 0 ?
          Math.round((versementsOk / nbVersements) * 100) : 0;

        return {
          ...chauffeur,
          totalVersements30j: totalVersements,
          nbVersements30j: nbVersements,
          moyenneVersement: Math.round(moyenneVersement),
          tauxPonctualite,
          performanceVsObjectif: Math.round((moyenneVersement / objectifJournalier) * 100)
        };
      })
    );

    res.json(chauffeursAvecStats);
  } catch (error) {
    console.error('Erreur liste chauffeurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/chauffeurs/:id - Détail d'un chauffeur
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const chauffeur = await prisma.chauffeur.findUnique({
      where: { id },
      include: {
        voiture: true,
        versements: {
          orderBy: { date: 'desc' },
          take: 30
        }
      }
    });

    if (!chauffeur) {
      return res.status(404).json({ error: 'Chauffeur non trouvé' });
    }

    res.json(chauffeur);
  } catch (error) {
    console.error('Erreur détail chauffeur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/chauffeurs - Ajouter un chauffeur
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      nom,
      prenom,
      telephone,
      salaire,
      dateDebut,
      voitureId
    } = req.body;

    const chauffeur = await prisma.chauffeur.create({
      data: {
        nom,
        prenom,
        telephone,
        statut: 'actif',
        salaire: parseFloat(salaire) || 500000,
        dateDebut: new Date(dateDebut),
        voitureId: voitureId || null
      }
    });

    res.status(201).json(chauffeur);
  } catch (error) {
    console.error('Erreur création chauffeur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/chauffeurs/:id - Modifier un chauffeur
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      nom,
      prenom,
      telephone,
      statut,
      salaire,
      voitureId
    } = req.body;

    const chauffeur = await prisma.chauffeur.update({
      where: { id },
      data: {
        ...(nom && { nom }),
        ...(prenom && { prenom }),
        ...(telephone && { telephone }),
        ...(statut && { statut }),
        ...(salaire !== undefined && { salaire: parseFloat(salaire) }),
        ...(voitureId !== undefined && { voitureId: voitureId || null })
      }
    });

    res.json(chauffeur);
  } catch (error) {
    console.error('Erreur modification chauffeur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/chauffeurs/:id/assigner - Assigner une voiture à un chauffeur
router.put('/:id/assigner', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { voitureId } = req.body;

    // Vérifier si la voiture n'est pas déjà assignée
    if (voitureId) {
      const voitureOccupee = await prisma.chauffeur.findFirst({
        where: {
          voitureId,
          id: { not: id }
        }
      });

      if (voitureOccupee) {
        return res.status(400).json({
          error: 'Cette voiture est déjà assignée à un autre chauffeur'
        });
      }
    }

    const chauffeur = await prisma.chauffeur.update({
      where: { id },
      data: { voitureId: voitureId || null },
      include: { voiture: true }
    });

    res.json(chauffeur);
  } catch (error) {
    console.error('Erreur assignation voiture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/chauffeurs/:id/versements - Historique versements d'un chauffeur
router.get('/:id/versements', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '30' } = req.query;

    const versements = await prisma.versement.findMany({
      where: { chauffeurId: id },
      include: { voiture: true },
      orderBy: { date: 'desc' },
      take: parseInt(limit as string)
    });

    res.json(versements);
  } catch (error) {
    console.error('Erreur versements chauffeur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
