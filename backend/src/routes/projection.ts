import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { addMonths, format } from 'date-fns';

const router = Router();

// GET /api/projection - Simulation croissance flotte
router.get('/', async (req: Request, res: Response) => {
  try {
    // Paramètres de la requête ou valeurs par défaut de la config
    const config = await prisma.configFlotte.findFirst();

    const {
      nbVoituresActuel,
      beneficeNetActuel,
      injectionMensuelle,
      prixVoiture,
      objectifVoitures
    } = req.query;

    // Valeurs actuelles
    const voituresActuelles = nbVoituresActuel ?
      parseInt(nbVoituresActuel as string) :
      await prisma.voiture.count({ where: { statut: 'active' } });

    const versementJournalier = config?.versementJournalier || 80000;
    const joursExploitation = config?.joursExploitation || 26;
    const salaireChauffeur = 500000; // Salaire moyen chauffeur
    const chargesPatronales = 0.18; // 18% charges

    // Calcul bénéfice net par voiture par mois
    const recetteParVoiture = versementJournalier * joursExploitation;
    const chargesParVoiture = salaireChauffeur * (1 + chargesPatronales) +
                              (config?.coutVidange || 250000) / 2 + // Vidange tous les 2 mois
                              (config?.coutPiecesEstime || 100000) +
                              (config?.assuranceAnnuelle || 100000) / 12;
    const beneficeParVoiture = recetteParVoiture - chargesParVoiture;

    const beneficeActuel = beneficeNetActuel ?
      parseFloat(beneficeNetActuel as string) :
      beneficeParVoiture * voituresActuelles;

    const injection = injectionMensuelle ?
      parseFloat(injectionMensuelle as string) :
      config?.injectionMensuelle || 4000000;

    const prixVoit = prixVoiture ?
      parseFloat(prixVoiture as string) :
      config?.prixVoiture || 12000000;

    const objectif = objectifVoitures ?
      parseInt(objectifVoitures as string) :
      config?.objectifVoitures || 15;

    // Simulation mois par mois
    const simulation: any[] = [];
    let nbVoitures = voituresActuelles;
    let fondsCumule = 0;
    let totalInjecte = 0;
    let moisFinInjection: number | null = null;
    let moisObjectifAtteint: number | null = null;

    const dateDebut = new Date();

    for (let mois = 1; mois <= 36 && nbVoitures < objectif; mois++) {
      const dateMois = addMonths(dateDebut, mois);

      // Calcul du bénéfice du mois
      const beneficeMois = beneficeParVoiture * nbVoitures;
      const recetteMois = recetteParVoiture * nbVoitures;

      // Fonds disponible pour croissance (50% du bénéfice + injection)
      const fondsCroissanceMois = beneficeMois * 0.50;
      let injectionMois = 0;

      // Injection personnelle tant que fonds croissance < besoin
      if (moisFinInjection === null) {
        injectionMois = injection;
        totalInjecte += injection;

        // Arrêt de l'injection si le fonds croissance seul permet d'acheter 1 voiture/mois
        if (fondsCroissanceMois >= prixVoit * 0.8) {
          moisFinInjection = mois;
        }
      }

      fondsCumule += fondsCroissanceMois + injectionMois;

      // Achat de voiture si fonds suffisant
      let action = '-';
      if (fondsCumule >= prixVoit && nbVoitures < objectif) {
        fondsCumule -= prixVoit;
        nbVoitures++;
        action = `Achat voiture #${nbVoitures}`;

        if (nbVoitures >= objectif && moisObjectifAtteint === null) {
          moisObjectifAtteint = mois;
        }
      }

      simulation.push({
        mois,
        date: format(dateMois, 'MMM yyyy'),
        nbVoitures,
        recetteBrute: Math.round(recetteMois),
        beneficeNet: Math.round(beneficeMois),
        injection: injectionMois,
        fondsCroissance: Math.round(fondsCroissanceMois),
        fondsCumule: Math.round(fondsCumule),
        action,
        injectionActive: moisFinInjection === null || mois <= moisFinInjection
      });
    }

    res.json({
      parametres: {
        voituresActuelles,
        beneficeParVoiture: Math.round(beneficeParVoiture),
        injectionMensuelle: injection,
        prixVoiture: prixVoit,
        objectifVoitures: objectif
      },
      simulation,
      resume: {
        totalInjecte,
        moisFinInjection,
        moisObjectifAtteint,
        dureeEstimee: moisObjectifAtteint || simulation.length,
        voituresFinales: nbVoitures
      }
    });
  } catch (error) {
    console.error('Erreur projection:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/projection/simuler - Simulation personnalisée
router.post('/simuler', async (req: Request, res: Response) => {
  try {
    const {
      nbVoituresActuel,
      beneficeNetActuel,
      injectionMensuelle,
      prixVoiture,
      objectifVoitures
    } = req.body;

    const config = await prisma.configFlotte.findFirst();

    const versementJournalier = config?.versementJournalier || 80000;
    const joursExploitation = config?.joursExploitation || 26;
    const salaireChauffeur = 500000;
    const chargesPatronales = 0.18;

    const recetteParVoiture = versementJournalier * joursExploitation;
    const chargesParVoiture = salaireChauffeur * (1 + chargesPatronales) +
                              (config?.coutVidange || 250000) / 2 +
                              (config?.coutPiecesEstime || 100000) +
                              (config?.assuranceAnnuelle || 100000) / 12;
    const beneficeParVoiture = recetteParVoiture - chargesParVoiture;

    const nbVoitures = parseInt(nbVoituresActuel) || 5;
    const benefice = parseFloat(beneficeNetActuel) || beneficeParVoiture * nbVoitures;
    const injection = parseFloat(injectionMensuelle) || 4000000;
    const prixVoit = parseFloat(prixVoiture) || 12000000;
    const objectif = parseInt(objectifVoitures) || 15;

    // Simulation
    const simulation: any[] = [];
    let voitures = nbVoitures;
    let fondsCumule = 0;
    let totalInjecte = 0;
    let moisFinInjection: number | null = null;
    let moisObjectifAtteint: number | null = null;

    const dateDebut = new Date();

    for (let mois = 1; mois <= 48 && voitures < objectif; mois++) {
      const dateMois = addMonths(dateDebut, mois);
      const beneficeMois = beneficeParVoiture * voitures;
      const recetteMois = recetteParVoiture * voitures;
      const fondsCroissanceMois = beneficeMois * 0.50;

      let injectionMois = 0;
      if (moisFinInjection === null) {
        injectionMois = injection;
        totalInjecte += injection;
        if (fondsCroissanceMois >= prixVoit * 0.8) {
          moisFinInjection = mois;
        }
      }

      fondsCumule += fondsCroissanceMois + injectionMois;

      let action = '-';
      if (fondsCumule >= prixVoit && voitures < objectif) {
        fondsCumule -= prixVoit;
        voitures++;
        action = `Achat voiture #${voitures}`;
        if (voitures >= objectif && moisObjectifAtteint === null) {
          moisObjectifAtteint = mois;
        }
      }

      simulation.push({
        mois,
        date: format(dateMois, 'MMM yyyy'),
        nbVoitures: voitures,
        recetteBrute: Math.round(recetteMois),
        beneficeNet: Math.round(beneficeMois),
        injection: injectionMois,
        fondsCroissance: Math.round(fondsCroissanceMois),
        fondsCumule: Math.round(fondsCumule),
        action,
        injectionActive: moisFinInjection === null || mois <= moisFinInjection
      });
    }

    res.json({
      parametres: {
        voituresActuelles: nbVoitures,
        beneficeParVoiture: Math.round(beneficeParVoiture),
        injectionMensuelle: injection,
        prixVoiture: prixVoit,
        objectifVoitures: objectif
      },
      simulation,
      resume: {
        totalInjecte,
        moisFinInjection,
        moisObjectifAtteint,
        dureeEstimee: moisObjectifAtteint || simulation.length,
        voituresFinales: voitures
      }
    });
  } catch (error) {
    console.error('Erreur simulation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
