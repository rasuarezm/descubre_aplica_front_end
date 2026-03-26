import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
export const dynamic = "force-dynamic";
export default function DocumentLibraryPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline tracking-tight">Biblioteca de Documentos</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Repositorio Central de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página servirá como una biblioteca central para todos los documentos subidos. 
            Los usuarios podrán buscar, filtrar y gestionar documentos de todas las oportunidades y clientes.
          </p>
          {/* Placeholder for document library view */}
          <div className="mt-6 border border-dashed rounded-lg p-8 text-center text-muted-foreground">
            La interfaz de la biblioteca de documentos se implementará aquí.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
