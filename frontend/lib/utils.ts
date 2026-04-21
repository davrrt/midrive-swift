import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formater un montant en Ariary
export function formatAriary(montant: number): string {
  return new Intl.NumberFormat("fr-MG", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant) + " Ar";
}

// Formater une date
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

// Formater une date relative
export function formatDateRelative(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
  return formatDate(date);
}

// Calculer le pourcentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Déterminer la couleur du statut
export function getStatusColor(statut: string): string {
  switch (statut.toLowerCase()) {
    case "ok":
    case "active":
    case "actif":
      return "bg-success text-white";
    case "partiel":
    case "maintenance":
    case "conge":
      return "bg-warning text-black";
    case "manquant":
    case "panne":
    case "licencie":
    case "inactif":
      return "bg-destructive text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// Déterminer la couleur du texte selon le statut
export function getStatusTextColor(statut: string): string {
  switch (statut.toLowerCase()) {
    case "ok":
    case "active":
    case "actif":
      return "text-success";
    case "partiel":
    case "maintenance":
    case "conge":
      return "text-warning";
    case "manquant":
    case "panne":
    case "licencie":
    case "inactif":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}
