# VTC Madagascar - Dashboard de Gestion de Flotte

Dashboard complet de gestion de flotte de taxis/VTC pour Madagascar avec suivi des versements, gestion des chauffeurs, trésorerie et simulation de croissance.

## Stack Technique

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Base de données**: PostgreSQL + Prisma ORM
- **Charts**: Recharts
- **Style**: Dark theme inspiré Vercel

## Prérequis

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

## Installation

### 1. Cloner le projet

```bash
cd fleet-dashboard
```

### 2. Configuration du Backend

```bash
cd backend

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env
```

Modifier le fichier `.env` avec vos paramètres :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fleet_dashboard?schema=public"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### 3. Configuration de la Base de Données

```bash
# Générer le client Prisma
npm run db:generate

# Créer les tables
npm run db:push

# Peupler avec les données de démo
npm run db:seed
```

### 4. Configuration du Frontend

```bash
cd ../frontend

# Installer les dépendances
npm install

# Créer le fichier .env.local
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001/api' > .env.local
```

## Démarrage

### Lancer le Backend

```bash
cd backend
npm run dev
```

Le serveur API démarre sur http://localhost:3001

### Lancer le Frontend

```bash
cd frontend
npm run dev
```

L'application démarre sur http://localhost:3000

## Fonctionnalités

### Dashboard
- KPIs du jour et du mois (recettes, bénéfice net, voitures actives)
- Barre de progression vers l'objectif mensuel
- Alertes vidanges et versements manquants
- Graphique des recettes sur 30 jours
- Tableau des versements du jour

### Flotte
- Liste des voitures avec statut et chauffeur assigné
- Détail par voiture (historique versements et réparations)
- Ajout de nouvelles voitures
- Enregistrement des vidanges et réparations
- Calcul automatique de l'amortissement

### Chauffeurs
- Liste des chauffeurs avec statistiques de performance
- Taux de ponctualité et moyenne de versement
- Assignation de voiture
- Historique des versements par chauffeur

### Trésorerie
- 4 enveloppes financières (réserve pièces, fonds croissance, poche perso, réserve IS)
- Graphique évolution mensuelle sur 12 mois
- Détail des charges fixes mensuelles
- Export CSV des versements

### RH & Paie
- Fiches de paie automatiques pour tous les employés
- Calcul IRSA par tranches progressives (barème Madagascar)
- Charges patronales CNaPS 13% + OSTIE 5%
- Bulletin de paie détaillé par employé
- Ajout d'employés (gestionnaire, mécanicien, laveur, etc.)

### Projection
- Simulateur de croissance de flotte
- Paramètres configurables (injection mensuelle, prix voiture, objectif)
- Tableau mois par mois avec achats de voitures
- Graphique évolution du bénéfice net
- Date estimée d'atteinte de l'objectif

## Règles Métier

- Versement journalier minimum: 80 000 Ar
- Exploitation: Lundi au Samedi (26 jours/mois)
- Vidange: Toutes les 60 jours
- IRSA: Barème progressif Madagascar (0%, 5%, 15%, 20%, 25%)
- Charges patronales: CNaPS 13% + OSTIE 5% = 18%
- Amortissement voiture: 48 mois
- Fonds croissance: 50% du bénéfice net
- Réserve IS: 20% du bénéfice net

## Données de Démonstration

Le script de seed crée :
- 5 voitures Toyota avec chauffeurs assignés
- 3 mois d'historique de versements
- 3 employés (gestionnaire, mécanicien, laveur)
- Quelques réparations passées
- Configuration flotte avec valeurs réelles Madagascar

## Structure du Projet

```
fleet-dashboard/
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── flotte/
│   │   ├── chauffeurs/
│   │   ├── tresorerie/
│   │   ├── rh/
│   │   └── projection/
│   ├── components/
│   │   └── ui/
│   └── lib/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── lib/
│   │   └── utils/
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
└── README.md
```

## API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/dashboard/summary | KPIs du jour et du mois |
| GET | /api/dashboard/versements-jour | Versements du jour |
| GET | /api/dashboard/alertes | Alertes vidanges et versements |
| GET | /api/dashboard/recettes-30j | Recettes 30 derniers jours |
| GET | /api/voitures | Liste des voitures |
| POST | /api/voitures | Ajouter une voiture |
| GET | /api/voitures/:id | Détail d'une voiture |
| PUT | /api/voitures/:id | Modifier une voiture |
| GET | /api/chauffeurs | Liste des chauffeurs |
| POST | /api/chauffeurs | Ajouter un chauffeur |
| PUT | /api/chauffeurs/:id/assigner | Assigner une voiture |
| POST | /api/versements | Saisir un versement |
| POST | /api/reparations | Ajouter une réparation |
| GET | /api/tresorerie/mensuel | Données financières mensuelles |
| GET | /api/tresorerie/enveloppes | État des enveloppes |
| GET | /api/rh/paie | Calcul paie tous employés |
| GET | /api/projection | Simulation croissance |
| GET | /api/config | Configuration flotte |
| PUT | /api/config | Modifier configuration |

## Personnalisation

### Modifier la configuration par défaut

Modifiez les valeurs dans `backend/prisma/seed.ts` ou via l'API `/api/config` :

- `versementJournalier`: 80 000 Ar
- `joursExploitation`: 26
- `coutVidange`: 250 000 Ar
- `intervalleVidange`: 60 jours
- `assuranceAnnuelle`: 100 000 Ar
- `prixVoiture`: 12 000 000 Ar
- `injectionMensuelle`: 4 000 000 Ar
- `objectifVoitures`: 15

## Licence

MIT
