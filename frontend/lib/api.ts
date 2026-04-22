// Configuration de l'API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Helper pour les requêtes fetch
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Erreur serveur" }));
    throw new Error(error.error || "Erreur lors de la requête");
  }

  return response.json();
}

// Dashboard
export const dashboardAPI = {
  getSummary: () => fetchAPI<DashboardSummary>("/dashboard/summary"),
  getVersementsJour: () => fetchAPI<Versement[]>("/dashboard/versements-jour"),
  getAlertes: () => fetchAPI<Alertes>("/dashboard/alertes"),
  getRecettes30j: () => fetchAPI<RecetteJour[]>("/dashboard/recettes-30j"),
};

// Voitures
export const voituresAPI = {
  getAll: () => fetchAPI<Voiture[]>("/voitures"),
  getById: (id: string) => fetchAPI<VoitureDetail>(`/voitures/${id}`),
  create: (data: Partial<Voiture>) =>
    fetchAPI<Voiture>("/voitures", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Voiture>) =>
    fetchAPI<Voiture>(`/voitures/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getHistorique: (id: string) => fetchAPI<VoitureHistorique>(`/voitures/${id}/historique`),
  enregistrerVidange: (id: string) =>
    fetchAPI<Voiture>(`/voitures/${id}/vidange`, { method: "PUT" }),
};

// Chauffeurs
export const chauffeursAPI = {
  getAll: () => fetchAPI<ChauffeurStats[]>("/chauffeurs"),
  getById: (id: string) => fetchAPI<ChauffeurDetail>(`/chauffeurs/${id}`),
  create: (data: Partial<Chauffeur>) =>
    fetchAPI<Chauffeur>("/chauffeurs", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Chauffeur>) =>
    fetchAPI<Chauffeur>(`/chauffeurs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  assigner: (id: string, voitureId: string | null) =>
    fetchAPI<Chauffeur>(`/chauffeurs/${id}/assigner`, {
      method: "PUT",
      body: JSON.stringify({ voitureId }),
    }),
  getVersements: (id: string, limit?: number) =>
    fetchAPI<Versement[]>(`/chauffeurs/${id}/versements?limit=${limit || 30}`),
};

// Versements
export const versementsAPI = {
  getAll: (params?: { limit?: number; voitureId?: string; chauffeurId?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.voitureId) query.set("voitureId", params.voitureId);
    if (params?.chauffeurId) query.set("chauffeurId", params.chauffeurId);
    return fetchAPI<Versement[]>(`/versements?${query.toString()}`);
  },
  create: (data: { montant: number; voitureId: string; chauffeurId: string; date?: string }) =>
    fetchAPI<Versement>("/versements", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Versement>) =>
    fetchAPI<Versement>(`/versements/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchAPI<{ message: string }>(`/versements/${id}`, { method: "DELETE" }),
};

// Réparations
export const reparationsAPI = {
  getAll: (params?: { limit?: number; voitureId?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.voitureId) query.set("voitureId", params.voitureId);
    if (params?.type) query.set("type", params.type);
    return fetchAPI<Reparation[]>(`/reparations?${query.toString()}`);
  },
  create: (data: Partial<Reparation>) =>
    fetchAPI<Reparation>("/reparations", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Reparation>) =>
    fetchAPI<Reparation>(`/reparations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchAPI<{ message: string }>(`/reparations/${id}`, { method: "DELETE" }),
};

// Trésorerie
export const tresorerieAPI = {
  getMensuel: () => fetchAPI<TresorerieMois[]>("/tresorerie/mensuel"),
  getEnveloppes: () => fetchAPI<Enveloppes>("/tresorerie/enveloppes"),
  getChargesFixes: () => fetchAPI<ChargesFixes>("/tresorerie/charges-fixes"),
  exportCSV: (mois?: string) => {
    const query = mois ? `?mois=${mois}` : "";
    return `${API_URL}/tresorerie/export-csv${query}`;
  },
};

// RH
export const rhAPI = {
  getPaie: () => fetchAPI<PaieData>("/rh/paie"),
  getBulletin: (id: string, type: "chauffeur" | "employe") =>
    fetchAPI<Bulletin>(`/rh/bulletin/${id}?type=${type}`),
  getStatistiques: () => fetchAPI<RHStats>("/rh/statistiques"),
};

// Employés
export const employesAPI = {
  getAll: (statut?: string) => {
    const query = statut ? `?statut=${statut}` : "";
    return fetchAPI<Employe[]>(`/employes${query}`);
  },
  getById: (id: string) => fetchAPI<Employe>(`/employes/${id}`),
  create: (data: Partial<Employe>) =>
    fetchAPI<Employe>("/employes", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Employe>) =>
    fetchAPI<Employe>(`/employes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchAPI<{ message: string }>(`/employes/${id}`, { method: "DELETE" }),
};

// Projection
export const projectionAPI = {
  get: () => fetchAPI<Projection>("/projection"),
  simuler: (params: ProjectionParams) =>
    fetchAPI<Projection>("/projection/simuler", {
      method: "POST",
      body: JSON.stringify(params),
    }),
};

// Config
export const configAPI = {
  get: () => fetchAPI<ConfigFlotte>("/config"),
  update: (data: Partial<ConfigFlotte>) =>
    fetchAPI<ConfigFlotte>("/config", { method: "PUT", body: JSON.stringify(data) }),
};

// Types
export interface DashboardSummary {
  recetteSemaine: number;
  recetteMois: number;
  beneficeNetMois: number;
  voituresActives: number;
  totalVoitures: number;
  objectifMensuel: number;
  progressionObjectif: number;
}

export interface Versement {
  id: string;
  montant: number;
  date: string;
  statut: string;
  voitureId: string;
  chauffeurId: string;
  voiture?: Voiture;
  chauffeur?: Chauffeur;
}

export interface Voiture {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  statut: string;
  dateAchat: string;
  prixAchat: number;
  kilometrage: number;
  derniereVidange: string | null;
  chauffeur?: Chauffeur;
  joursDepuisVidange?: number | null;
  amortissementMensuel?: number;
}

export interface VoitureDetail extends Voiture {
  versements: Versement[];
  reparations: Reparation[];
  totalReparations: number;
  totalVersements: number;
}

export interface VoitureHistorique {
  versements: Versement[];
  reparations: Reparation[];
}

export interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  statut: string;
  salaire: number;
  dateDebut: string;
  voitureId: string | null;
  voiture?: Voiture;
}

export interface ChauffeurStats extends Chauffeur {
  totalVersements30j: number;
  nbVersements30j: number;
  moyenneVersement: number;
  tauxPonctualite: number;
  performanceVsObjectif: number;
}

export interface ChauffeurDetail extends Chauffeur {
  versements: Versement[];
}

export interface Reparation {
  id: string;
  type: string;
  description: string;
  cout: number;
  date: string;
  voitureId: string;
  voiture?: Voiture;
}

export interface Alertes {
  vidangesRetard: {
    id: string;
    immatriculation: string;
    marque: string;
    modele: string;
    derniereVidange: string | null;
    chauffeur: string | null;
  }[];
  chauffeursSansVersement: {
    id: string;
    nom: string;
    voiture: string | null;
  }[];
}

export interface RecetteJour {
  date: string;
  montant: number;
}

export interface TresorerieMois {
  mois: string;
  label: string;
  recettes: number;
  charges: number;
  beneficeNet: number;
  details: {
    masseSalariale: number;
    chargesPatronales: number;
    reparations: number;
    assurance: number;
  };
}

export interface Enveloppes {
  mois: string;
  reservePieces: number;
  fondsCroissance: number;
  pochePersonnelle: number;
  reserveIS: number;
  objectifReservePieces: number;
}

export interface ChargesFixes {
  masseSalarialeChauffeurs: number;
  masseSalarialeEmployes: number;
  masseSalarialeTotal: number;
  chargesCNaPSOSTIE: number;
  vidangesEstimees: number;
  piecesEstimees: number;
  assuranceMensuelle: number;
  irsaTotal: number;
  totalChargesFixes: number;
}

export interface PaieData {
  fiches: FichePaie[];
  totaux: {
    salaireBrut: number;
    irsa: number;
    cnapsSalarie: number;
    salaireNet: number;
    cnapsPatronal: number;
    ostie: number;
    chargesPatronales: number;
    coutTotal: number;
  };
  nombrePersonnes: number;
  mois: string;
}

export interface FichePaie {
  id: string;
  type: string;
  nom: string;
  poste: string;
  voiture: string | null;
  salaireBrut: number;
  irsa: number;
  cnapsSalarie: number;
  salaireNet: number;
  cnapsPatronal: number;
  ostie: number;
  chargesPatronales: number;
  coutTotal: number;
}

export interface Bulletin {
  entreprise: string;
  periode: string;
  dateEmission: string;
  employe: {
    nom: string;
    poste: string;
    dateDebut: string;
  };
  salaireBrut: number;
  retenues: {
    irsa: number;
    cnapsSalarie: number;
    totalRetenues: number;
  };
  salaireNet: number;
  chargesPatronales: {
    cnapsPatronal: number;
    ostie: number;
    totalCharges: number;
  };
  coutTotal: number;
}

export interface RHStats {
  effectifs: {
    chauffeursActifs: number;
    chauffeursInactifs: number;
    employesActifs: number;
    total: number;
  };
  masseSalariale: {
    chauffeurs: number;
    employes: number;
    total: number;
    chargesPatronales: number;
    coutTotal: number;
  };
}

export interface Employe {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  salaire: number;
  dateDebut: string;
  statut: string;
}

export interface Projection {
  parametres: {
    voituresActuelles: number;
    beneficeParVoiture: number;
    injectionMensuelle: number;
    prixVoiture: number;
    objectifVoitures: number;
  };
  simulation: SimulationMois[];
  resume: {
    totalInjecte: number;
    moisFinInjection: number | null;
    moisObjectifAtteint: number | null;
    dureeEstimee: number;
    voituresFinales: number;
  };
}

export interface SimulationMois {
  mois: number;
  date: string;
  nbVoitures: number;
  recetteBrute: number;
  beneficeNet: number;
  injection: number;
  fondsCroissance: number;
  fondsCumule: number;
  action: string;
  injectionActive: boolean;
}

export interface ProjectionParams {
  nbVoituresActuel: number;
  beneficeNetActuel: number;
  injectionMensuelle: number;
  prixVoiture: number;
  objectifVoitures: number;
}

export interface ConfigFlotte {
  id: string;
  versementJournalier: number;
  joursExploitation: number;
  coutVidange: number;
  intervalleVidange: number;
  coutPiecesEstime: number;
  assuranceAnnuelle: number;
  objectifVoitures: number;
  prixVoiture: number;
  injectionMensuelle: number;
}
