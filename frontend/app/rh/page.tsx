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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  rhAPI,
  employesAPI,
  PaieData,
  RHStats,
  Employe,
  FichePaie,
  Bulletin,
} from "@/lib/api";
import { formatAriary } from "@/lib/utils";
import { Plus, Users, FileText, Download } from "lucide-react";

export default function RHPage() {
  const [paieData, setPaieData] = useState<PaieData | null>(null);
  const [stats, setStats] = useState<RHStats | null>(null);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulletinDialog, setBulletinDialog] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState<Bulletin | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    poste: "assistant",
    salaire: "400000",
    dateDebut: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [paieResult, statsResult, employesResult] = await Promise.all([
        rhAPI.getPaie(),
        rhAPI.getStatistiques(),
        employesAPI.getAll(),
      ]);
      setPaieData(paieResult);
      setStats(statsResult);
      setEmployes(employesResult);
    } catch (error) {
      console.error("Erreur chargement RH:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await employesAPI.create(formData);
      setDialogOpen(false);
      setFormData({
        nom: "",
        prenom: "",
        poste: "assistant",
        salaire: "400000",
        dateDebut: new Date().toISOString().split("T")[0],
      });
      fetchData();
    } catch (error) {
      console.error("Erreur création employé:", error);
    }
  }

  async function handleShowBulletin(fiche: FichePaie) {
    try {
      const bulletin = await rhAPI.getBulletin(
        fiche.id,
        fiche.type as "chauffeur" | "employe"
      );
      setSelectedBulletin(bulletin);
      setBulletinDialog(true);
    } catch (error) {
      console.error("Erreur chargement bulletin:", error);
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
          <h1 className="text-2xl mobile:text-3xl font-bold">RH & Paie</h1>
          <p className="text-sm mobile:text-base text-muted-foreground">
            {paieData?.mois}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel employé
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un employé</DialogTitle>
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
                  <Label htmlFor="poste">Poste</Label>
                  <Select
                    value={formData.poste}
                    onValueChange={(value) =>
                      setFormData({ ...formData, poste: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gestionnaire">Gestionnaire</SelectItem>
                      <SelectItem value="mecanicien">Mécanicien</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                      <SelectItem value="laveur">Laveur</SelectItem>
                    </SelectContent>
                  </Select>
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
                <div className="col-span-2 space-y-2">
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
            <div className="text-2xl font-bold">{stats?.effectifs.total || 0}</div>
            <p className="text-sm text-muted-foreground">Effectif total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {stats?.effectifs.chauffeursActifs || 0}
            </div>
            <p className="text-sm text-muted-foreground">Chauffeurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatAriary(stats?.masseSalariale.total || 0)}
            </div>
            <p className="text-sm text-muted-foreground">Masse salariale</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatAriary(stats?.masseSalariale.coutTotal || 0)}
            </div>
            <p className="text-sm text-muted-foreground">Coût total</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="paie">
        <TabsList>
          <TabsTrigger value="paie">Fiches de paie</TabsTrigger>
          <TabsTrigger value="employes">Employés</TabsTrigger>
        </TabsList>

        <TabsContent value="paie" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fiches de paie - {paieData?.mois}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Nom</th>
                      <th className="pb-3 font-medium">Poste</th>
                      <th className="pb-3 text-right font-medium">Brut</th>
                      <th className="pb-3 text-right font-medium">IRSA</th>
                      <th className="pb-3 text-right font-medium">CNaPS</th>
                      <th className="pb-3 text-right font-medium">Net</th>
                      <th className="pb-3 text-right font-medium">
                        Charges pat.
                      </th>
                      <th className="pb-3 text-right font-medium">Coût total</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paieData?.fiches.map((fiche) => (
                      <tr
                        key={fiche.id}
                        className="table-row-hover border-b border-border text-sm"
                      >
                        <td className="py-3">{fiche.nom}</td>
                        <td className="py-3">
                          <Badge variant="secondary">{fiche.poste}</Badge>
                        </td>
                        <td className="py-3 text-right">
                          {formatAriary(fiche.salaireBrut)}
                        </td>
                        <td className="py-3 text-right text-destructive">
                          -{formatAriary(fiche.irsa)}
                        </td>
                        <td className="py-3 text-right text-destructive">
                          -{formatAriary(fiche.cnapsSalarie)}
                        </td>
                        <td className="py-3 text-right font-medium text-success">
                          {formatAriary(fiche.salaireNet)}
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                          {formatAriary(fiche.chargesPatronales)}
                        </td>
                        <td className="py-3 text-right font-medium">
                          {formatAriary(fiche.coutTotal)}
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowBulletin(fiche)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-secondary/20 font-bold">
                      <td className="py-4">TOTAL</td>
                      <td className="py-4"></td>
                      <td className="py-4 text-right">
                        {formatAriary(paieData?.totaux.salaireBrut || 0)}
                      </td>
                      <td className="py-4 text-right text-destructive">
                        -{formatAriary(paieData?.totaux.irsa || 0)}
                      </td>
                      <td className="py-4 text-right text-destructive">
                        -{formatAriary(paieData?.totaux.cnapsSalarie || 0)}
                      </td>
                      <td className="py-4 text-right text-success">
                        {formatAriary(paieData?.totaux.salaireNet || 0)}
                      </td>
                      <td className="py-4 text-right text-muted-foreground">
                        {formatAriary(paieData?.totaux.chargesPatronales || 0)}
                      </td>
                      <td className="py-4 text-right">
                        {formatAriary(paieData?.totaux.coutTotal || 0)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Légende IRSA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Barème IRSA Madagascar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm md:grid-cols-5">
                <div className="rounded bg-secondary p-2">
                  <p className="font-medium">0%</p>
                  <p className="text-muted-foreground">≤ 350 000 Ar</p>
                </div>
                <div className="rounded bg-secondary p-2">
                  <p className="font-medium">5%</p>
                  <p className="text-muted-foreground">350 001 - 400 000 Ar</p>
                </div>
                <div className="rounded bg-secondary p-2">
                  <p className="font-medium">15%</p>
                  <p className="text-muted-foreground">400 001 - 500 000 Ar</p>
                </div>
                <div className="rounded bg-secondary p-2">
                  <p className="font-medium">20%</p>
                  <p className="text-muted-foreground">500 001 - 600 000 Ar</p>
                </div>
                <div className="rounded bg-secondary p-2">
                  <p className="font-medium">25%</p>
                  <p className="text-muted-foreground">&gt; 600 000 Ar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employes">
          <Card>
            <CardContent className="pt-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Nom</th>
                    <th className="pb-3 font-medium">Poste</th>
                    <th className="pb-3 text-right font-medium">Salaire</th>
                    <th className="pb-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {employes.map((e) => (
                    <tr
                      key={e.id}
                      className="table-row-hover border-b border-border text-sm"
                    >
                      <td className="py-3">
                        {e.prenom} {e.nom}
                      </td>
                      <td className="py-3 capitalize">{e.poste}</td>
                      <td className="py-3 text-right">
                        {formatAriary(e.salaire)}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={e.statut === "actif" ? "success" : "secondary"}
                        >
                          {e.statut === "actif" ? "Actif" : "Inactif"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {employes.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-muted-foreground"
                      >
                        Aucun employé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog bulletin de paie */}
      <Dialog open={bulletinDialog} onOpenChange={setBulletinDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulletin de paie</DialogTitle>
          </DialogHeader>
          {selectedBulletin && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-lg font-bold">{selectedBulletin.entreprise}</p>
                <p className="text-sm text-muted-foreground">
                  Période: {selectedBulletin.periode}
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-medium">{selectedBulletin.employe.nom}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedBulletin.employe.poste}
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-border p-4">
                <div className="flex justify-between">
                  <span>Salaire brut</span>
                  <span className="font-medium">
                    {formatAriary(selectedBulletin.salaireBrut)}
                  </span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>IRSA</span>
                  <span>-{formatAriary(selectedBulletin.retenues.irsa)}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>CNaPS salarié (1%)</span>
                  <span>
                    -{formatAriary(selectedBulletin.retenues.cnapsSalarie)}
                  </span>
                </div>
                <div className="border-t border-border pt-2">
                  <div className="flex justify-between font-bold text-success">
                    <span>Salaire net</span>
                    <span>{formatAriary(selectedBulletin.salaireNet)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="mb-2 font-medium">Charges patronales</p>
                <div className="flex justify-between">
                  <span>CNaPS (13%)</span>
                  <span>
                    {formatAriary(selectedBulletin.chargesPatronales.cnapsPatronal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>OSTIE (5%)</span>
                  <span>
                    {formatAriary(selectedBulletin.chargesPatronales.ostie)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t border-border pt-2 font-medium">
                  <span>Coût total employeur</span>
                  <span>{formatAriary(selectedBulletin.coutTotal)}</span>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Émis le {selectedBulletin.dateEmission}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
