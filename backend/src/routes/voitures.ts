import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { calculerAmortissement, joursDepuis } from '../utils/calculs.js';

const router = Router();

// GET /api/voitures - Liste de toutes les voitures
router.get('/', async (req: Request, res: Response) => {
  try {
    const voitures = await prisma.voiture.findMany({
      include: {
        chauffeur: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const voituresAvecDetails = voitures.map(v => ({
      ...v,
      joursDepuisVidange: v.derniereVidange ? joursDepuis(v.derniereVidange) : null,
      amortissementMensuel: calculerAmortissement(v.prixAchat)
    }));

    res.json(voituresAvecDetails);
  } catch (error) {
    console.error('Erreur liste voitures:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/voitures/:id - Détail d'une voiture
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const voiture = await prisma.voiture.findUnique({
      where: { id },
      include: {
        chauffeur: true,
        versements: {
          orderBy: { date: 'desc' },
          take: 30,
          include: { chauffeur: true }
        },
        reparations: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!voiture) {
      return res.status(404).json({ error: 'Voiture non trouvée' });
    }

    const totalReparations = voiture.reparations.reduce((acc, r) => acc + r.cout, 0);
    const totalVersements = voiture.versements.reduce((acc, v) => acc + v.montant, 0);

    res.json({
      ...voiture,
      joursDepuisVidange: voiture.derniereVidange ? joursDepuis(voiture.derniereVidange) : null,
      amortissementMensuel: calculerAmortissement(voiture.prixAchat),
      totalReparations,
      totalVersements
    });
  } catch (error) {
    console.error('Erreur détail voiture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/voitures - Ajouter une nouvelle voiture
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      immatriculation,
      marque,
      modele,
      annee,
      dateAchat,
      prixAchat,
      kilometrage
    } = req.body;

    const voiture = await prisma.voiture.create({
      data: {
        immatriculation,
        marque,
        modele,
        annee: parseInt(annee),
        statut: 'active',
        dateAchat: new Date(dateAchat),
        prixAchat: parseFloat(prixAchat),
        kilometrage: parseInt(kilometrage) || 0,
        derniereVidange: new Date(dateAchat) // Vidange supposée faite à l'achat
      }
    });

    res.status(201).json(voiture);
  } catch (error) {
    console.error('Erreur création voiture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/voitures/:id - Modifier une voiture
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      immatriculation,
      marque,
      modele,
      annee,
      statut,
      kilometrage,
      derniereVidange
    } = req.body;

    const voiture = await prisma.voiture.update({
      where: { id },
      data: {
        ...(immatriculation && { immatriculation }),
        ...(marque && { marque }),
        ...(modele && { modele }),
        ...(annee && { annee: parseInt(annee) }),
        ...(statut && { statut }),
        ...(kilometrage !== undefined && { kilometrage: parseInt(kilometrage) }),
        ...(derniereVidange && { derniereVidange: new Date(derniereVidange) })
      }
    });

    res.json(voiture);
  } catch (error) {
    console.error('Erreur modification voiture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/voitures/:id/historique - Historique complet d'une voiture
router.get('/:id/historique', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [versements, reparations] = await Promise.all([
      prisma.versement.findMany({
        where: { voitureId: id },
        include: { chauffeur: true },
        orderBy: { date: 'desc' }
      }),
      prisma.reparation.findMany({
        where: { voitureId: id },
        orderBy: { date: 'desc' }
      })
    ]);

    res.json({ versements, reparations });
  } catch (error) {
    console.error('Erreur historique voiture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/voitures/:id/vidange - Enregistrer une vidange
router.put('/:id/vidange', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const config = await prisma.configFlotte.findFirst();
    const coutVidange = config?.coutVidange || 250000;

    // Mettre à jour la date de vidange
    const voiture = await prisma.voiture.update({
      where: { id },
      data: { derniereVidange: new Date() }
    });

    // Créer une réparation de type vidange
    await prisma.reparation.create({
      data: {
        type: 'vidange',
        description: 'Vidange périodique',
        cout: coutVidange,
        voitureId: id
      }
    });

    res.json(voiture);
  } catch (error) {
    console.error('Erreur vidange:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
