import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import {
  calculerChargesPatronales,
  calculerIRSA,
  calculerCNaPSSalarie
} from '../utils/calculs.js';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

const router = Router();

// GET /api/tresorerie/mensuel - Données finances par mois (12 derniers mois)
router.get('/mensuel', async (req: Request, res: Response) => {
  try {
    const config = await prisma.configFlotte.findFirst();
    const moisData: any[] = [];

    for (let i = 11; i >= 0; i--) {
      const mois = subMonths(new Date(), i);
      const debut = startOfMonth(mois);
      const fin = endOfMonth(mois);

      // Recettes (versements)
      const versements = await prisma.versement.aggregate({
        where: { date: { gte: debut, lte: fin } },
        _sum: { montant: true }
      });

      // Réparations
      const reparations = await prisma.reparation.aggregate({
        where: { date: { gte: debut, lte: fin } },
        _sum: { cout: true }
      });

      // Calcul masse salariale
      const chauffeurs = await prisma.chauffeur.findMany({
        where: { statut: 'actif' }
      });
      const employes = await prisma.employe.findMany({
        where: { statut: 'actif' }
      });

      const masseSalariale = chauffeurs.reduce((acc, c) => acc + c.salaire, 0) +
                            employes.reduce((acc, e) => acc + e.salaire, 0);
      const chargesPatronales = calculerChargesPatronales(masseSalariale);

      // Assurance mensuelle
      const nbVoitures = await prisma.voiture.count();
      const assuranceMensuelle = ((config?.assuranceAnnuelle || 100000) * nbVoitures) / 12;

      const recettes = versements._sum.montant || 0;
      const charges = masseSalariale + chargesPatronales +
                     (reparations._sum.cout || 0) + assuranceMensuelle;
      const beneficeNet = recettes - charges;

      moisData.push({
        mois: format(mois, 'yyyy-MM'),
        label: format(mois, 'MMM yyyy'),
        recettes: Math.round(recettes),
        charges: Math.round(charges),
        beneficeNet: Math.round(beneficeNet),
        details: {
          masseSalariale: Math.round(masseSalariale),
          chargesPatronales: Math.round(chargesPatronales),
          reparations: Math.round(reparations._sum.cout || 0),
          assurance: Math.round(assuranceMensuelle)
        }
      });
    }

    res.json(moisData);
  } catch (error) {
    console.error('Erreur trésorerie mensuel:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/tresorerie/enveloppes - État des enveloppes
router.get('/enveloppes', async (req: Request, res: Response) => {
  try {
    const moisActuel = startOfMonth(new Date());

    // Récupérer ou créer l'enveloppe du mois
    let enveloppe = await prisma.enveloppe.findFirst({
      where: { mois: moisActuel }
    });

    if (!enveloppe) {
      // Calculer les valeurs basées sur le bénéfice du mois précédent
      const moisPrecedent = subMonths(moisActuel, 1);
      const debut = startOfMonth(moisPrecedent);
      const fin = endOfMonth(moisPrecedent);

      const versements = await prisma.versement.aggregate({
        where: { date: { gte: debut, lte: fin } },
        _sum: { montant: true }
      });

      const reparations = await prisma.reparation.aggregate({
        where: { date: { gte: debut, lte: fin } },
        _sum: { cout: true }
      });

      const chauffeurs = await prisma.chauffeur.findMany({ where: { statut: 'actif' } });
      const employes = await prisma.employe.findMany({ where: { statut: 'actif' } });
      const masseSalariale = chauffeurs.reduce((acc, c) => acc + c.salaire, 0) +
                            employes.reduce((acc, e) => acc + e.salaire, 0);
      const chargesPatronales = calculerChargesPatronales(masseSalariale);

      const config = await prisma.configFlotte.findFirst();
      const nbVoitures = await prisma.voiture.count();
      const assuranceMensuelle = ((config?.assuranceAnnuelle || 100000) * nbVoitures) / 12;

      const recettes = versements._sum.montant || 0;
      const charges = masseSalariale + chargesPatronales +
                     (reparations._sum.cout || 0) + assuranceMensuelle;
      const beneficeNet = recettes - charges;

      // Calcul des enveloppes selon les règles métier
      const reservePieces = Math.min(500000, beneficeNet * 0.15);
      const reserveIS = beneficeNet * 0.20; // 20% IS
      const beneficeApresReserves = beneficeNet - reservePieces - reserveIS;
      const fondsCroissance = beneficeApresReserves * 0.50; // 50% du reste
      const pochePersonnelle = beneficeApresReserves - fondsCroissance;

      enveloppe = await prisma.enveloppe.create({
        data: {
          mois: moisActuel,
          reservePieces: Math.max(0, reservePieces),
          fondsCroissance: Math.max(0, fondsCroissance),
          pochePersonnelle: Math.max(0, pochePersonnelle),
          reserveIS: Math.max(0, reserveIS)
        }
      });
    }

    res.json({
      mois: format(moisActuel, 'MMMM yyyy'),
      reservePieces: Math.round(enveloppe.reservePieces),
      fondsCroissance: Math.round(enveloppe.fondsCroissance),
      pochePersonnelle: Math.round(enveloppe.pochePersonnelle),
      reserveIS: Math.round(enveloppe.reserveIS),
      objectifReservePieces: 500000
    });
  } catch (error) {
    console.error('Erreur enveloppes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/tresorerie/charges-fixes - Détail des charges fixes mensuelles
router.get('/charges-fixes', async (req: Request, res: Response) => {
  try {
    const config = await prisma.configFlotte.findFirst();

    // Masse salariale chauffeurs
    const chauffeurs = await prisma.chauffeur.findMany({
      where: { statut: 'actif' }
    });
    const masseSalarialeChauffeurs = chauffeurs.reduce((acc, c) => acc + c.salaire, 0);

    // Masse salariale employés
    const employes = await prisma.employe.findMany({
      where: { statut: 'actif' }
    });
    const masseSalarialeEmployes = employes.reduce((acc, e) => acc + e.salaire, 0);

    const masseSalarialeTotal = masseSalarialeChauffeurs + masseSalarialeEmployes;

    // Charges patronales
    const chargesCNaPSOSTIE = calculerChargesPatronales(masseSalarialeTotal);

    // Vidanges estimées (nombre de voitures / 2 car vidange tous les 2 mois)
    const nbVoitures = await prisma.voiture.count({ where: { statut: 'active' } });
    const vidangesEstimees = (nbVoitures / 2) * (config?.coutVidange || 250000);

    // Pièces estimées
    const piecesEstimees = nbVoitures * (config?.coutPiecesEstime || 100000);

    // Assurance
    const assuranceMensuelle = ((config?.assuranceAnnuelle || 100000) * nbVoitures) / 12;

    // IRSA total
    let irsaTotal = 0;
    for (const c of chauffeurs) {
      irsaTotal += calculerIRSA(c.salaire);
    }
    for (const e of employes) {
      irsaTotal += calculerIRSA(e.salaire);
    }

    res.json({
      masseSalarialeChauffeurs: Math.round(masseSalarialeChauffeurs),
      masseSalarialeEmployes: Math.round(masseSalarialeEmployes),
      masseSalarialeTotal: Math.round(masseSalarialeTotal),
      chargesCNaPSOSTIE: Math.round(chargesCNaPSOSTIE),
      vidangesEstimees: Math.round(vidangesEstimees),
      piecesEstimees: Math.round(piecesEstimees),
      assuranceMensuelle: Math.round(assuranceMensuelle),
      irsaTotal: Math.round(irsaTotal),
      totalChargesFixes: Math.round(
        masseSalarialeTotal + chargesCNaPSOSTIE + vidangesEstimees +
        piecesEstimees + assuranceMensuelle
      )
    });
  } catch (error) {
    console.error('Erreur charges fixes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/tresorerie/export-csv - Export CSV du mois
router.get('/export-csv', async (req: Request, res: Response) => {
  try {
    const { mois } = req.query;
    const targetDate = mois ? new Date(mois as string) : new Date();
    const debut = startOfMonth(targetDate);
    const fin = endOfMonth(targetDate);

    const versements = await prisma.versement.findMany({
      where: { date: { gte: debut, lte: fin } },
      include: { voiture: true, chauffeur: true },
      orderBy: { date: 'asc' }
    });

    // Génération CSV
    let csv = 'Date,Voiture,Chauffeur,Montant,Statut\n';
    for (const v of versements) {
      csv += `${format(v.date, 'yyyy-MM-dd')},${v.voiture.immatriculation},${v.chauffeur.prenom} ${v.chauffeur.nom},${v.montant},${v.statut}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=versements-${format(debut, 'yyyy-MM')}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Erreur export CSV:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
