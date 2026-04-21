// Utilitaires de calcul pour les règles métier Madagascar

/**
 * Calcul de l'IRSA (Impôt sur les Revenus Salariaux et Assimilés) Madagascar
 * Barème progressif par tranches
 */
export function calculerIRSA(salaireBrut: number): number {
  let irsa = 0;

  if (salaireBrut <= 350000) {
    // 0% jusqu'à 350 000 Ar
    irsa = 0;
  } else if (salaireBrut <= 400000) {
    // 5% de 350 001 à 400 000 Ar
    irsa = (salaireBrut - 350000) * 0.05;
  } else if (salaireBrut <= 500000) {
    // 5% sur la tranche 350 001 - 400 000
    // 15% sur la tranche 400 001 - 500 000
    irsa = (400000 - 350000) * 0.05 + (salaireBrut - 400000) * 0.15;
  } else if (salaireBrut <= 600000) {
    // Tranches précédentes + 20% sur 500 001 - 600 000
    irsa = (400000 - 350000) * 0.05 +
           (500000 - 400000) * 0.15 +
           (salaireBrut - 500000) * 0.20;
  } else {
    // Tranches précédentes + 25% au-delà de 600 000
    irsa = (400000 - 350000) * 0.05 +
           (500000 - 400000) * 0.15 +
           (600000 - 500000) * 0.20 +
           (salaireBrut - 600000) * 0.25;
  }

  return Math.round(irsa);
}

/**
 * Calcul des cotisations CNaPS salarié (1%)
 */
export function calculerCNaPSSalarie(salaireBrut: number): number {
  return Math.round(salaireBrut * 0.01);
}

/**
 * Calcul des charges patronales CNaPS (13%)
 */
export function calculerCNaPSPatronal(salaireBrut: number): number {
  return Math.round(salaireBrut * 0.13);
}

/**
 * Calcul des cotisations OSTIE patronales (5%)
 */
export function calculerOSTIE(salaireBrut: number): number {
  return Math.round(salaireBrut * 0.05);
}

/**
 * Calcul du salaire net
 */
export function calculerSalaireNet(salaireBrut: number): number {
  const irsa = calculerIRSA(salaireBrut);
  const cnapsSalarie = calculerCNaPSSalarie(salaireBrut);
  return salaireBrut - irsa - cnapsSalarie;
}

/**
 * Calcul des charges patronales totales (18% = CNaPS 13% + OSTIE 5%)
 */
export function calculerChargesPatronales(salaireBrut: number): number {
  return calculerCNaPSPatronal(salaireBrut) + calculerOSTIE(salaireBrut);
}

/**
 * Calcul de l'amortissement mensuel d'une voiture (sur 48 mois)
 */
export function calculerAmortissement(prixAchat: number): number {
  return Math.round(prixAchat / 48);
}

/**
 * Calcul de l'IS (Impôt sur les Sociétés) - 20% du bénéfice net annuel
 */
export function calculerIS(beneficeNetAnnuel: number): number {
  return Math.round(beneficeNetAnnuel * 0.20);
}

/**
 * Calcul du statut d'un versement
 */
export function getStatutVersement(montant: number, objectif: number): string {
  if (montant >= objectif) return 'ok';
  if (montant > 0) return 'partiel';
  return 'manquant';
}

/**
 * Calcul du nombre de jours depuis une date
 */
export function joursDepuis(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Vérifie si une vidange est en retard
 */
export function vidangeEnRetard(derniereVidange: Date | null, intervalle: number = 60): boolean {
  if (!derniereVidange) return true;
  return joursDepuis(derniereVidange) > intervalle;
}

/**
 * Formate un montant en Ariary
 */
export function formatAriary(montant: number): string {
  return new Intl.NumberFormat('fr-MG', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(montant) + ' Ar';
}
