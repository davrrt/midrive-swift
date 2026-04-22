"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { chauffeursAPI, voituresAPI, ChauffeurStats, Voiture } from "@/lib/api";
import { formatAriary } from "@/lib/utils";
import { Plus, Users, TrendingUp, Car } from "lucide-react";

export default function ChauffeursPage() {
  const [chauffeurs, setChauffeurs] = useState<ChauffeurStats[]>([]);
  const [voitures, setVoitures] = useState<Voiture[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedChauffeur, setSelectedChauffeur] = useState<ChauffeurStats | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    salaire: "500000",
    dateDebut: new Date().toISOString().split("T")[0],
    voitureId: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [chauffeursData, voituresData] = await Promise.all([
        chauffeursAPI.getAll(),
        voituresAPI.getAll(),
      ]);
      setChauffeurs(chauffeursData);
      setVoitures(voituresData);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await chauffeursAPI.create({
        ...formData,
        salaire: Number(formData.salaire),
        voitureId: formData.voitureId && formData.voitureId !== "none" ? formData.voitureId : undefined,
      });
      setDialogOpen(false);
      setFormData({
        nom: "",
        prenom: "",
        telephone: "",
        salaire: "500000",
        dateDebut: new Date().toISOString().split("T")[0],
        voitureId: "",
      });
      fetchData();
    } catch (error) {
      console.error("Erreur création chauffeur:", error);
    }
  }

  async function handleAssign(voitureId: string) {
    if (!selectedChauffeur) return;
    try {
      await chauffeursAPI.assigner(
        selectedChauffeur.id,
        voitureId === "none" ? null : voitureId
      );
      setAssignDialogOpen(false);
      setSelectedChauffeur(null);
      fetchData();
    } catch (error) {
      console.error("Erreur assignation:", error);
    }
  }

  // Voitures disponibles (sans chauffeur assigné)
  const voituresDisponibles = voitures.filter(
    (v) => !v.chauffeur && v.statut === "active"
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mobile:space-y-8">
      {/* Header */}
      <div className="flex flex-col mobile:flex-row mobile:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl mobile:text-3xl font-bold">Chauffeurs</h1>
          <p className="text-sm mobile:text-base text-muted-foreground">
            Gestion et performances
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau chauffeur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un chauffeur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 mobile:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) =>
                      setFormData({ ...formData, prenom: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) =>
                      setFormData({ ...formData, telephone: e.target.value })
                    }
                    placeholder="034 12 345 67"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaire">Salaire (Ar)</Label>
                  <Input
                    id="salaire"
                    type="number"
                    value={formData.salaire}
                    onChange={(e) =>
                      setFormData({ ...formData, salaire: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateDebut">Date de début</Label>
                  <Input
                    id="dateDebut"
                    type="date"
                    value={formData.dateDebut}
                    onChange={(e) =>
                      setFormData({ ...formData, dateDebut: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voiture">Voiture (optionnel)</Label>
                  <Select
                    value={formData.voitureId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, voitureId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucune" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      {voituresDisponibles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.immatriculation} - {v.marque} {v.modele}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

      {/* Stats */}
      <div className="grid gap-3 grid-cols-1 mobile:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {chauffeurs.filter((c) => c.statut === "actif").length}
            </div>
            <p className="text-sm text-muted-foreground">Chauffeurs actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatAriary(
                Math.round(
                  chauffeurs.reduce((acc, c) => acc + c.moyenneVersement, 0) /
                    (chauffeurs.length || 1)
                )
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Moyenne versement/jour
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Math.round(
                chauffeurs.reduce((acc, c) => acc + c.tauxPonctualite, 0) /
                  (chauffeurs.length || 1)
              )}
              %
            </div>
            <p className="text-sm text-muted-foreground">
              Taux ponctualité moyen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des chauffeurs */}
      <div className="grid gap-3 mobile:gap-4 grid-cols-1 mobile:grid-cols-2 lg:grid-cols-3">
        {chauffeurs.map((chauffeur) => (
          <Card key={chauffeur.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {chauffeur.prenom} {chauffeur.nom}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {chauffeur.telephone}
                  </p>
                </div>
                <Badge
                  variant={
                    chauffeur.statut === "actif"
                      ? "success"
                      : chauffeur.statut === "conge"
                      ? "warning"
                      : "destructive"
                  }
                >
                  {chauffeur.statut === "actif"
                    ? "Actif"
                    : chauffeur.statut === "conge"
                    ? "Congé"
                    : "Licencié"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span>
                  {chauffeur.voiture
                    ? chauffeur.voiture.immatriculation
                    : "Pas de voiture"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 text-xs"
                  onClick={() => {
                    setSelectedChauffeur(chauffeur);
                    setAssignDialogOpen(true);
                  }}
                >
                  {chauffeur.voiture ? "Changer" : "Assigner"}
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Performance vs objectif
                  </span>
                  <span
                    className={
                      chauffeur.performanceVsObjectif >= 100
                        ? "text-success"
                        : chauffeur.performanceVsObjectif >= 80
                        ? "text-warning"
                        : "text-destructive"
                    }
                  >
                    {chauffeur.performanceVsObjectif}%
                  </span>
                </div>
                <Progress
                  value={Math.min(chauffeur.performanceVsObjectif, 100)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Moyenne/jour</p>
                  <p className="font-medium">
                    {formatAriary(chauffeur.moyenneVersement)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ponctualité</p>
                  <p className="font-medium">{chauffeur.tauxPonctualite}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total 30j</p>
                  <p className="font-medium">
                    {formatAriary(chauffeur.totalVersements30j)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nb versements</p>
                  <p className="font-medium">{chauffeur.nbVersements30j}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {chauffeurs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Aucun chauffeur</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un chauffeur
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog assignation voiture */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assigner une voiture à {selectedChauffeur?.prenom}{" "}
              {selectedChauffeur?.nom}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Voiture</Label>
              <Select onValueChange={handleAssign}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une voiture" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune (retirer l'assignation)</SelectItem>
                  {voituresDisponibles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.immatriculation} - {v.marque} {v.modele}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
