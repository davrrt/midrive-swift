import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, startOfWeek, endOfWeek } from 'date-fns';

const router = Router();

// GET /api/dashboard/summary - KPIs du jour et du mois
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startWeek = startOfWeek(today, { weekStartsOn: 1 }); // Lundi
    const endWeekDate = endOfWeek(today, { weekStartsOn: 1 }); // Dimanche
    const startMonth = startOfMonth(today);
    const endMonth = endOfMonth(today);

    // Récupérer la configuration
    const config = await prisma.configFlotte.findFirst();
    const versementJournalier = config?.versementJournalier || 80000;
    const joursExploitation = config?.joursExploitation || 26;

    // Versements de la semaine
    const versementsSemaine = await prisma.versement.aggregate({
      where: {
        date: { gte: startWeek, lte: endWeekDate }
      },
      _sum: { montant: true }
    });

    // Versements du mois
    const versementsMois = await prisma.versement.aggregate({
      where: {
        date: { gte: startMonth, lte: endMonth }
      },
      _sum: { montant: true }
    });

    // Nombre de voitures actives
    const voituresActives = await prisma.voiture.count({
      where: { statut: 'active' }
    });

    const totalVoitures = await prisma.voiture.count();

    // Calcul des charges mensuelles
    const chauffeurs = await prisma.chauffeur.findMany({
      where: { statut: 'actif' }
    });
    const masseSalarialeChauffeurs = chauffeurs.reduce((acc, c) => acc + c.salaire, 0);

    const employes = await prisma.employe.findMany({
      where: { statut: 'actif' }
    });
    const masseSalarialeEmployes = employes.reduce((acc, e) => acc + e.salaire, 0);

    const masseSalarialeTotal = masseSalarialeChauffeurs + masseSalarialeEmployes;
    const chargesPatronales = masseSalarialeTotal * 0.18; // CNaPS 13% + OSTIE 5%

    // Réparations du mois
    const reparationsMois = await prisma.reparation.aggregate({
      where: {
        date: { gte: startMonth, lte: endMonth }
      },
      _sum: { cout: true }
    });

    // Assurance mensuelle (annuelle / 12)
    const assuranceMensuelle = (config?.assuranceAnnuelle || 100000) * totalVoitures / 12;

    // Calcul bénéfice net
    const recetteBruteMois = versementsMois._sum.montant || 0;
    const chargesMois = masseSalarialeTotal + chargesPatronales +
                        (reparationsMois._sum.cout || 0) + assuranceMensuelle;
    const beneficeNetMois = recetteBruteMois - chargesMois;

    // Objectif mensuel
    const objectifMensuel = versementJournalier * joursExploitation * voituresActives;

    res.json({
      recetteSemaine: versementsSemaine._sum.montant || 0,
      recetteMois: recetteBruteMois,
      beneficeNetMois: Math.round(beneficeNetMois),
      voituresActives,
      totalVoitures,
      objectifMensuel,
      progressionObjectif: objectifMensuel > 0 ?
        Math.round((recetteBruteMois / objectifMensuel) * 100) : 0
    });
  } catch (error) {
    console.error('Erreur dashboard summary:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/dashboard/versements-jour - Versements du jour
router.get('/versements-jour', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startDay = startOfDay(today);
    const endDay = endOfDay(today);

    const versements = await prisma.versement.findMany({
      where: {
        date: { gte: startDay, lte: endDay }
      },
      include: {
        voiture: true,
        chauffeur: true
      },
      orderBy: { date: 'desc' }
    });

    res.json(versements);
  } catch (error) {
    console.error('Erreur versements jour:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/dashboard/alertes - Alertes vidanges et versements manquants
router.get('/alertes', async (req: Request, res: Response) => {
  try {
    const config = await prisma.configFlotte.findFirst();
    const intervalleVidange = config?.intervalleVidange || 60;
    const dateLimit = subDays(new Date(), intervalleVidange);

    // Voitures avec vidange en retard
    const voituresVidangeRetard = await prisma.voiture.findMany({
      where: {
        statut: 'active',
        OR: [
          { derniereVidange: null },
          { derniereVidange: { lt: dateLimit } }
        ]
      },
      include: { chauffeur: true }
    });

    // Chauffeurs sans versement depuis 2 jours
    const deuxJoursAvant = startOfDay(subDays(new Date(), 2));
    const chauffeursActifs = await prisma.chauffeur.findMany({
      where: { statut: 'actif' },
      include: {
        versements: {
          where: { date: { gte: deuxJoursAvant } },
          orderBy: { date: 'desc' },
          take: 1
        },
        voiture: true
      }
    });

    const chauffeursSansVersement = chauffeursActifs.filter(c => c.versements.length === 0);

    res.json({
      vidangesRetard: voituresVidangeRetard.map(v => ({
        id: v.id,
        immatriculation: v.immatriculation,
        marque: v.marque,
        modele: v.modele,
        derniereVidange: v.derniereVidange,
        chauffeur: v.chauffeur ? `${v.chauffeur.prenom} ${v.chauffeur.nom}` : null
      })),
      chauffeursSansVersement: chauffeursSansVersement.map(c => ({
        id: c.id,
        nom: `${c.prenom} ${c.nom}`,
        voiture: c.voiture?.immatriculation || null
      }))
    });
  } catch (error) {
    console.error('Erreur alertes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/dashboard/recettes-30j - Graphique recettes 30 derniers jours
router.get('/recettes-30j', async (req: Request, res: Response) => {
  try {
    const dates: { date: string; montant: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const start = startOfDay(date);
      const end = endOfDay(date);

      const versements = await prisma.versement.aggregate({
        where: {
          date: { gte: start, lte: end }
        },
        _sum: { montant: true }
      });

      dates.push({
        date: date.toISOString().split('T')[0],
        montant: versements._sum.montant || 0
      });
    }

    res.json(dates);
  } catch (error) {
    console.error('Erreur recettes 30j:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
