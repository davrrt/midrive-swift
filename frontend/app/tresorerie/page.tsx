"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  tresorerieAPI,
  TresorerieMois,
  Enveloppes,
  ChargesFixes,
} from "@/lib/api";
import { formatAriary } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  PiggyBank,
  AlertCircle,
  Download,
} from "lucide-react";

export default function TresoreriePage() {
  const [mensuel, setMensuel] = useState<TresorerieMois[]>([]);
  const [enveloppes, setEnveloppes] = useState<Enveloppes | null>(null);
  const [charges, setCharges] = useState<ChargesFixes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [mensuelData, enveloppesData, chargesData] = await Promise.all([
          tresorerieAPI.getMensuel(),
          tresorerieAPI.getEnveloppes(),
          tresorerieAPI.getChargesFixes(),
        ]);
        setMensuel(mensuelData);
        setEnveloppes(enveloppesData);
        setCharges(chargesData);
      } catch (error) {
        console.error("Erreur chargement trésorerie:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function handleExportCSV() {
    window.open(tresorerieAPI.exportCSV(), "_blank");
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
          <h1 className="text-2xl mobile:text-3xl font-bold">Trésorerie</h1>
          <p className="text-sm mobile:text-base text-muted-foreground">
            Suivi financier
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} className="w-full mobile:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Enveloppes */}
      <div className="grid gap-3 grid-cols-2 mobile:grid-cols-4">
        <Card className="border-info/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-info" />
              <span className="text-sm text-muted-foreground">
                Réserve pièces
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {formatAriary(enveloppes?.reservePieces || 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              Objectif: {formatAriary(enveloppes?.objectifReservePieces || 500000)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-success/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <span className="text-sm text-muted-foreground">
                Fonds croissance
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {formatAriary(enveloppes?.fondsCroissance || 0)}
            </p>
            <p className="text-xs text-muted-foreground">50% du bénéfice net</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Poche personnelle
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {formatAriary(enveloppes?.pochePersonnelle || 0)}
            </p>
            <p className="text-xs text-muted-foreground">Disponible</p>
          </CardContent>
        </Card>

        <Card className="border-warning/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              <span className="text-sm text-muted-foreground">Réserve IS</span>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {formatAriary(enveloppes?.reserveIS || 0)}
            </p>
            <p className="text-xs text-muted-foreground">20% mis de côté</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique mensuel */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution sur 12 mois</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mensuel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="label" stroke="#888" fontSize={12} />
                <YAxis
                  stroke="#888"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111",
                    border: "1px solid #222",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value: number) => formatAriary(value)}
                />
                <Legend />
                <Bar
                  dataKey="recettes"
                  name="Recettes"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="charges"
                  name="Charges"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="beneficeNet"
                  name="Bénéfice net"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tableau charges fixes */}
      <Card>
        <CardHeader>
          <CardTitle>Charges fixes mensuelles</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <tbody className="divide-y divide-border">
              <tr className="table-row-hover">
                <td className="py-3">Masse salariale chauffeurs</td>
                <td className="py-3 text-right font-medium">
                  {formatAriary(charges?.masseSalarialeChauffeurs || 0)}
                </td>
              </tr>
              <tr className="table-row-hover">
                <td className="py-3">Masse salariale employés</td>
                <td className="py-3 text-right font-medium">
                  {formatAriary(charges?.masseSalarialeEmployes || 0)}
                </td>
              </tr>
              <tr className="table-row-hover">
                <td className="py-3 font-medium">Total masse salariale</td>
                <td className="py-3 text-right font-bold">
                  {formatAriary(charges?.masseSalarialeTotal || 0)}
                </td>
              </tr>
              <tr className="table-row-hover">
                <td className="py-3">Charges patronales (CNaPS 13% + OSTIE 5%)</td>
                <td className="py-3 text-right font-medium">
                  {formatAriary(charges?.chargesCNaPSOSTIE || 0)}
                </td>
              </tr>
              <tr className="table-row-hover">
                <td className="py-3">Vidanges estimées</td>
                <td className="py-3 text-right font-medium">
                  {formatAriary(charges?.vidangesEstimees || 0)}
                </td>
              </tr>
              <tr className="table-row-hover">
                <td className="py-3">Pièces estimées</td>
                <td className="py-3 text-right font-medium">
                  {formatAriary(charges?.piecesEstimees || 0)}
                </td>
              </tr>
              <tr className="table-row-hover">
                <td className="py-3">Assurance mensuelle</td>
                <td className="py-3 text-right font-medium">
                  {formatAriary(charges?.assuranceMensuelle || 0)}
                </td>
              </tr>
              <tr className="table-row-hover">
                <td className="py-3">IRSA total</td>
                <td className="py-3 text-right font-medium">
                  {formatAriary(charges?.irsaTotal || 0)}
                </td>
              </tr>
              <tr className="border-t-2 border-border bg-secondary/20">
                <td className="py-4 text-lg font-bold">Total charges fixes</td>
                <td className="py-4 text-right text-lg font-bold">
                  {formatAriary(charges?.totalChargesFixes || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Historique mensuel */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par mois</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Mois</th>
                  <th className="pb-3 text-right font-medium">Recettes</th>
                  <th className="pb-3 text-right font-medium">Charges</th>
                  <th className="pb-3 text-right font-medium">Bénéfice net</th>
                </tr>
              </thead>
              <tbody>
                {mensuel.map((m) => (
                  <tr
                    key={m.mois}
                    className="table-row-hover border-b border-border text-sm"
                  >
                    <td className="py-3">{m.label}</td>
                    <td className="py-3 text-right text-success">
                      {formatAriary(m.recettes)}
                    </td>
                    <td className="py-3 text-right text-destructive">
                      {formatAriary(m.charges)}
                    </td>
                    <td
                      className={`py-3 text-right font-medium ${
                        m.beneficeNet >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {formatAriary(m.beneficeNet)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
