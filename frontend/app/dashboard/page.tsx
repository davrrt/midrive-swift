"use client";

import { useEffect, useState } from "react";
import { KPICard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  dashboardAPI,
  DashboardSummary,
  Versement,
  Alertes,
  RecetteJour,
} from "@/lib/api";
import { formatAriary, formatAriaryCompact, formatDate, getStatusColor } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  Car,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { TableMobileCard } from "@/components/table-mobile-card";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [versementsJour, setVersementsJour] = useState<Versement[]>([]);
  const [alertes, setAlertes] = useState<Alertes | null>(null);
  const [recettes30j, setRecettes30j] = useState<RecetteJour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryData, versementsData, alertesData, recettesData] =
          await Promise.all([
            dashboardAPI.getSummary(),
            dashboardAPI.getVersementsJour(),
            dashboardAPI.getAlertes(),
            dashboardAPI.getRecettes30j(),
          ]);

        setSummary(summaryData);
        setVersementsJour(versementsData);
        setAlertes(alertesData);
        setRecettes30j(recettesData);
      } catch (error) {
        console.error("Erreur chargement dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const hasAlertes =
    alertes &&
    (alertes.vidangesRetard.length > 0 ||
      alertes.chauffeursSansVersement.length > 0);

  return (
    <div className="space-y-4 mobile:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl mobile:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm mobile:text-base text-muted-foreground">
          Vue d'ensemble de votre flotte VTC
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 mobile:grid-cols-4">
        <KPICard
          title="Recette jour"
          value={formatAriary(summary?.recetteJour || 0)}
          compactValue={formatAriaryCompact(summary?.recetteJour || 0)}
          icon={Wallet}
        />
        <KPICard
          title="Recette mois"
          value={formatAriary(summary?.recetteMois || 0)}
          compactValue={formatAriaryCompact(summary?.recetteMois || 0)}
          icon={Calendar}
        />
        <KPICard
          title="Bénéfice net"
          value={formatAriary(summary?.beneficeNetMois || 0)}
          compactValue={formatAriaryCompact(summary?.beneficeNetMois || 0)}
          icon={TrendingUp}
          className={
            (summary?.beneficeNetMois || 0) >= 0
              ? "border-success/50"
              : "border-destructive/50"
          }
        />
        <KPICard
          title="Voitures"
          value={`${summary?.voituresActives || 0} / ${summary?.totalVoitures || 0}`}
          icon={Car}
        />
      </div>

      {/* Barre de progression objectif */}
      <Card className="p-4 mobile:p-6">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-base mobile:text-lg font-medium">
            Progression objectif mensuel
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {formatAriary(summary?.recetteMois || 0)} /{" "}
                {formatAriary(summary?.objectifMensuel || 0)}
              </span>
              <span className="font-medium text-success">
                {summary?.progressionObjectif || 0}%
              </span>
            </div>
            <Progress value={summary?.progressionObjectif || 0} />
          </div>
        </CardContent>
      </Card>

      {/* Alertes */}
      {hasAlertes && (
        <Card className="border-warning/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-warning">
              <AlertTriangle className="h-5 w-5" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alertes?.vidangesRetard.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">
                    Vidanges en retard ({alertes.vidangesRetard.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {alertes.vidangesRetard.map((v) => (
                      <Badge key={v.id} variant="warning">
                        {v.immatriculation} - {v.marque} {v.modele}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {alertes?.chauffeursSansVersement.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">
                    Chauffeurs sans versement depuis 2 jours (
                    {alertes.chauffeursSansVersement.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {alertes.chauffeursSansVersement.map((c) => (
                      <Badge key={c.id} variant="destructive">
                        {c.nom} {c.voiture && `(${c.voiture})`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 mobile:grid-cols-2">
        {/* Graphique recettes 30 jours */}
        <Card className="p-4 mobile:p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base mobile:text-lg font-medium">
              Recettes (30 jours)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-56 mobile:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recettes30j}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis
                    dataKey="date"
                    stroke="#888"
                    fontSize={12}
                    tickFormatter={(value) => value.slice(5)}
                  />
                  <YAxis
                    stroke="#888"
                    fontSize={12}
                    tickFormatter={(value) =>
                      `${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111",
                      border: "1px solid #222",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value: number) => [
                      formatAriary(value),
                      "Recette",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="montant"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tableau versements du jour */}
        <Card className="p-4 mobile:p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base mobile:text-lg font-medium">
              Versements du jour
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {versementsJour.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Aucun versement aujourd'hui
              </p>
            ) : (
              <>
                {/* Mobile: Cards */}
                <div className="mobile:hidden space-y-3 max-h-72 overflow-auto">
                  {versementsJour.map((v) => (
                    <TableMobileCard
                      key={v.id}
                      title={v.chauffeur ? `${v.chauffeur.prenom} ${v.chauffeur.nom}` : "-"}
                      subtitle={v.voiture?.immatriculation || "-"}
                      data={[
                        { label: "Montant", value: formatAriary(v.montant) },
                      ]}
                      status={{
                        label: v.statut === "ok" ? "OK" : v.statut === "partiel" ? "Partiel" : "Manquant",
                        variant: v.statut === "ok" ? "success" : v.statut === "partiel" ? "warning" : "destructive",
                      }}
                    />
                  ))}
                </div>

                {/* Desktop: Table */}
                <div className="hidden mobile:block max-h-72 overflow-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b border-border text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Voiture</th>
                        <th className="pb-3 font-medium">Chauffeur</th>
                        <th className="pb-3 text-right font-medium">Montant</th>
                        <th className="pb-3 text-right font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {versementsJour.map((v) => (
                        <tr
                          key={v.id}
                          className="table-row-hover border-b border-border text-sm"
                        >
                          <td className="py-3">
                            {v.voiture?.immatriculation || "-"}
                          </td>
                          <td className="py-3">
                            {v.chauffeur
                              ? `${v.chauffeur.prenom} ${v.chauffeur.nom}`
                              : "-"}
                          </td>
                          <td className="py-3 text-right">
                            {formatAriary(v.montant)}
                          </td>
                          <td className="py-3 text-right">
                            <Badge
                              variant={
                                v.statut === "ok"
                                  ? "success"
                                  : v.statut === "partiel"
                                  ? "warning"
                                  : "destructive"
                              }
                            >
                              {v.statut === "ok"
                                ? "OK"
                                : v.statut === "partiel"
                                ? "Partiel"
                                : "Manquant"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
