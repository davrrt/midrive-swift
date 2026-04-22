"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { voituresAPI, reparationsAPI, versementsAPI, chauffeursAPI, VoitureDetail, ChauffeurStats } from "@/lib/api";
import { formatAriary, formatDate } from "@/lib/utils";
import { ArrowLeft, Plus, Banknote, UserPlus } from "lucide-react";
import Link from "next/link";

export default function VoitureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [voiture, setVoiture] = useState<VoitureDetail | null>(null);
  const [chauffeurs, setChauffeurs] = useState<ChauffeurStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [reparationDialogOpen, setReparationDialogOpen] = useState(false);
  const [versementDialogOpen, setVersementDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedChauffeurId, setSelectedChauffeurId] = useState<string>("");
  const [reparationForm, setReparationForm] = useState({
    type: "petite",
    description: "",
    cout: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [versementForm, setVersementForm] = useState({
    montant: "80000",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const [voitureData, chauffeursData] = await Promise.all([
        voituresAPI.getById(id),
        chauffeursAPI.getAll(),
      ]);
      setVoiture(voitureData);
      setChauffeurs(chauffeursData);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchVoiture() {
    try {
      const data = await voituresAPI.getById(id);
      setVoiture(data);
    } catch (error) {
      console.error("Erreur chargement voiture:", error);
    }
  }

  async function handleAddReparation(e: React.FormEvent) {
    e.preventDefault();
    try {
      await reparationsAPI.create({
        ...reparationForm,
        cout: Number(reparationForm.cout),
        voitureId: id,
      });
      setReparationDialogOpen(false);
      setReparationForm({
        type: "petite",
        description: "",
        cout: "",
        date: new Date().toISOString().split("T")[0],
      });
      fetchVoiture();
    } catch (error) {
      console.error("Erreur ajout réparation:", error);
    }
  }

  async function handleStatutChange(statut: string) {
    try {
      await voituresAPI.update(id, { statut });
      fetchVoiture();
    } catch (error) {
      console.error("Erreur changement statut:", error);
    }
  }

  async function handleAssignChauffeur() {
    if (!selectedChauffeurId || selectedChauffeurId === "none") {
      // Retirer l'assignation
      if (voiture?.chauffeur) {
        try {
          await chauffeursAPI.assigner(voiture.chauffeur.id, null);
          setAssignDialogOpen(false);
          setSelectedChauffeurId("");
          fetchData();
        } catch (error) {
          console.error("Erreur retrait assignation:", error);
        }
      }
      return;
    }
    try {
      await chauffeursAPI.assigner(selectedChauffeurId, id);
      setAssignDialogOpen(false);
      setSelectedChauffeurId("");
      fetchData();
    } catch (error) {
      console.error("Erreur assignation chauffeur:", error);
    }
  }

  // Chauffeurs disponibles (sans voiture ou déjà sur cette voiture)
  const chauffeursDisponibles = chauffeurs.filter(
    (c) => c.statut === "actif" && (!c.voitureId || c.voitureId === id)
  );

  async function handleAddVersement(e: React.FormEvent) {
    e.preventDefault();
    if (!voiture?.chauffeur) {
      alert("Cette voiture n'a pas de chauffeur assigné");
      return;
    }
    try {
      await versementsAPI.create({
        montant: Number(versementForm.montant),
        voitureId: id,
        chauffeurId: voiture.chauffeur.id,
        date: versementForm.date,
      });
      setVersementDialogOpen(false);
      setVersementForm({
        montant: "80000",
        date: new Date().toISOString().split("T")[0],
      });
      fetchVoiture();
    } catch (error) {
      console.error("Erreur ajout versement:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!voiture) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Voiture non trouvée</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/flotte">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{voiture.immatriculation}</h1>
          <p className="text-muted-foreground">
            {voiture.marque} {voiture.modele} ({voiture.annee})
          </p>
        </div>
        <Select value={voiture.statut} onValueChange={handleStatutChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="panne">Panne</SelectItem>
            <SelectItem value="off">Off</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Chauffeur assigné</p>
            <p className="text-xl font-bold">
              {voiture.chauffeur
                ? `${voiture.chauffeur.prenom} ${voiture.chauffeur.nom}`
                : "Non assigné"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Kilométrage</p>
            <p className="text-xl font-bold">
              {voiture.kilometrage.toLocaleString()} km
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total dépenses</p>
            <p className="text-xl font-bold">
              {formatAriary(voiture.totalReparations)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total versements</p>
            <p className="text-xl font-bold text-success">
              {formatAriary(voiture.totalVersements)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="flex flex-wrap gap-4">
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button variant={voiture.chauffeur ? "outline" : "default"}>
              <UserPlus className="mr-2 h-4 w-4" />
              {voiture.chauffeur ? "Changer chauffeur" : "Assigner chauffeur"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assigner un chauffeur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Chauffeur actuel</Label>
                <p className="text-sm text-muted-foreground">
                  {voiture.chauffeur
                    ? `${voiture.chauffeur.prenom} ${voiture.chauffeur.nom}`
                    : "Aucun"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Nouveau chauffeur</Label>
                <Select
                  value={selectedChauffeurId}
                  onValueChange={setSelectedChauffeurId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un chauffeur" />
                  </SelectTrigger>
                  <SelectContent>
                    {voiture.chauffeur && (
                      <SelectItem value="none">Retirer l'assignation</SelectItem>
                    )}
                    {chauffeursDisponibles.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.prenom} {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DialogClose>
                <Button onClick={handleAssignChauffeur}>Assigner</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog
          open={versementDialogOpen}
          onOpenChange={setVersementDialogOpen}
        >
          <DialogTrigger asChild>
            <Button disabled={!voiture.chauffeur}>
              <Banknote className="mr-2 h-4 w-4" />
              Ajouter recette
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une recette quotidienne</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddVersement} className="space-y-4">
              <div className="space-y-2">
                <Label>Chauffeur</Label>
                <p className="text-sm text-muted-foreground">
                  {voiture.chauffeur
                    ? `${voiture.chauffeur.prenom} ${voiture.chauffeur.nom}`
                    : "Aucun chauffeur assigné"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="montant">Montant (Ar)</Label>
                  <Input
                    id="montant"
                    type="number"
                    value={versementForm.montant}
                    onChange={(e) =>
                      setVersementForm({
                        ...versementForm,
                        montant: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateVersement">Date</Label>
                  <Input
                    id="dateVersement"
                    type="date"
                    value={versementForm.date}
                    onChange={(e) =>
                      setVersementForm({
                        ...versementForm,
                        date: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DialogClose>
                <Button type="submit">Ajouter</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog
          open={reparationDialogOpen}
          onOpenChange={setReparationDialogOpen}
        >
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter dépense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une dépense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddReparation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={reparationForm.type}
                  onValueChange={(value) =>
                    setReparationForm({ ...reparationForm, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vidange">Vidange</SelectItem>
                    <SelectItem value="reparation">Réparation</SelectItem>
                    <SelectItem value="pneu">Pneu / Gonflage</SelectItem>
                    <SelectItem value="carburant">Carburant</SelectItem>
                    <SelectItem value="assurance">Assurance</SelectItem>
                    <SelectItem value="visite">Visite technique</SelectItem>
                    <SelectItem value="divers">Divers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={reparationForm.description}
                  onChange={(e) =>
                    setReparationForm({
                      ...reparationForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Changement plaquettes de frein"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cout">Coût (Ar)</Label>
                  <Input
                    id="cout"
                    type="number"
                    value={reparationForm.cout}
                    onChange={(e) =>
                      setReparationForm({
                        ...reparationForm,
                        cout: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={reparationForm.date}
                    onChange={(e) =>
                      setReparationForm({
                        ...reparationForm,
                        date: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DialogClose>
                <Button type="submit">Ajouter</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Historique */}
      <HistoriqueSection voiture={voiture} />
    </div>
  );
}

// Composant Historique avec filtres
function HistoriqueSection({ voiture }: { voiture: VoitureDetail }) {
  const [filter, setFilter] = useState<"tout" | "mois" | "precedent">("mois");
  const [tab, setTab] = useState<"tout" | "recettes" | "depenses">("tout");

  // Créer un historique combiné
  const historique = [
    ...voiture.versements.map((v) => ({
      id: v.id,
      date: v.date,
      type: "recette" as const,
      libelle: "Recette",
      description: v.chauffeur ? `${v.chauffeur.prenom} ${v.chauffeur.nom}` : "Chauffeur",
      montant: v.montant,
    })),
    ...voiture.reparations.map((r) => ({
      id: r.id,
      date: r.date,
      type: "depense" as const,
      libelle: getDepenseLabel(r.type),
      description: r.description,
      montant: -r.cout,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filtrer par période
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const filteredHistorique = historique.filter((item) => {
    const date = new Date(item.date);
    if (filter === "mois") return date >= startOfMonth;
    if (filter === "precedent") return date >= startOfLastMonth && date <= endOfLastMonth;
    return true;
  }).filter((item) => {
    if (tab === "recettes") return item.type === "recette";
    if (tab === "depenses") return item.type === "depense";
    return true;
  });

  // Calcul totaux
  const totalRecettes = filteredHistorique
    .filter((i) => i.type === "recette")
    .reduce((acc, i) => acc + i.montant, 0);
  const totalDepenses = filteredHistorique
    .filter((i) => i.type === "depense")
    .reduce((acc, i) => acc + Math.abs(i.montant), 0);
  const solde = totalRecettes - totalDepenses;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col mobile:flex-row mobile:items-center justify-between gap-4">
          <CardTitle className="text-lg">Historique</CardTitle>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={(v: "tout" | "mois" | "precedent") => setFilter(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mois">Ce mois</SelectItem>
                <SelectItem value="precedent">Mois précédent</SelectItem>
                <SelectItem value="tout">Tout</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Résumé */}
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Recettes</p>
            <p className="text-lg font-bold text-success">+{formatAriary(totalRecettes)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dépenses</p>
            <p className="text-lg font-bold text-destructive">-{formatAriary(totalDepenses)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Solde</p>
            <p className={`text-lg font-bold ${solde >= 0 ? "text-success" : "text-destructive"}`}>
              {solde >= 0 ? "+" : ""}{formatAriary(solde)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as "tout" | "recettes" | "depenses")}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="tout" className="flex-1">Tout</TabsTrigger>
            <TabsTrigger value="recettes" className="flex-1">Recettes</TabsTrigger>
            <TabsTrigger value="depenses" className="flex-1">Dépenses</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Liste */}
        <div className="space-y-2">
          {filteredHistorique.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={item.type === "recette" ? "success" : "secondary"} className="text-xs">
                    {item.libelle}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(item.date)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {item.description}
                </p>
              </div>
              <p className={`text-base font-bold whitespace-nowrap ml-4 ${
                item.type === "recette" ? "text-success" : "text-destructive"
              }`}>
                {item.type === "recette" ? "+" : ""}{formatAriary(item.montant)}
              </p>
            </div>
          ))}
          {filteredHistorique.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Aucune transaction
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getDepenseLabel(type: string): string {
  const labels: Record<string, string> = {
    vidange: "Vidange",
    reparation: "Réparation",
    pneu: "Pneu",
    carburant: "Carburant",
    assurance: "Assurance",
    visite: "Visite",
    divers: "Divers",
    petite: "Réparation",
    grosse: "Réparation",
  };
  return labels[type] || type;
}
