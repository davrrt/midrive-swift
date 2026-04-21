"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { projectionAPI, Projection } from "@/lib/api";
import { formatAriary } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calculator, TrendingUp, Car, Target, DollarSign } from "lucide-react";

export default function ProjectionPage() {
  const [projection, setProjection] = useState<Projection | null>(null);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({
    nbVoituresActuel: "5",
    beneficeNetActuel: "",
    injectionMensuelle: "4000000",
    prixVoiture: "12000000",
    objectifVoitures: "15",
  });

  useEffect(() => {
    fetchProjection();
  }, []);

  async function fetchProjection() {
    try {
      const data = await projectionAPI.get();
      setProjection(data);
      setParams({
        nbVoituresActuel: data.parametres.voituresActuelles.toString(),
        beneficeNetActuel: "",
        injectionMensuelle: data.parametres.injectionMensuelle.toString(),
        prixVoiture: data.parametres.prixVoiture.toString(),
        objectifVoitures: data.parametres.objectifVoitures.toString(),
      });
    } catch (error) {
      console.error("Erreur chargement projection:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulate() {
    try {
      setLoading(true);
      const data = await projectionAPI.simuler({
        nbVoituresActuel: parseInt(params.nbVoituresActuel),
        beneficeNetActuel: parseFloat(params.beneficeNetActuel) || 0,
        injectionMensuelle: parseFloat(params.injectionMensuelle),
        prixVoiture: parseFloat(params.prixVoiture),
        objectifVoitures: parseInt(params.objectifVoitures),
      });
      setProjection(data);
    } catch (error) {
      console.error("Erreur simulation:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !projection) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mobile:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl mobile:text-3xl font-bold">Projection</h1>
        <p className="text-sm mobile:text-base text-muted-foreground">
          Simulateur d'expansion
        </p>
      </div>

      {/* Paramètres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Paramètres de simulation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 mobile:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="nbVoitures">Voitures actuelles</Label>
              <Input
                id="nbVoitures"
                type="number"
                value={params.nbVoituresActuel}
                onChange={(e) =>
                  setParams({ ...params, nbVoituresActuel: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="injection">Injection mensuelle (Ar)</Label>
              <Input
                id="injection"
                type="number"
                value={params.injectionMensuelle}
                onChange={(e) =>
                  setParams({ ...params, injectionMensuelle: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prixVoiture">Prix voiture (Ar)</Label>
              <Input
                id="prixVoiture"
                type="number"
                value={params.prixVoiture}
                onChange={(e) =>
                  setParams({ ...params, prixVoiture: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="objectif">Objectif voitures</Label>
              <Input
                id="objectif"
                type="number"
                value={params.objectifVoitures}
                onChange={(e) =>
                  setParams({ ...params, objectifVoitures: e.target.value })
                }
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSimulate} className="w-full">
                Simuler
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résumé */}
      {projection && (
        <>
          <div className="grid gap-3 grid-cols-2 mobile:grid-cols-4">
            <Card className="border-success/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-success" />
                  <span className="text-sm text-muted-foreground">
                    Objectif atteint
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {projection.resume.moisObjectifAtteint
                    ? `Mois ${projection.resume.moisObjectifAtteint}`
                    : "Non atteint"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {projection.resume.voituresFinales} voitures finales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Total injecté
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {formatAriary(projection.resume.totalInjecte)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Fin injection
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {projection.resume.moisFinInjection
                    ? `Mois ${projection.resume.moisFinInjection}`
                    : "Continue"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Autonomie de croissance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Bénéfice/voiture
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {formatAriary(projection.parametres.beneficeParVoiture)}
                </p>
                <p className="text-sm text-muted-foreground">par mois</p>
              </CardContent>
            </Card>
          </div>

          {/* Graphique évolution */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution du bénéfice net</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projection.simulation}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="date" stroke="#888" fontSize={12} />
                    <YAxis
                      stroke="#888"
                      fontSize={12}
                      tickFormatter={(value) =>
                        `${(value / 1000000).toFixed(1)}M`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111",
                        border: "1px solid #222",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                      formatter={(value: number, name: string) => [
                        formatAriary(value),
                        name === "beneficeNet"
                          ? "Bénéfice net"
                          : name === "fondsCumule"
                          ? "Fonds cumulé"
                          : name,
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="beneficeNet"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="fondsCumule"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tableau détaillé */}
          <Card>
            <CardHeader>
              <CardTitle>Projection mois par mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Mois</th>
                      <th className="pb-3 text-center font-medium">Voitures</th>
                      <th className="pb-3 text-right font-medium">Recette brute</th>
                      <th className="pb-3 text-right font-medium">Bénéfice net</th>
                      <th className="pb-3 text-right font-medium">Injection</th>
                      <th className="pb-3 text-right font-medium">Fonds cumulé</th>
                      <th className="pb-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projection.simulation.map((mois) => (
                      <tr
                        key={mois.mois}
                        className={`table-row-hover border-b border-border text-sm ${
                          mois.action !== "-" ? "bg-success/5" : ""
                        }`}
                      >
                        <td className="py-3">{mois.date}</td>
                        <td className="py-3 text-center">
                          <Badge variant="secondary">{mois.nbVoitures}</Badge>
                        </td>
                        <td className="py-3 text-right">
                          {formatAriary(mois.recetteBrute)}
                        </td>
                        <td className="py-3 text-right text-success">
                          {formatAriary(mois.beneficeNet)}
                        </td>
                        <td className="py-3 text-right">
                          {mois.injectionActive ? (
                            formatAriary(mois.injection)
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 text-right font-medium">
                          {formatAriary(mois.fondsCumule)}
                        </td>
                        <td className="py-3">
                          {mois.action !== "-" && (
                            <Badge variant="success">{mois.action}</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
