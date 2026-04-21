import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/employes - Liste des employés
router.get('/', async (req: Request, res: Response) => {
  try {
    const { statut } = req.query;

    const employes = await prisma.employe.findMany({
      where: {
        ...(statut && { statut: statut as string })
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(employes);
  } catch (error) {
    console.error('Erreur liste employés:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/employes/:id - Détail d'un employé
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const employe = await prisma.employe.findUnique({
      where: { id }
    });

    if (!employe) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    res.json(employe);
  } catch (error) {
    console.error('Erreur détail employé:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/employes - Ajouter un employé
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nom, prenom, poste, salaire, dateDebut } = req.body;

    const employe = await prisma.employe.create({
      data: {
        nom,
        prenom,
        poste,
        salaire: parseFloat(salaire),
        dateDebut: new Date(dateDebut),
        statut: 'actif'
      }
    });

    res.status(201).json(employe);
  } catch (error) {
    console.error('Erreur création employé:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/employes/:id - Modifier un employé
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nom, prenom, poste, salaire, statut } = req.body;

    const employe = await prisma.employe.update({
      where: { id },
      data: {
        ...(nom && { nom }),
        ...(prenom && { prenom }),
        ...(poste && { poste }),
        ...(salaire !== undefined && { salaire: parseFloat(salaire) }),
        ...(statut && { statut })
      }
    });

    res.json(employe);
  } catch (error) {
    console.error('Erreur modification employé:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/employes/:id - Supprimer un employé
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.employe.delete({
      where: { id }
    });

    res.json({ message: 'Employé supprimé' });
  } catch (error) {
    console.error('Erreur suppression employé:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
