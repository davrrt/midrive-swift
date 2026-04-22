"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { voituresAPI, Voiture } from "@/lib/api";
import { formatAriary } from "@/lib/utils";
import { Plus, Car, Eye, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function FlottePage() {
  const [voitures, setVoitures] = useState<Voiture[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    immatriculation: "",
    marque: "",
    modele: "",
    annee: new Date().getFullYear().toString(),
    dateAchat: new Date().toISOString().split("T")[0],
    prixAchat: "12000000",
    kilometrage: "0",
  });

  useEffect(() => {
    fetchVoitures();
  }, []);

  async function fetchVoitures() {
    try {
      const data = await voituresAPI.getAll();
      setVoitures(data);
    } catch (error) {
      console.error("Erreur chargement voitures:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await voituresAPI.create({
        ...formData,
        annee: Number(formData.annee),
        prixAchat: Number(formData.prixAchat),
        kilometrage: Number(formData.kilometrage),
      });
      setDialogOpen(false);
      setFormData({
        immatriculation: "",
        marque: "",
        modele: "",
        annee: new Date().getFullYear().toString(),
        dateAchat: new Date().toISOString().split("T")[0],
        prixAchat: "12000000",
        kilometrage: "0",
      });
      fetchVoitures();
    } catch (error) {
      console.error("Erreur création voiture:", error);
    }
  }

  function getStatutBadgeVariant(statut: string) {
    switch (statut) {
      case "active":
        return "success";
      case "maintenance":
        return "warning";
      case "panne":
        return "destructive";
      case "off":
        return "secondary";
      default:
        return "secondary";
    }
  }

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
          <h1 className="text-2xl mobile:text-3xl font-bold">Flotte</h1>
          <p className="text-sm mobile:text-base text-muted-foreground">
            Gestion des véhicules
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle voiture
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une voiture</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 mobile:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="immatriculation">Immatriculation</Label>
                  <Input
                    id="immatriculation"
                    value={formData.immatriculation}
                    onChange={(e) =>
                      setFormData({ ...formData, immatriculation: e.target.value })
                    }
                    placeholder="1234 TAA"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marque">Marque</Label>
                  <Input
                    id="marque"
                    value={formData.marque}
                    onChange={(e) =>
                      setFormData({ ...formData, marque: e.target.value })
                    }
                    placeholder="Toyota, Nissan, etc."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modele">Modèle</Label>
                  <Input
                    id="modele"
                    value={formData.modele}
                    onChange={(e) =>
                      setFormData({ ...formData, modele: e.target.value })
                    }
                    placeholder="Corolla"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annee">Année</Label>
                  <Input
                    id="annee"
                    type="number"
                    value={formData.annee}
                    onChange={(e) =>
                      setFormData({ ...formData, annee: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateAchat">Date d'achat</Label>
                  <Input
                    id="dateAchat"
                    type="date"
                    value={formData.dateAchat}
                    onChange={(e) =>
                      setFormData({ ...formData, dateAchat: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prixAchat">Prix d'achat (Ar)</Label>
                  <Input
                    id="prixAchat"
                    type="number"
                    value={formData.prixAchat}
                    onChange={(e) =>
                      setFormData({ ...formData, prixAchat: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mobile:col-span-2 space-y-2">
                  <Label htmlFor="kilometrage">Kilométrage</Label>
                  <Input
                    id="kilometrage"
                    type="number"
                    value={formData.kilometrage}
                    onChange={(e) =>
                      setFormData({ ...formData, kilometrage: e.target.value })
                    }
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

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 mobile:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {voitures.filter((v) => v.statut === "active").length}
            </div>
            <p className="text-sm text-muted-foreground">Actives</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">
              {voitures.filter((v) => v.statut === "maintenance").length}
            </div>
            <p className="text-sm text-muted-foreground">En maintenance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">
              {voitures.filter((v) => v.statut === "panne").length}
            </div>
            <p className="text-sm text-muted-foreground">En panne</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-muted-foreground">
              {voitures.filter((v) => v.statut === "off").length}
            </div>
            <p className="text-sm text-muted-foreground">Off</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des voitures */}
      <div className="grid gap-3 mobile:gap-4 grid-cols-1 mobile:grid-cols-2 lg:grid-cols-3">
        {voitures.map((voiture) => (
          <Card key={voiture.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {voiture.immatriculation}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {voiture.marque} {voiture.modele} ({voiture.annee})
                  </p>
                </div>
                <Badge variant={getStatutBadgeVariant(voiture.statut)}>
                  {voiture.statut === "active"
                    ? "Active"
                    : voiture.statut === "maintenance"
                    ? "Maintenance"
                    : voiture.statut === "panne"
                    ? "Panne"
                    : "Off"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Chauffeur</p>
                  <p className="font-medium">
                    {voiture.chauffeur
                      ? `${voiture.chauffeur.prenom} ${voiture.chauffeur.nom}`
                      : "Non assigné"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kilométrage</p>
                  <p className="font-medium">
                    {voiture.kilometrage.toLocaleString()} km
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dernière vidange</p>
                  <p
                    className={`font-medium ${
                      voiture.joursDepuisVidange &&
                      voiture.joursDepuisVidange > 60
                        ? "text-warning"
                        : ""
                    }`}
                  >
                    {voiture.derniereVidange
                      ? `${voiture.joursDepuisVidange} jours`
                      : "Jamais"}
                    {voiture.joursDepuisVidange &&
                      voiture.joursDepuisVidange > 60 && (
                        <AlertTriangle className="ml-1 inline h-4 w-4" />
                      )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amortissement</p>
                  <p className="font-medium">
                    {formatAriary(voiture.amortissementMensuel || 0)}/mois
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/flotte/${voiture.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Eye className="mr-2 h-4 w-4" />
                    Détails
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {voitures.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Aucune voiture dans la flotte</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une voiture
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
