import { PrismaClient } from '@prisma/client';
import { subDays, subMonths, addDays } from 'date-fns';

const prisma = new PrismaClient();

// Fonction pour générer un statut de versement aléatoire
function getRandomStatut(): string {
  const rand = Math.random();
  if (rand < 0.75) return 'ok';
  if (rand < 0.90) return 'partiel';
  return 'manquant';
}

// Fonction pour générer un montant selon le statut
function getMontantVersement(statut: string, objectif: number): number {
  switch (statut) {
    case 'ok':
      return objectif + Math.floor(Math.random() * 10000);
    case 'partiel':
      return Math.floor(objectif * (0.5 + Math.random() * 0.3));
    case 'manquant':
      return 0;
    default:
      return objectif;
  }
}

async function main() {
  console.log('🌱 Début du seeding...');

  // Nettoyer la base de données
  await prisma.versement.deleteMany();
  await prisma.reparation.deleteMany();
  await prisma.chauffeur.deleteMany();
  await prisma.voiture.deleteMany();
  await prisma.employe.deleteMany();
  await prisma.enveloppe.deleteMany();
  await prisma.configFlotte.deleteMany();

  console.log('🗑️  Base de données nettoyée');

  // Créer la configuration
  const config = await prisma.configFlotte.create({
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

  console.log('⚙️  Configuration créée');

  // Créer les voitures Toyota
  const voituresData = [
    { immatriculation: '1234 TAA', marque: 'Toyota', modele: 'Corolla', annee: 2020 },
    { immatriculation: '2345 TAB', marque: 'Toyota', modele: 'Yaris', annee: 2021 },
    { immatriculation: '3456 TAC', marque: 'Toyota', modele: 'Corolla', annee: 2019 },
    { immatriculation: '4567 TAD', marque: 'Toyota', modele: 'Vitz', annee: 2020 },
    { immatriculation: '5678 TAE', marque: 'Toyota', modele: 'Corolla', annee: 2022 }
  ];

  const voitures = [];
  for (const v of voituresData) {
    const dateAchat = subMonths(new Date(), Math.floor(Math.random() * 12) + 6);
    const voiture = await prisma.voiture.create({
      data: {
        ...v,
        statut: 'active',
        dateAchat,
        prixAchat: 12000000,
        kilometrage: Math.floor(Math.random() * 50000) + 20000,
        derniereVidange: subDays(new Date(), Math.floor(Math.random() * 70))
      }
    });
    voitures.push(voiture);
  }

  console.log(`🚗 ${voitures.length} voitures créées`);

  // Créer les chauffeurs
  const chauffeursData = [
    { nom: 'RAKOTO', prenom: 'Jean', telephone: '034 12 345 67' },
    { nom: 'RANDRIA', prenom: 'Paul', telephone: '034 23 456 78' },
    { nom: 'RASOA', prenom: 'Pierre', telephone: '034 34 567 89' },
    { nom: 'RABE', prenom: 'Marc', telephone: '034 45 678 90' },
    { nom: 'RAZAFY', prenom: 'Luc', telephone: '034 56 789 01' }
  ];

  const chauffeurs = [];
  for (let i = 0; i < chauffeursData.length; i++) {
    const chauffeur = await prisma.chauffeur.create({
      data: {
        ...chauffeursData[i],
        statut: 'actif',
        salaire: 500000,
        dateDebut: subMonths(new Date(), Math.floor(Math.random() * 12) + 3),
        voitureId: voitures[i].id
      }
    });
    chauffeurs.push(chauffeur);
  }

  console.log(`👤 ${chauffeurs.length} chauffeurs créés`);

  // Créer les employés
  const employesData = [
    { nom: 'ANDRIA', prenom: 'Marie', poste: 'gestionnaire', salaire: 800000 },
    { nom: 'RATSIMA', prenom: 'Solo', poste: 'mecanicien', salaire: 600000 },
    { nom: 'RAHAJA', prenom: 'Faly', poste: 'laveur', salaire: 350000 }
  ];

  for (const e of employesData) {
    await prisma.employe.create({
      data: {
        ...e,
        statut: 'actif',
        dateDebut: subMonths(new Date(), Math.floor(Math.random() * 18) + 6)
      }
    });
  }

  console.log(`👥 ${employesData.length} employés créés`);

  // Créer les versements pour les 3 derniers mois
  let versementsCount = 0;
  const objectifJournalier = 80000;

  for (let mois = 2; mois >= 0; mois--) {
    const debutMois = subMonths(new Date(), mois);

    // 26 jours d'exploitation par mois (lundi-samedi)
    for (let jour = 0; jour < 26; jour++) {
      const dateVersement = addDays(debutMois, jour);

      // Versement pour chaque chauffeur
      for (let i = 0; i < chauffeurs.length; i++) {
        const statut = getRandomStatut();
        const montant = getMontantVersement(statut, objectifJournalier);

        if (montant > 0 || statut === 'manquant') {
          await prisma.versement.create({
            data: {
              montant,
              date: dateVersement,
              statut,
              voitureId: voitures[i].id,
              chauffeurId: chauffeurs[i].id
            }
          });
          versementsCount++;
        }
      }
    }
  }

  console.log(`💰 ${versementsCount} versements créés`);

  // Créer quelques réparations
  const reparationsData = [
    { type: 'vidange', description: 'Vidange périodique', cout: 250000 },
    { type: 'petite', description: 'Changement plaquettes de frein', cout: 150000 },
    { type: 'petite', description: 'Remplacement pneus avant', cout: 200000 },
    { type: 'grosse', description: 'Réparation boîte de vitesses', cout: 800000 },
    { type: 'vidange', description: 'Vidange périodique', cout: 250000 },
    { type: 'petite', description: 'Changement batterie', cout: 180000 }
  ];

  for (let i = 0; i < reparationsData.length; i++) {
    await prisma.reparation.create({
      data: {
        ...reparationsData[i],
        date: subDays(new Date(), Math.floor(Math.random() * 60)),
        voitureId: voitures[i % voitures.length].id
      }
    });
  }

  console.log(`🔧 ${reparationsData.length} réparations créées`);

  console.log('✅ Seeding terminé avec succès !');
  console.log('');
  console.log('📊 Résumé:');
  console.log(`   - ${voitures.length} voitures`);
  console.log(`   - ${chauffeurs.length} chauffeurs`);
  console.log(`   - ${employesData.length} employés`);
  console.log(`   - ${versementsCount} versements (3 mois)`);
  console.log(`   - ${reparationsData.length} réparations`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
