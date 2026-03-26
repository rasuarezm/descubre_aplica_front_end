import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
export const dynamic = "force-dynamic";
export default function AllOpportunitiesPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline tracking-tight">Todas las Oportunidades</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Resumen de Oportunidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página mostrará una lista de todas las oportunidades de todos los clientes. 
            Aquí habrá funcionalidades para filtrar, ordenar y gestionar las oportunidades.
          </p>
          {/* Placeholder for opportunity list or table */}
          <div className="mt-6 border border-dashed rounded-lg p-8 text-center text-muted-foreground">
            La lista/tabla de oportunidades se implementará aquí.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
