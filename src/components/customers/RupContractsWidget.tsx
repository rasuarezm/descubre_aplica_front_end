
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  RupContract,
  RupContractsResponse,
  CustomerDocument,
  CertificationExtractedData,
} from '@/types';

export type { RupContract } from '@/types';
import apiClient from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { useExtractionProgress } from '@/hooks/useExtractionProgress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  CheckCircle2, AlertCircle, AlertTriangle, Link2, Link2Off, ChevronDown, ChevronUp,
  Building2, Calendar, DollarSign, Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Helpers de formato ─────────────────────────────────────────────────────

function fmtCOP(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP',
    notation: 'compact', maximumFractionDigits: 1,
  }).format(value);
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'MMM yyyy', { locale: es });
  } catch {
    return iso;
  }
}

// ─── Sub-componente: detalle de la certificación vinculada ───────────────────

function CertificationDetail({ data }: { data: CertificationExtractedData }) {
  return (
    <div className="mt-3 rounded-md bg-muted/30 border border-secondary/20 p-3 space-y-2 text-xs">
      {data.contract_object && (
        <p className="text-foreground/80 leading-snug">
          <span className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] block mb-0.5">Objeto</span>
          {data.contract_object}
        </p>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {data.contracting_entity && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{data.contracting_entity}</span>
          </div>
        )}
        {(data.execution_start || data.execution_end) && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{fmtDate(data.execution_start)} – {fmtDate(data.execution_end)}</span>
          </div>
        )}
        {data.contract_value_smmlv != null && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="h-3 w-3 shrink-0" />
            <span>{data.contract_value_smmlv.toLocaleString('es-CO')} SMMLV</span>
          </div>
        )}
        {data.contract_value_cop != null && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="h-3 w-3 shrink-0" />
            <span>{fmtCOP(data.contract_value_cop)}</span>
          </div>
        )}
      </div>
      {data.sector_keywords && data.sector_keywords.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
          {data.sector_keywords.map(k => (
            <Badge key={k} variant="secondary" className="text-[10px] px-1.5 py-0">{k}</Badge>
          ))}
        </div>
      )}
      {data.satisfactory_completion != null && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', data.satisfactory_completion ? 'text-green-400' : 'text-destructive')}>
          {data.satisfactory_completion
            ? <><CheckCircle2 className="h-3 w-3" /> Cumplimiento satisfactorio</>
            : <><AlertCircle className="h-3 w-3" /> Incumplimiento reportado</>
          }
        </div>
      )}
    </div>
  );
}

// ─── Sub-componente: fila de un contrato ─────────────────────────────────────

function ContractRow({
  contract,
  onLinkClick,
  onUnlinkClick,
}: {
  contract: RupContract;
  onLinkClick: (contract: RupContract) => void;
  onUnlinkClick: (contract: RupContract) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasCert = !!contract.certification;
  const mismatchWarnings = getMismatchWarnings(contract);
  const hasMismatch = mismatchWarnings.length > 0;

  return (
    <div className={cn(
      'rounded-lg border p-3 transition-colors',
      hasCert ? 'border-green-500/20 bg-green-950/10' : 'border-secondary/30 bg-card'
    )}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
              #{contract.rup_consecutive}
            </span>
            {hasCert ? (
              <>
                <Badge variant="outline" className="text-green-400 border-green-500/30 text-[10px] gap-1 px-1.5">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Certificación vinculada
                </Badge>
                {hasMismatch && (
                  <span title={mismatchWarnings.join('\n')} className="cursor-help">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  </span>
                )}
              </>
            ) : (
              <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px] gap-1 px-1.5">
                <AlertCircle className="h-2.5 w-2.5" /> Sin certificación
              </Badge>
            )}
          </div>
          <p className="font-medium text-sm truncate">{contract.contracting_entity || '—'}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            {contract.contract_value_smmlv != null && (
              <span>{contract.contract_value_smmlv.toLocaleString('es-CO')} SMMLV</span>
            )}
            {contract.unspsc_codes && contract.unspsc_codes.length > 0 && (
              <span className="font-mono">{contract.unspsc_codes.slice(0, 3).join(' · ')}{contract.unspsc_codes.length > 3 ? ` +${contract.unspsc_codes.length - 3}` : ''}</span>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 shrink-0">
          {hasCert && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={() => setExpanded(v => !v)}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? 'Ocultar' : 'Ver detalle'}
            </Button>
          )}
          {hasCert ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Desvincular certificación"
              onClick={() => onUnlinkClick(contract)}
            >
              <Link2Off className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => onLinkClick(contract)}
            >
              <Link2 className="h-3 w-3" /> Vincular
            </Button>
          )}
        </div>
      </div>

      {/* Detalle de certificación expandible */}
      {expanded && hasCert && contract.certification?.extracted_contract_data && (
        <CertificationDetail data={contract.certification.extracted_contract_data} />
      )}
      {expanded && hasCert && !contract.certification?.extracted_contract_data && (
        <p className="mt-2 text-xs text-muted-foreground italic">
          {contract.certification?.name} — sin datos extraídos por IA.
        </p>
      )}
    </div>
  );
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
type FilterType = 'all' | 'with_cert' | 'without_cert';

/** Normaliza nombre de entidad para comparación: mayúsculas, sin tildes, sin sufijos legales */
function normalizeEntityName(s: string): string {
  return s
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(SAS|SA|LTDA|EU|SCA|ESAL|S\.A\.S\.|S\.A\.|LTDA\.|S\.C\.A\.)\b/g, '')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface DocMatchResult {
  score: number;
  reasons: string[];
}

function computeMatchScore(contract: RupContract, doc: CustomerDocument): DocMatchResult {
  const raw = doc.extracted_contract_data;
  if (!raw) return { score: 0, reasons: [] };

  let extracted: CertificationExtractedData;
  try {
    extracted = typeof raw === 'string' ? JSON.parse(raw) : raw as CertificationExtractedData;
  } catch {
    return { score: 0, reasons: [] };
  }

  let score = 0;
  const reasons: string[] = [];

  const rupEntity = normalizeEntityName(contract.contracting_entity || '');
  const certEntity = normalizeEntityName(extracted.contracting_entity || '');

  if (rupEntity && certEntity) {
    if (rupEntity === certEntity) {
      score += 60;
      reasons.push('Entidad idéntica');
    } else if (rupEntity.includes(certEntity) || certEntity.includes(rupEntity)) {
      score += 40;
      reasons.push('Entidad similar');
    } else {
      const rupWords = new Set(rupEntity.split(' ').filter(w => w.length > 3));
      const certWords = certEntity.split(' ').filter(w => w.length > 3);
      const common = certWords.filter(w => rupWords.has(w));
      if (common.length >= 2) {
        score += common.length * 8;
        reasons.push(`${common.length} palabras en común`);
      }
    }
  }

  const rupVal = contract.contract_value_smmlv;
  const certVal = extracted.contract_value_smmlv;
  if (rupVal != null && certVal != null && rupVal > 0) {
    const diff = Math.abs(rupVal - certVal) / rupVal;
    if (diff <= 0.05)      { score += 40; reasons.push('Valor coincide (±5%)'); }
    else if (diff <= 0.15) { score += 25; reasons.push('Valor similar (±15%)'); }
    else if (diff <= 0.35) { score += 10; reasons.push('Valor aproximado (±35%)'); }
  }

  return { score, reasons };
}

function getMismatchWarnings(contract: RupContract): string[] {
  const extracted = contract.certification?.extracted_contract_data;
  if (!extracted) return [];
  const warnings: string[] = [];

  const rupEntity = normalizeEntityName(contract.contracting_entity || '');
  const certEntity = normalizeEntityName(extracted.contracting_entity || '');
  if (rupEntity && certEntity) {
    const hasMatch = rupEntity === certEntity
      || rupEntity.includes(certEntity)
      || certEntity.includes(rupEntity)
      || certEntity.split(' ').filter(w => w.length > 3 && new Set(rupEntity.split(' ')).has(w)).length >= 1;
    if (!hasMatch) {
      warnings.push(`La entidad del RUP ("${contract.contracting_entity}") no coincide con la certificación ("${extracted.contracting_entity}")`);
    }
  }

  const rupVal = contract.contract_value_smmlv;
  const certVal = extracted.contract_value_smmlv;
  if (rupVal != null && certVal != null && rupVal > 0) {
    const diff = Math.abs(rupVal - certVal) / rupVal;
    if (diff > 0.35) {
      warnings.push(`Valor diferente: RUP ${rupVal.toLocaleString('es-CO')} SMMLV vs certificación ${certVal.toLocaleString('es-CO')} SMMLV`);
    }
  }

  return warnings;
}

// ─── Componente principal ────────────────────────────────────────────────────

interface RupContractsWidgetProps {
  customerId: string;
  fiscalYear?: number | null;
  /** Docs de categoría 'experience' disponibles para vincular */
  experienceDocs: CustomerDocument[];
  /** Docs de categoría 'rup' — se usa para detectar si hay extracción en curso */
  rupDocs?: CustomerDocument[];
  /** Callback con el Set de IDs de certificaciones ya vinculadas */
  onLinkedDocIdsChange?: (ids: Set<string>) => void;
  /** Mejor contrato RUP sugerido por certificación (score ≥ 50), según computeMatchScore */
  onSuggestionsChange?: (suggestions: Map<string, RupContract>) => void;
}

export function RupContractsWidget({
  customerId,
  fiscalYear,
  experienceDocs,
  rupDocs = [],
  onLinkedDocIdsChange,
  onSuggestionsChange,
}: RupContractsWidgetProps) {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<RupContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Estado del modal de vinculación
  const [linkTarget, setLinkTarget] = useState<RupContract | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);

  // IDs de certificaciones ya vinculadas a algún contrato
  const linkedDocIds = useMemo(
    () => new Set(
      contracts
        .filter(c => c.certification_doc_id != null)
        .map(c => String(c.certification_doc_id))
    ),
    [contracts]
  );

  // Docs disponibles para vincular: excluye los ya vinculados a otro contrato,
  // pero mantiene el que ya tiene el contrato objetivo (para poder cambiarlo)
  const availableDocs = useMemo(
    () => experienceDocs.filter(
      d => !linkedDocIds.has(d.id) || d.id === String(linkTarget?.certification_doc_id)
    ),
    [experienceDocs, linkedDocIds, linkTarget]
  );

  const scoredDocs = useMemo(() => {
    if (!linkTarget) return availableDocs.map(d => ({ doc: d, score: 0, reasons: [] as string[] }));
    return availableDocs
      .map(d => ({ doc: d, ...computeMatchScore(linkTarget, d) }))
      .sort((a, b) => b.score - a.score);
  }, [availableDocs, linkTarget]);

  const extractionProgress = useExtractionProgress(customerId, rupDocs);

  /** Evita setState en el padre si las sugerencias no cambiaron (referencias inestables). */
  const lastSuggestionsSigRef = useRef<string | null>(null);

  const fetchContracts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ customer_id: customerId });
      if (fiscalYear) params.set('fiscal_year', String(fiscalYear));
      const data = await apiClient.get<RupContractsResponse>(`/get_rup_contracts?${params.toString()}`);
      if (data) {
        setContracts(data.contracts);
        // Notificar al padre qué cert IDs están vinculadas
        const linked = new Set(
          data.contracts
            .filter(c => c.certification_doc_id != null)
            .map(c => String(c.certification_doc_id))
        );
        onLinkedDocIdsChange?.(linked);
      }
    } catch {
      // Sin contratos — silencioso
    } finally {
      setLoading(false);
    }
  }, [customerId, fiscalYear, onLinkedDocIdsChange]);

  /** Cuando cambian los docs RUP (p. ej. borrado), hay que volver a cargar contratos aunque fetchContracts sea estable. */
  const rupDocumentsKey = useMemo(
    () => rupDocs.map(d => d.id).sort().join('|'),
    [rupDocs]
  );

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts, rupDocumentsKey]);

  // Tras extraer el RUP, los contratos viven en get_rup_contracts; al completar la extracción hay que volver a pedirlos.
  useEffect(() => {
    if (extractionProgress?.status === 'completed') {
      void fetchContracts();
    }
  }, [extractionProgress?.status, fetchContracts]);

  useEffect(() => {
    if (!onSuggestionsChange) return;

    const emit = (suggestions: Map<string, RupContract>, sig: string) => {
      if (sig === lastSuggestionsSigRef.current) return;
      lastSuggestionsSigRef.current = sig;
      onSuggestionsChange(suggestions);
    };

    if (contracts.length === 0) {
      emit(new Map(), '__empty_contracts__');
      return;
    }
    const suggestions = new Map<string, RupContract>();
    for (const doc of experienceDocs) {
      if (doc.extracted_contract_data == null) continue;

      let bestContract: RupContract | null = null;
      let bestScore = 0;
      for (const contract of contracts) {
        const { score } = computeMatchScore(contract, doc);
        if (score > bestScore) {
          bestScore = score;
          bestContract = contract;
        }
      }
      if (bestContract && bestScore >= 50) {
        suggestions.set(String(doc.id), bestContract);
      }
    }
    const sig = [...suggestions.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([docId, c]) => `${docId}:${c.id}`)
      .join('|');
    emit(suggestions, sig || '__no_suggestions__');
  }, [contracts, experienceDocs, onSuggestionsChange]);

  // Resetear paginación al cambiar filtro
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [filter]);

  const handleLinkConfirm = async () => {
    if (!linkTarget || !selectedDocId) return;
    setIsLinking(true);
    try {
      await apiClient.post('/link_certification_to_contract', {
        rup_contract_id: linkTarget.id,
        certification_doc_id: selectedDocId,
        customer_id: customerId,
      });
      toast({ title: 'Certificación vinculada', description: `Contrato #${linkTarget.rup_consecutive} actualizado.` });
      setLinkTarget(null);
      setSelectedDocId('');
      await fetchContracts();
    } catch (err) {
      toast({ title: 'Error al vincular', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async (contract: RupContract) => {
    try {
      await apiClient.post('/link_certification_to_contract', {
        rup_contract_id: contract.id,
        certification_doc_id: null,
        customer_id: customerId,
      });
      toast({ title: 'Certificación desvinculada', description: `Contrato #${contract.rup_consecutive} actualizado.` });
      await fetchContracts();
    } catch (err) {
      toast({ title: 'Error al desvincular', description: (err as Error).message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (contracts.length === 0) return null;

  const withCert = contracts.filter(c => c.certification).length;
  const withoutCert = contracts.length - withCert;

  const filtered = contracts.filter(c => {
    if (filter === 'with_cert') return !!c.certification;
    if (filter === 'without_cert') return !c.certification;
    return true;
  });
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="mt-4 space-y-3">
      {/* Encabezado con resumen */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5" />
          Contratos Inscritos en RUP ({contracts.length})
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircle2 className="h-3 w-3" /> {withCert} con certificación
          </span>
          {withoutCert > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <AlertCircle className="h-3 w-3" /> {withoutCert} sin certificación
            </span>
          )}
        </div>
      </div>

      {/* Filtros rápidos */}
      <div className="flex items-center gap-1">
        {([
          { key: 'all', label: `Todos (${contracts.length})` },
          { key: 'without_cert', label: `Sin certificación (${withoutCert})` },
          { key: 'with_cert', label: `Con certificación (${withCert})` },
        ] as { key: FilterType; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'text-xs px-2.5 py-1 rounded-md border transition-colors',
              filter === key
                ? 'bg-accent/20 border-accent text-accent-foreground font-medium'
                : 'border-secondary/30 text-muted-foreground hover:border-secondary/60 hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de contratos (paginada) */}
      <div className="space-y-2">
        {visible.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No hay contratos que coincidan con el filtro seleccionado.
          </p>
        ) : (
          visible.map(contract => (
            <ContractRow
              key={contract.id}
              contract={contract}
              onLinkClick={(c) => { setLinkTarget(c); setSelectedDocId(''); }}
              onUnlinkClick={handleUnlink}
            />
          ))
        )}
      </div>

      {/* Botón cargar más */}
      {hasMore && (
        <div className="flex justify-center pt-1">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 gap-1"
            onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
          >
            <ChevronDown className="h-3.5 w-3.5" />
            Cargar más ({filtered.length - visibleCount} restantes)
          </Button>
        </div>
      )}

      {/* Modal de vinculación */}
      <Dialog open={!!linkTarget} onOpenChange={(open) => !open && setLinkTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Vincular Certificación al Contrato #{linkTarget?.rup_consecutive}</DialogTitle>
            <DialogDescription>
              {linkTarget?.contracting_entity && (
                <span className="font-medium">{linkTarget.contracting_entity} · </span>
              )}
              Selecciona el documento de certificación que corresponde a este contrato del RUP.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[55vh] overflow-y-auto">
            {experienceDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No hay certificaciones de experiencia cargadas en la biblioteca.
                Sube primero un documento en la sección "Documentos de Experiencia".
              </p>
            ) : availableDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Todas las certificaciones disponibles ya están vinculadas a otros contratos.
                Sube una nueva certificación para vincularla a este contrato.
              </p>
            ) : (
              <RadioGroup value={selectedDocId} onValueChange={setSelectedDocId} className="space-y-2">
                {scoredDocs.map(({ doc, score, reasons }) => (
                  <div
                    key={doc.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors',
                      selectedDocId === doc.id
                        ? 'border-accent bg-accent/10'
                        : 'border-secondary/30 hover:border-secondary/60'
                    )}
                    onClick={() => setSelectedDocId(doc.id)}
                  >
                    <RadioGroupItem value={doc.id} id={`cert-${doc.id}`} className="mt-0.5 shrink-0" />
                    <Label htmlFor={`cert-${doc.id}`} className="cursor-pointer flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{doc.name}</p>
                        {score >= 50 && (
                          <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 text-[10px] gap-1 px-1.5">
                            ★ Sugerida
                          </Badge>
                        )}
                      </div>
                      {reasons.length > 0 && (
                        <p className="text-xs text-muted-foreground">{reasons.join(' · ')}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{doc.fileName || doc.filename || 'Archivo subido'}</p>
                      {doc.financial_extraction_status === 'completed' && (
                        <Badge variant="outline" className="text-green-400 border-green-500/30 text-[10px] gap-1 px-1.5 mt-1">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Datos extraídos por IA
                        </Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isLinking}>Cancelar</Button>
            </DialogClose>
            <Button
              onClick={handleLinkConfirm}
              disabled={!selectedDocId || isLinking || availableDocs.length === 0}
            >
              {isLinking ? 'Vinculando…' : 'Confirmar Vinculación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
