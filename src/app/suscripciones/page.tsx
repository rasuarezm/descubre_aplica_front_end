import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/layout/LegalLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Planes de Suscripción - Bidtory Colombia",
  description:
    "Elija el plan de Bidtory que mejor se adapta a sus necesidades para encontrar licitaciones y convocatorias en Colombia con IA.",
};

type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  tagline: string;
  popular: boolean;
  badge?: string;
  features: string[];
  href: string;
};

const PLANS: Plan[] = [
  {
    id: "esencial",
    name: "Esencial",
    price: "$149.000",
    period: "COP / mes",
    tagline: "Para comenzar a monitorear",
    popular: false,
    features: [
      "Bidtory Descubre incluido",
      "Contratación pública (SECOP II)",
      "Scoring IA básico",
      "Alertas diarias por email",
      "CTA de apoyo Puro Contenido",
      "1 usuario · 5 palabras clave",
      "Soporte por email",
    ],
    href: "/registro?plan=esencial",
  },
  {
    id: "profesional",
    name: "Profesional",
    price: "$349.000",
    period: "COP / mes",
    tagline: "El más popular",
    popular: true,
    badge: "Más popular",
    features: [
      "Todo lo de Esencial, más:",
      "Bidtory Aplica incluido",
      "Fondos de fomento nacionales",
      "Scoring IA completo con Gemini",
      "Botón Llevar al pipeline (próximamente)",
      "Hasta 5 usuarios · 20 palabras clave",
      "Soporte prioritario",
    ],
    href: "/registro?plan=profesional",
  },
  {
    id: "experto",
    name: "Experto",
    price: "$649.000",
    period: "COP / mes",
    tagline: "Para equipos de licitaciones",
    popular: false,
    features: [
      "Todo lo de Profesional, más:",
      "Cooperación internacional y fondos privados",
      "Alertas inmediatas (sin esperar el batch diario)",
      "Usuarios ilimitados · Palabras clave sin límite",
      "Soporte por WhatsApp",
    ],
    href: "/registro?plan=experto",
  },
];

type ComparisonDataRow = {
  feature: string;
  esencial: boolean | string;
  profesional: boolean | string;
  experto: boolean | string;
};

type ComparisonCategoryRow = { category: string };

type ComparisonRow = ComparisonCategoryRow | ComparisonDataRow;

function isCategoryRow(row: ComparisonRow): row is ComparisonCategoryRow {
  return "category" in row && typeof row.category === "string";
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { category: "Módulos" },
  {
    feature: "Bidtory Descubre",
    esencial: true,
    profesional: true,
    experto: true,
  },
  {
    feature: "Bidtory Aplica",
    esencial: false,
    profesional: true,
    experto: true,
  },
  { category: "Fuentes de convocatorias" },
  {
    feature: "Contratación pública (SECOP II)",
    esencial: true,
    profesional: true,
    experto: true,
  },
  {
    feature: "Fondos de fomento nacionales",
    esencial: false,
    profesional: true,
    experto: true,
  },
  {
    feature: "Cooperación internacional",
    esencial: false,
    profesional: false,
    experto: true,
  },
  {
    feature: "Fondos privados y fundaciones",
    esencial: false,
    profesional: false,
    experto: true,
  },
  { category: "Funcionalidades" },
  {
    feature: "Scoring IA",
    esencial: "Básico",
    profesional: "Completo",
    experto: "Completo",
  },
  {
    feature: "Alertas por email",
    esencial: "Diarias",
    profesional: "Diarias",
    experto: "Inmediatas",
  },
  {
    feature: "CTA apoyo Puro Contenido",
    esencial: true,
    profesional: true,
    experto: true,
  },
  {
    feature: "Llevar al pipeline",
    esencial: false,
    profesional: "Próximamente",
    experto: "Próximamente",
  },
  { category: "Límites de uso" },
  {
    feature: "Usuarios",
    esencial: "1",
    profesional: "Hasta 5",
    experto: "Ilimitados",
  },
  {
    feature: "Palabras clave",
    esencial: "5",
    profesional: "20",
    experto: "Sin límite",
  },
  {
    feature: "Soporte",
    esencial: "Email",
    profesional: "Prioritario",
    experto: "WhatsApp",
  },
];

const FAQ_ITEMS = [
  {
    q: "¿Puedo cambiar de plan?",
    a: "Sí. Puede subir o bajar de plan en cualquier momento. El cambio se aplica al inicio del siguiente ciclo de facturación.",
  },
  {
    q: "¿Cómo funciona el cobro?",
    a: "El cobro es mensual y automático a través de Wompi (Bancolombia). Recibirá una notificación antes de cada renovación.",
  },
  {
    q: "¿Puedo cancelar en cualquier momento?",
    a: "Sí. Si cancela antes del próximo ciclo, no se genera ningún cargo adicional. Su acceso continúa hasta el final del período pagado.",
  },
  {
    q: "¿Qué es el botón 'Llevar al pipeline'?",
    a: "Es una función de integración entre Bidtory Descubre y Bidtory Aplica: con un clic, una licitación pasa directamente al pipeline de trabajo en Aplica. Disponible próximamente para planes Profesional y Experto.",
  },
  {
    q: "¿Qué incluye el CTA de apoyo Puro Contenido?",
    a: "En cada convocatoria con score relevante aparece un botón para hablar directamente con el equipo consultor de Puro Contenido SAS. No tiene costo adicional: es un canal para derivar a consultoría cuando lo requiera.",
  },
];

function PlanFeatureCheck() {
  return (
    <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
      <Check className="h-3 w-3" strokeWidth={2.5} />
    </span>
  );
}

function PlanFeatureCross() {
  return (
    <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <X className="h-3 w-3" />
    </span>
  );
}

function featureLineShowsProntoBadge(text: string) {
  return /próximamente/i.test(text);
}

function ComparisonCell({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <PlanFeatureCheck />
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex justify-center">
        <PlanFeatureCross />
      </div>
    );
  }
  if (value === "Próximamente") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-1">
        <span className="text-sm">Próximamente</span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          Pronto
        </span>
      </div>
    );
  }
  return <span className="block text-center text-sm">{value}</span>;
}

export default function SuscripcionesPage() {
  return (
    <LegalLayout>
      <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* 1. Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="mb-4 font-headline text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Planes Bidtory
          </h1>
          <p className="text-lg text-muted-foreground">
            Encuentre las convocatorias que su empresa puede ganar. Elija el plan
            que mejor se adapta a su etapa.
          </p>
        </div>

        {/* 2. Plan cards */}
        <div className="mb-16 grid gap-6 md:grid-cols-3 lg:gap-8">
          {PLANS.map((plan) => (
            <div key={plan.id} className="relative h-full">
              {plan.popular && plan.badge ? (
                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                  <Badge className="bg-accent px-3 py-1 text-xs font-medium text-accent-foreground shadow-sm">
                    {plan.badge}
                  </Badge>
                </div>
              ) : null}
              <Card
                className={cn(
                  "relative flex h-full flex-col rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md",
                  plan.popular
                    ? "border-2 border-accent bg-accent/5 shadow-md"
                    : "border-border",
                )}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="font-headline text-lg font-semibold text-foreground">
                    {plan.name}
                  </CardTitle>
                  <p className="mt-0.5 text-sm text-muted-foreground">{plan.tagline}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col pt-0">
                  <div className="mb-6">
                    <span className="text-[34px] font-semibold leading-none tracking-tight text-foreground">
                      {plan.price}
                    </span>
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                  <ul className="flex-1 space-y-3">
                    {plan.features.map((line, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <PlanFeatureCheck />
                        <span>
                          {line}
                          {featureLineShowsProntoBadge(line) ? (
                            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 align-middle text-[10px] font-medium text-muted-foreground">
                              Pronto
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant="outline"
                    className={cn(
                      "mt-6 w-full",
                      plan.popular &&
                        "border-transparent bg-accent text-accent-foreground shadow-sm hover:bg-accent/90 hover:text-accent-foreground",
                    )}
                  >
                    <Link href={plan.href}>Elegir plan</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* 3. Comparison table */}
        <section className="mb-16">
          <div className="mb-8 text-center">
            <h2 className="font-headline text-2xl font-semibold text-foreground">
              Comparar planes
            </h2>
            <p className="mt-2 text-muted-foreground">
              Todos los detalles lado a lado
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-[34%] p-4 text-left font-semibold text-foreground">
                    Característica
                  </th>
                  <th className="w-[22%] p-4 text-center font-semibold text-foreground">
                    Esencial
                  </th>
                  <th className="w-[22%] bg-accent/10 p-4 text-center font-semibold text-accent">
                    Profesional
                  </th>
                  <th className="w-[22%] p-4 text-center font-semibold text-foreground">
                    Experto
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => {
                  if (isCategoryRow(row)) {
                    return (
                      <tr key={`cat-${row.category}-${i}`} className="border-b border-border">
                        <td
                          colSpan={4}
                          className="bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          {row.category}
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr
                      key={`${row.feature}-${i}`}
                      className="border-b border-border last:border-0 hover:bg-muted/10"
                    >
                      <td className="p-4 text-left align-middle text-foreground">
                        {row.feature}
                      </td>
                      <td className="p-4 align-middle">
                        <ComparisonCell value={row.esencial} />
                      </td>
                      <td className="p-4 align-middle">
                        <ComparisonCell value={row.profesional} />
                      </td>
                      <td className="p-4 align-middle">
                        <ComparisonCell value={row.experto} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. FAQ */}
        <section className="mb-16 max-w-2xl mx-auto">
          <h2 className="mb-8 text-center font-headline text-2xl font-semibold text-foreground">
            Preguntas frecuentes
          </h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <details
                key={i}
                className="group rounded-lg border border-border bg-card"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg p-4 font-medium text-foreground transition-colors hover:bg-muted/10 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4 pt-0 text-sm text-muted-foreground">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* 5. CTA final */}
        <section className="mx-auto max-w-2xl rounded-xl bg-muted/30 p-8 text-center">
          <h2 className="font-headline text-xl font-semibold text-foreground md:text-2xl">
            ¿Tiene dudas sobre qué plan elegir?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Escríbanos y le ayudaremos a encontrar el plan correcto para su empresa.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <a href="https://wa.me/573208691817?text=Hola%2C%20quiero%20conocer%20más%20sobre%20los%20planes%20de%20Bidtory">
              Hablar con el equipo
            </a>
          </Button>
        </section>
      </div>
    </LegalLayout>
  );
}
