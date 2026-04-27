import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { getStatutVersement } from '../utils/calculs.js';

const router = Router();

// GET /api/versements - Liste des versements
router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit = '50', voitureId, chauffeurId } = req.query;

    const versements = await prisma.versement.findMany({
      where: {
        ...(voitureId && { voitureId: voitureId as string }),
        ...(chauffeurId && { chauffeurId: chauffeurId as string })
      },
      include: {
        voiture: true,
        chauffeur: true
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit as string)
    });

    res.json(versements);
  } catch (error) {
    console.error('Erreur liste versements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/versements - Saisir un versement
router.post('/', async (req: Request, res: Response) => {
  try {
    const { montant, voitureId, chauffeurId, date, kilometrage, carburantMontant, carburantLitres } = req.body;

    // Récupérer l'objectif journalier
    const config = await prisma.configFlotte.findFirst();
    const objectif = config?.versementJournalier || 80000;

    const montantNum = parseFloat(montant);
    const statut = getStatutVersement(montantNum, objectif);

    const versement = await prisma.versement.create({
      data: {
        montant: montantNum,
        statut,
        voitureId,
        chauffeurId,
        date: date ? new Date(date) : new Date(),
        ...(kilometrage !== undefined && { kilometrage: parseInt(kilometrage) }),
        ...(carburantMontant !== undefined && { carburantMontant: parseFloat(carburantMontant) }),
        ...(carburantLitres !== undefined && { carburantLitres: parseFloat(carburantLitres) }),
      },
      include: {
        voiture: true,
        chauffeur: true
      }
    });

    res.status(201).json(versement);
  } catch (error) {
    console.error('Erreur création versement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/versements/:id - Modifier un versement
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { montant, statut } = req.body;

    const config = await prisma.configFlotte.findFirst();
    const objectif = config?.versementJournalier || 80000;

    const montantNum = montant ? parseFloat(montant) : undefined;
    const nouveauStatut = montantNum ?
      getStatutVersement(montantNum, objectif) : statut;

    const versement = await prisma.versement.update({
      where: { id },
      data: {
        ...(montantNum !== undefined && { montant: montantNum }),
        ...(nouveauStatut && { statut: nouveauStatut })
      },
      include: {
        voiture: true,
        chauffeur: true
      }
    });

    res.json(versement);
  } catch (error) {
    console.error('Erreur modification versement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/versements/:id - Supprimer un versement
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.versement.delete({
      where: { id }
    });

    res.json({ message: 'Versement supprimé' });
  } catch (error) {
    console.error('Erreur suppression versement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
