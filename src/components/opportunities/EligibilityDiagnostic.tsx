
"use client";

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type {
  EligibilityAnalysis,
  EligibilityStatus,
  FinancialIndicatorResult,
  ExperienceRequirementResult,
  QualifyingExperience,
  RupContractWithoutCert,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  ShieldQuestion,
  Landmark,
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileWarning,
  Building2,
  FileCheck,
  DollarSign,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface EligibilityDiagnosticProps {
  opportunityId: string;
  customerId: string;
}

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<EligibilityStatus, {
  label: string;
  badgeClass: string;
  Icon: React.ElementType;
}> = {
  cumple:    { label: 'Cumple',     badgeClass: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',  Icon: CheckCircle2   },
  no_cumple: { label: 'No Cumple',  badgeClass: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',              Icon: XCircle        },
  parcial:   { label: 'Parcial',    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',  Icon: AlertTriangle  },
  sin_datos: { label: 'Sin Datos',  badgeClass: 'bg-muted text-muted-foreground border-border',                                                                  Icon: HelpCircle     },
};

function StatusBadge({ status, size = 'sm' }: { status: EligibilityStatus; size?: 'sm' | 'lg' }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.sin_datos;
  const { Icon } = cfg;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-semibold',
      size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      cfg.badgeClass
    )}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {cfg.label}
    </span>
  );
}

function OverallStatusIcon({ status }: { status: EligibilityStatus }) {
  const icons: Record<EligibilityStatus, React.ElementType> = {
    cumple:    ShieldCheck,
    no_cumple: ShieldX,
    parcial:   ShieldAlert,
    sin_datos: ShieldQuestion,
  };
  const colors: Record<EligibilityStatus, string> = {
    cumple:    'text-green-600',
    no_cumple: 'text-destructive',
    parcial:   'text-amber-500',
    sin_datos: 'text-muted-foreground',
  };
  const Icon = icons[status] ?? ShieldQuestion;
  return <Icon className={cn('h-8 w-8', colors[status])} />;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function RemediationBox({ gap, suggestion }: { gap: string | null; suggestion: string | null }) {
  if (!gap && !suggestion) return null;
  return (
    <div className="mt-2 rounded-md bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-3 space-y-1.5">
      {gap && (
        <p className="text-xs text-red-700 dark:text-red-400">
          <span className="font-semibold">Brecha: </span>{gap}
        </p>
      )}
      {suggestion && (
        <p className="text-xs text-red-600 dark:text-red-300">
          <span className="font-semibold">Sugerencia: </span>{suggestion}
        </p>
      )}
    </div>
  );
}

function FinancialIndicatorRow({ indicator }: { indicator: FinancialIndicatorResult }) {
  const [expanded, setExpanded] = useState(indicator.status === 'no_cumple');
  const hasDetails = !!indicator.gap_description || !!indicator.remediation_suggestion;

  return (
    <div className={cn(
      'rounded-lg border p-3 space-y-2',
      indicator.status === 'cumple'    && 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-900/10',
      indicator.status === 'no_cumple' && 'border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-900/10',
      indicator.status === 'parcial'   && 'border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-900/10',
      indicator.status === 'sin_datos' && 'border-border bg-muted/20',
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">
              {indicator.indicator_name ?? 'Indicador'}
              {indicator.threshold_description && (
                <span className="ml-1.5 text-xs text-muted-foreground font-mono font-normal">
                  {indicator.threshold_description}
                </span>
              )}
            </p>
            {indicator.fiscal_year_used && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {indicator.fiscal_year_used}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {indicator.requirement_text}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {indicator.client_value !== null && indicator.client_value !== undefined && (
            <span className="text-sm font-bold tabular-nums">
              {typeof indicator.client_value === 'number'
                ? indicator.client_value >= 1_000_000
                  ? `$${(indicator.client_value / 1_000_000).toFixed(1)}M`
                  : indicator.client_value.toFixed(2)
                : indicator.client_value}
            </span>
          )}
          <StatusBadge status={indicator.status} />
          {hasDetails && (
            <button onClick={() => setExpanded(v => !v)} className="text-muted-foreground hover:text-foreground">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
      {expanded && hasDetails && (
        <RemediationBox gap={indicator.gap_description} suggestion={indicator.remediation_suggestion} />
      )}
    </div>
  );
}

function ExperienceCard({ experience }: { experience: QualifyingExperience }) {
  return (
    <div className="rounded-md border bg-card p-3 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <FileCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {experience.source === 'rup_cert'
              ? `RUP #${experience.rup_consecutive ?? '—'}`
              : 'Certificación'}
          </span>
        </div>
        {experience.value_smmlv !== null && experience.value_smmlv !== undefined && (
          <span className="text-xs font-bold tabular-nums text-green-700 dark:text-green-400 shrink-0">
            {experience.value_smmlv.toLocaleString('es-CO')} SMMLV
          </span>
        )}
      </div>
      {experience.contracting_entity && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Building2 className="h-3 w-3 shrink-0" />
          {experience.contracting_entity}
        </p>
      )}
      {experience.contract_object && (
        <p className="text-xs text-foreground/80 line-clamp-2">{experience.contract_object}</p>
      )}
      {experience.match_explanation && (
        <p className="text-xs text-muted-foreground italic border-t pt-1 mt-1">
          {experience.match_explanation}
        </p>
      )}
    </div>
  );
}

function ExperienceRequirementRow({ req }: { req: ExperienceRequirementResult }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={cn(
      'rounded-lg border p-3 space-y-2',
      req.status === 'cumple'    && 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-900/10',
      req.status === 'no_cumple' && 'border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-900/10',
      req.status === 'parcial'   && 'border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-900/10',
      req.status === 'sin_datos' && 'border-border bg-muted/20',
    )}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm flex-1">{req.requirement_text}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge status={req.status} />
          <button onClick={() => setExpanded(v => !v)} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="space-y-2">
          {req.qualifying_experiences.length > 0 && (
            <div className="space-y-1.5">
              {req.qualifying_experiences.map((exp, i) => (
                <ExperienceCard key={i} experience={exp} />
              ))}
            </div>
          )}
          {(req.gap_description || req.remediation_suggestion) && (
            <RemediationBox gap={req.gap_description} suggestion={req.remediation_suggestion} />
          )}
        </div>
      )}
    </div>
  );
}

function RupWithoutCertWarning({ items }: { items: RupContractWithoutCert[] }) {
  if (items.length === 0) return null;
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border border-border bg-muted/30 overflow-hidden">
      <button
        className="w-full flex items-center justify-between text-left px-3 py-2.5 hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2">
          <FileWarning className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-xs font-semibold text-foreground">
            {items.length} contrato(s) del RUP sin certificación — podrían ser candidatos
          </span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="border-t border-border divide-y divide-border">
          {items.map((c, i) => (
            <div key={i} className="px-3 py-2 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">
                  RUP #{c.rup_consecutive ?? '—'}
                </span>
                {c.value_smmlv != null && (
                  <span className="text-xs font-bold tabular-nums text-muted-foreground shrink-0">
                    {c.value_smmlv.toLocaleString('es-CO')} SMMLV
                  </span>
                )}
              </div>
              {c.contracting_entity && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3 shrink-0" />
                  {c.contracting_entity}
                </p>
              )}
              {c.potentially_qualifying_for.length > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Podría cubrir: {c.potentially_qualifying_for.join(' · ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export function EligibilityDiagnostic({ opportunityId, customerId }: EligibilityDiagnosticProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EligibilityAnalysis | null>(null);

  useEffect(() => {
    if (!opportunityId || !customerId) return;
    apiClient
      .get<EligibilityAnalysis>(
        `/get_eligibility_analysis?opportunity_id=${opportunityId}&customer_id=${customerId}`
      )
      .then(data => { if (data) setResult(data); })
      .catch(() => {
        // Sin análisis previo — silencioso
      });
  }, [opportunityId, customerId]);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.post<EligibilityAnalysis>('/analyze_customer_eligibility', {
        opportunity_id: parseInt(opportunityId, 10),
        customer_id: parseInt(customerId, 10),
      });
      setResult(data);
      toast({ title: 'Diagnóstico completado', description: 'La elegibilidad del cliente ha sido analizada.' });
    } catch (error) {
      toast({
        title: 'Error al analizar elegibilidad',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Empty state ---
  if (!result && !isLoading) {
    return (
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <ShieldQuestion className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">Diagnóstico de Elegibilidad</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Compruebe si el cliente cumple los requisitos habilitantes de esta oportunidad:
            indicadores financieros y experiencia certificada, cruzados contra los requisitos del pliego.
          </p>
          <Button onClick={handleGenerate} disabled={isLoading}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Analizar Elegibilidad del Cliente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // --- Loading state ---
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center text-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-highlight mb-3" />
          <p className="text-sm text-muted-foreground">Analizando elegibilidad del cliente...</p>
          <p className="text-xs text-muted-foreground mt-1">Esto puede tomar hasta un minuto.</p>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  // --- Results state ---
  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <OverallStatusIcon status={result.overall_status} />
            <div>
              <CardTitle className="text-base">Diagnóstico de Elegibilidad</CardTitle>
              <CardDescription>
                Generado el{' '}
                {new Date(result.generated_at).toLocaleString('es-CO', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={result.overall_status} size="lg" />
            <Button variant="outline" size="sm" onClick={() => setResult(null)}>
              <RotateCcw className="mr-1.5 h-3 w-3" />
              Regenerar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Financial Block */}
      {result.financial_block && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="h-4 w-4 text-highlight" />
                Indicadores Financieros
              </CardTitle>
              <StatusBadge status={result.financial_block.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.financial_block.indicators.map((ind, i) => (
              <FinancialIndicatorRow key={i} indicator={ind} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Experience Block */}
      {result.experience_block && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4 text-highlight" />
                Experiencia Certificada
              </CardTitle>
              <StatusBadge status={result.experience_block.status} />
            </div>
            {result.experience_block.presupuesto_oficial_smmlv != null && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5 w-fit">
                <DollarSign className="h-3 w-3 shrink-0" />
                <span>
                  Presupuesto oficial:{' '}
                  <span className="font-semibold text-foreground">
                    {result.experience_block.presupuesto_oficial_smmlv.toLocaleString('es-CO', { maximumFractionDigits: 2 })} SMMLV
                  </span>
                  {result.experience_block.presupuesto_oficial_cop != null && (
                    <span className="ml-1 text-muted-foreground/70">
                      (${(result.experience_block.presupuesto_oficial_cop / 1_000_000).toFixed(1)}M COP · SMMLV {result.experience_block.smmlv_anio})
                    </span>
                  )}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {result.experience_block.requirements.map((req, i) => (
              <ExperienceRequirementRow key={i} req={req} />
            ))}
            <RupWithoutCertWarning items={result.experience_block.rup_contracts_without_cert} />
          </CardContent>
        </Card>
      )}

      {!result.financial_block && !result.experience_block && (
        <Card>
          <CardContent className="pt-6 text-center py-8">
            <HelpCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              El pliego no tiene requisitos habilitantes identificados o el análisis de IA aún no está completo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
