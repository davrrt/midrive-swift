import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import {
  calculerIRSA,
  calculerCNaPSSalarie,
  calculerCNaPSPatronal,
  calculerOSTIE,
  calculerSalaireNet,
  calculerChargesPatronales
} from '../utils/calculs.js';
import { format } from 'date-fns';

const router = Router();

// GET /api/rh/paie - Calcul paie tous employés
router.get('/paie', async (req: Request, res: Response) => {
  try {
    // Récupérer tous les chauffeurs actifs
    const chauffeurs = await prisma.chauffeur.findMany({
      where: { statut: 'actif' },
      include: { voiture: true }
    });

    // Récupérer tous les employés actifs
    const employes = await prisma.employe.findMany({
      where: { statut: 'actif' }
    });

    // Calculer la fiche de paie pour chaque personne
    const fichesPaie = [];

    // Chauffeurs
    for (const chauffeur of chauffeurs) {
      const irsa = calculerIRSA(chauffeur.salaire);
      const cnapsSalarie = calculerCNaPSSalarie(chauffeur.salaire);
      const salaireNet = calculerSalaireNet(chauffeur.salaire);
      const cnapsPatronal = calculerCNaPSPatronal(chauffeur.salaire);
      const ostie = calculerOSTIE(chauffeur.salaire);

      fichesPaie.push({
        id: chauffeur.id,
        type: 'chauffeur',
        nom: `${chauffeur.prenom} ${chauffeur.nom}`,
        poste: 'Chauffeur',
        voiture: chauffeur.voiture?.immatriculation || null,
        salaireBrut: chauffeur.salaire,
        irsa,
        cnapsSalarie,
        salaireNet,
        cnapsPatronal,
        ostie,
        chargesPatronales: cnapsPatronal + ostie,
        coutTotal: chauffeur.salaire + cnapsPatronal + ostie
      });
    }

    // Employés
    for (const employe of employes) {
      const irsa = calculerIRSA(employe.salaire);
      const cnapsSalarie = calculerCNaPSSalarie(employe.salaire);
      const salaireNet = calculerSalaireNet(employe.salaire);
      const cnapsPatronal = calculerCNaPSPatronal(employe.salaire);
      const ostie = calculerOSTIE(employe.salaire);

      fichesPaie.push({
        id: employe.id,
        type: 'employe',
        nom: `${employe.prenom} ${employe.nom}`,
        poste: employe.poste,
        voiture: null,
        salaireBrut: employe.salaire,
        irsa,
        cnapsSalarie,
        salaireNet,
        cnapsPatronal,
        ostie,
        chargesPatronales: cnapsPatronal + ostie,
        coutTotal: employe.salaire + cnapsPatronal + ostie
      });
    }

    // Totaux
    const totaux = fichesPaie.reduce((acc, f) => ({
      salaireBrut: acc.salaireBrut + f.salaireBrut,
      irsa: acc.irsa + f.irsa,
      cnapsSalarie: acc.cnapsSalarie + f.cnapsSalarie,
      salaireNet: acc.salaireNet + f.salaireNet,
      cnapsPatronal: acc.cnapsPatronal + f.cnapsPatronal,
      ostie: acc.ostie + f.ostie,
      chargesPatronales: acc.chargesPatronales + f.chargesPatronales,
      coutTotal: acc.coutTotal + f.coutTotal
    }), {
      salaireBrut: 0,
      irsa: 0,
      cnapsSalarie: 0,
      salaireNet: 0,
      cnapsPatronal: 0,
      ostie: 0,
      chargesPatronales: 0,
      coutTotal: 0
    });

    res.json({
      fiches: fichesPaie,
      totaux,
      nombrePersonnes: fichesPaie.length,
      mois: format(new Date(), 'MMMM yyyy')
    });
  } catch (error) {
    console.error('Erreur paie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/rh/bulletin/:id - Générer bulletin de paie PDF (retourne les données)
router.get('/bulletin/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type = 'chauffeur' } = req.query;

    let personne: any;

    if (type === 'chauffeur') {
      personne = await prisma.chauffeur.findUnique({
        where: { id },
        include: { voiture: true }
      });
    } else {
      personne = await prisma.employe.findUnique({
        where: { id }
      });
    }

    if (!personne) {
      return res.status(404).json({ error: 'Personne non trouvée' });
    }

    const salaireBrut = personne.salaire;
    const irsa = calculerIRSA(salaireBrut);
    const cnapsSalarie = calculerCNaPSSalarie(salaireBrut);
    const salaireNet = calculerSalaireNet(salaireBrut);
    const cnapsPatronal = calculerCNaPSPatronal(salaireBrut);
    const ostie = calculerOSTIE(salaireBrut);

    const bulletin = {
      entreprise: 'VTC Madagascar',
      periode: format(new Date(), 'MMMM yyyy'),
      dateEmission: format(new Date(), 'dd/MM/yyyy'),
      employe: {
        nom: type === 'chauffeur' ?
          `${personne.prenom} ${personne.nom}` :
          `${personne.prenom} ${personne.nom}`,
        poste: type === 'chauffeur' ? 'Chauffeur' : personne.poste,
        dateDebut: format(personne.dateDebut, 'dd/MM/yyyy')
      },
      salaireBrut,
      retenues: {
        irsa,
        cnapsSalarie,
        totalRetenues: irsa + cnapsSalarie
      },
      salaireNet,
      chargesPatronales: {
        cnapsPatronal,
        ostie,
        totalCharges: cnapsPatronal + ostie
      },
      coutTotal: salaireBrut + cnapsPatronal + ostie
    };

    res.json(bulletin);
  } catch (error) {
    console.error('Erreur bulletin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/rh/statistiques - Statistiques RH
router.get('/statistiques', async (req: Request, res: Response) => {
  try {
    const chauffeursActifs = await prisma.chauffeur.count({
      where: { statut: 'actif' }
    });
    const chauffeursInactifs = await prisma.chauffeur.count({
      where: { statut: { not: 'actif' } }
    });
    const employesActifs = await prisma.employe.count({
      where: { statut: 'actif' }
    });

    const chauffeurs = await prisma.chauffeur.findMany({
      where: { statut: 'actif' }
    });
    const employes = await prisma.employe.findMany({
      where: { statut: 'actif' }
    });

    const masseSalarialeChauffeurs = chauffeurs.reduce((acc, c) => acc + c.salaire, 0);
    const masseSalarialeEmployes = employes.reduce((acc, e) => acc + e.salaire, 0);
    const masseSalarialeTotal = masseSalarialeChauffeurs + masseSalarialeEmployes;
    const chargesPatronales = calculerChargesPatronales(masseSalarialeTotal);

    res.json({
      effectifs: {
        chauffeursActifs,
        chauffeursInactifs,
        employesActifs,
        total: chauffeursActifs + employesActifs
      },
      masseSalariale: {
        chauffeurs: masseSalarialeChauffeurs,
        employes: masseSalarialeEmployes,
        total: masseSalarialeTotal,
        chargesPatronales,
        coutTotal: masseSalarialeTotal + chargesPatronales
      }
    });
  } catch (error) {
    console.error('Erreur statistiques RH:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
