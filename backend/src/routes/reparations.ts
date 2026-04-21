import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/reparations - Liste des réparations
router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit = '50', voitureId, type } = req.query;

    const reparations = await prisma.reparation.findMany({
      where: {
        ...(voitureId && { voitureId: voitureId as string }),
        ...(type && { type: type as string })
      },
      include: {
        voiture: true
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit as string)
    });

    res.json(reparations);
  } catch (error) {
    console.error('Erreur liste réparations:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/reparations - Ajouter une réparation
router.post('/', async (req: Request, res: Response) => {
  try {
    const { type, description, cout, voitureId, date } = req.body;

    const reparation = await prisma.reparation.create({
      data: {
        type,
        description,
        cout: parseFloat(cout),
        voitureId,
        date: date ? new Date(date) : new Date()
      },
      include: {
        voiture: true
      }
    });

    // Si c'est une vidange, mettre à jour la date de dernière vidange
    if (type === 'vidange') {
      await prisma.voiture.update({
        where: { id: voitureId },
        data: { derniereVidange: new Date(date) || new Date() }
      });
    }

    res.status(201).json(reparation);
  } catch (error) {
    console.error('Erreur création réparation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/reparations/:id - Modifier une réparation
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, description, cout } = req.body;

    const reparation = await prisma.reparation.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(description && { description }),
        ...(cout !== undefined && { cout: parseFloat(cout) })
      },
      include: {
        voiture: true
      }
    });

    res.json(reparation);
  } catch (error) {
    console.error('Erreur modification réparation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/reparations/:id - Supprimer une réparation
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.reparation.delete({
      where: { id }
    });

    res.json({ message: 'Réparation supprimée' });
  } catch (error) {
    console.error('Erreur suppression réparation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
