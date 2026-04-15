import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/layout/LegalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "Planes de Suscripción - Bidtory Colombia",
  description:
    "Elija el plan de Bidtory que mejor se adapta a sus necesidades para encontrar licitaciones y convocatorias en Colombia con IA.",
};

const PLANS = [
  {
    id: "basico",
    name: "Esencial",
    price: "Consultar",
    description: "Ideal para iniciar",
    features: [
      "Monitoreo de 1 Fuente SECOP RSS",
      "Alertas Diarias por Email",
      "Información Esencial (Título y Enlace)",
      "1 Destinatario de Correo",
    ],
    cta: "Elegir Plan",
    href: "/login",
    popular: false,
  },
  {
    id: "estandar",
    name: "Profesional",
    price: "Consultar",
    description: "Más popular",
    features: [
      "Todo lo del Plan Esencial, MÁS:",
      "Monitoreo hasta 2 Fuentes SECOP",
      "Análisis Detallado por IA",
      "Dashboard de Oportunidades",
      "Hasta 3 Destinatarios de Correo",
      "Mayor Número de Palabras Clave",
    ],
    cta: "Elegir Plan",
    href: "/login",
    popular: true,
  },
  {
    id: "premium",
    name: "Experto",
    price: "Consultar",
    description: "Soporte Prioritario",
    features: [
      "Todo lo del Plan Profesional, MÁS:",
      "Monitoreo hasta 3 Fuentes SECOP",
      "Alertas Inmediatas (Palabras Clave Doradas)",
      "Hasta 5 Destinatarios de Correo",
      "Máximo Número de Palabras Clave",
    ],
    cta: "Elegir Plan",
    href: "/login",
    popular: false,
  },
];

const COMPARISON_ROWS = [
  { feature: "Fuentes SECOP RSS", esencial: "1", profesional: "Hasta 2", experto: "Hasta 3" },
  {
    feature: "Alertas por Email",
    esencial: "Diarias",
    profesional: "Diarias",
    experto: "Diarias + Inmediatas (Doradas)",
  },
  {
    feature: "Detalle de Análisis IA",
    esencial: "Básico (Título, Enlace)",
    profesional: "Detallado",
    experto: "Detallado",
  },
  { feature: "Dashboard Web", esencial: false, profesional: true, experto: true },
  { feature: "Destinatarios Email", esencial: "1", profesional: "Hasta 3", experto: "Hasta 5" },
  {
    feature: "Palabras Clave (+/-)",
    esencial: "Básico",
    profesional: "Estándar",
    experto: "Avanzado",
  },
  {
    feature: "Palabras Clave Doradas",
    esencial: false,
    profesional: false,
    experto: "Hasta 3",
  },
];

const FAQ_ITEMS = [
  {
    q: "¿Puedo cambiar de plan después?",
    a: "¡Claro que sí! Puede cambiar su plan en cualquier momento desde su panel de control. Los cambios se aplicarán al inicio de su próximo ciclo de facturación.",
  },
  {
    q: "¿Hay un periodo de prueba?",
    a: "Consulte los detalles de cada plan. Ofrecemos garantía de devolución de dinero de 14 días para suscripciones iniciales.",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Aceptamos transferencia bancaria a través del Banco Caja Social. Consulte con nuestro equipo para más opciones.",
  },
  {
    q: "¿Hay contratos a largo plazo?",
    a: "Nuestros planes son flexibles. Puede elegir una suscripción mensual o anual. Puede cancelar su suscripción en cualquier momento antes del próximo ciclo de renovación.",
  },
];

function CheckIcon() {
  return <Check className="h-5 w-5 text-accent shrink-0" />;
}

function XIcon() {
  return <X className="h-5 w-5 text-muted-foreground shrink-0" />;
}

export default function SuscripcionesPage() {
  return (
    <LegalLayout>
      <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-headline font-semibold mb-4">
            Planes Bidtory
          </h1>
          <p className="text-muted-foreground text-lg">
            Elija el plan que impulse su éxito en la contratación pública. Todos
            los planes incluyen nuestro potente motor de IA para filtrar
            oportunidades.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative ${plan.popular ? "md:-mt-2 md:mb-2" : ""}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-medium bg-popular text-white z-10">
                  Más Popular
                </span>
              )}
              <Card
                className={`h-full flex flex-col bg-white shadow-md ${
                  plan.popular
                    ? "border-2 border-accent shadow-lg"
                    : "border border-border"
                }`}
              >
                <CardHeader
                  className={
                    plan.popular
                      ? "bg-[#E6FFFA] border-b border-border"
                      : ""
                  }
                >
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-6">
                  <div className="mb-6">
                    <span className="text-2xl font-headline font-semibold">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm ml-1">
                      /mes
                    </span>
                  </div>
                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckIcon />
                        <span>{f}</span>
                      </li>
                    ))}
                    <li className="text-muted-foreground text-sm italic">
                      {plan.description}
                    </li>
                  </ul>
                  <Link href={plan.href} className="block mt-auto">
                    <Button
                      className={`w-full ${plan.popular ? "bg-accent hover:bg-accent/90 text-accent-foreground" : ""}`}
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <section className="mb-16">
          <h2 className="text-2xl font-headline font-semibold text-center mb-8">
            Compare los planes
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 font-medium w-[34%]">
                    Característica
                  </th>
                  <th className="text-center p-4 font-medium w-[22%]">
                    Esencial
                  </th>
                  <th className="text-center p-4 font-medium w-[22%]">
                    Profesional
                  </th>
                  <th className="text-center p-4 font-medium w-[22%]">
                    Experto
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-border last:border-0 hover:bg-muted/10"
                  >
                    <td className="p-4 text-left">{row.feature}</td>
                    <td className="p-4 text-center">
                      {typeof row.esencial === "boolean" ? (
                        row.esencial ? (
                          <CheckIcon />
                        ) : (
                          <XIcon />
                        )
                      ) : (
                        row.esencial
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.profesional === "boolean" ? (
                        row.profesional ? (
                          <CheckIcon />
                        ) : (
                          <XIcon />
                        )
                      ) : (
                        row.profesional
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.experto === "boolean" ? (
                        row.experto ? (
                          <CheckIcon />
                        ) : (
                          <XIcon />
                        )
                      ) : (
                        row.experto
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-headline font-semibold text-center mb-8">
            Preguntas Frecuentes
          </h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <details
                key={i}
                className="group rounded-lg border border-border bg-card"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-medium hover:bg-muted/10 rounded-lg transition-colors [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4 pt-0 text-muted-foreground text-sm">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </LegalLayout>
  );
}
