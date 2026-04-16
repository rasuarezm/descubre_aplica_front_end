
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { Opportunity, Customer } from "@/types";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, AlertCircle, CalendarIcon, Sigma, Percent, Trophy, Activity, Clock, XCircle, Trash, Send } from 'lucide-react';
import { format, startOfYear, endOfYear, subDays, startOfMonth, endOfMonth, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getUrgencyInfo, UrgencyInfo } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api-client';

const KANBAN_COLUMNS: string[] = [
  "Prospecto",
  "Borrador",
  "En Desarrollo",
  "Enviada",
  "Ganada",
  "Perdida",
  "Descartada",
];

const FINAL_OPPORTUNITY_STATUSES = ['Ganada', 'Perdida', 'Descartada'];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
};

function OpportunityCard({ opportunity, canManage }: { opportunity: Opportunity & { urgencyInfo: UrgencyInfo | null }, canManage: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: opportunity.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
        opacity: isDragging ? 0.8 : 1,
    };
    
    const urgencyInfo = opportunity.urgencyInfo;
    const isFinalStatus = FINAL_OPPORTUNITY_STATUSES.includes(opportunity.status);
    const isEnviada = opportunity.status === 'Enviada';

    return (
        <Card 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...(canManage ? listeners : {})}
            className={cn(
                "touch-none rounded-lg border border-border bg-white p-3 shadow-[0_2px_4px_rgba(0,0,0,0.05)] border-l-4 transition-shadow",
                canManage && "cursor-grab active:cursor-grabbing hover:shadow-md",
                isDragging && "z-10 shadow-md ring-2 ring-primary/15",
                isFinalStatus
                    ? {
                        "border-l-accent": opportunity.status === "Ganada",
                        "border-l-destructive": opportunity.status === "Perdida",
                        "border-l-[#9b9b9b]": opportunity.status === "Descartada",
                      }
                    : isEnviada
                      ? "border-l-primary"
                      : {
                          "border-l-destructive":
                            urgencyInfo?.status === "overdue",
                          "border-l-highlight":
                            urgencyInfo?.status === "urgent" ||
                            urgencyInfo?.status === "upcoming",
                          "border-l-primary":
                            !urgencyInfo || urgencyInfo.status === "normal",
                        },
            )}
        >
            <div>
                <p className="font-semibold text-sm mb-1">{opportunity.title}</p>
                {opportunity.amount && <p className="text-xs text-highlight font-medium mb-2">{formatCurrency(opportunity.amount)}</p>}
                
                <div className="flex gap-1 flex-wrap mb-2">
                  {isFinalStatus ? (
                    <Badge 
                        variant='secondary'
                        className={cn(
                            'capitalize px-1.5 py-0.5 text-[10px]',
                            {
                              "bg-accent text-accent-foreground":
                                opportunity.status === "Ganada",
                              "bg-destructive text-destructive-foreground":
                                opportunity.status === "Perdida",
                              "bg-[#9b9b9b] text-white hover:bg-[#8a8a8a]":
                                opportunity.status === "Descartada",
                            }
                        )}
                    >
                        {opportunity.status === 'Ganada' && <Trophy className="mr-1 h-2.5 w-2.5" />}
                        {opportunity.status === 'Perdida' && <XCircle className="mr-1 h-2.5 w-2.5" />}
                        {opportunity.status === 'Descartada' && <Trash className="mr-1 h-2.5 w-2.5" />}
                        {opportunity.status}
                    </Badge>
                  ) : isEnviada ? (
                    <Badge 
                        variant='secondary'
                        className='capitalize border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary hover:bg-primary/15'
                    >
                        <Send className="mr-1 h-2.5 w-2.5" />
                        Enviada
                    </Badge>
                  ) : (
                    <>
                      {urgencyInfo?.status === "overdue" && (
                        <Badge
                          variant="destructive"
                          className="px-1.5 py-0.5 text-[10px]"
                        >
                          <Clock className="mr-1 h-2.5 w-2.5" /> Vencida
                        </Badge>
                      )}
                      {urgencyInfo?.status === "urgent" && (
                        <Badge
                          variant="secondary"
                          className="border border-highlight/60 bg-highlight px-1.5 py-0.5 text-[10px] text-highlight-foreground hover:bg-highlight/90"
                        >
                          <Clock className="mr-1 h-2.5 w-2.5" /> Urgente
                        </Badge>
                      )}
                      {urgencyInfo?.status === "upcoming" && (
                        <Badge
                          variant="secondary"
                          className="border border-highlight/60 bg-highlight px-1.5 py-0.5 text-[10px] text-highlight-foreground hover:bg-highlight/90"
                        >
                          <Clock className="mr-1 h-2.5 w-2.5" /> Próxima a vencer
                        </Badge>
                      )}
                    </>
                  )}
                </div>

                {opportunity.deadline && !isFinalStatus && <p className="text-xs text-muted-foreground mt-1">Cierre: {format(opportunity.deadline, "dd MMM yyyy, p", { locale: es })}</p>}
            </div>
        </Card>
    );
}

function KanbanColumn({ status, opportunities, canManage }: { status: string; opportunities: (Opportunity & { urgencyInfo: UrgencyInfo | null })[], canManage: boolean }) {
    const { setNodeRef } = useSortable({ id: status, disabled: true });
    
    const columnValue = useMemo(() => opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0), [opportunities]);

    return (
        <div
            ref={setNodeRef}
            className="flex h-full flex-col rounded-lg border border-border/80 bg-primary/[0.045] p-2 shadow-sm"
        >
            <h2 className="p-2 font-semibold text-foreground flex justify-between items-center">
                <span>{status}</span>
                <span className="text-sm font-normal text-secondary-foreground bg-secondary rounded-full px-2 py-0.5">
                    {opportunities.length}
                </span>
            </h2>
             <div className="px-2 pb-2 text-xs font-bold text-highlight">
                {formatCurrency(columnValue)}
            </div>
            <div className="flex-1 space-y-3 p-1 overflow-y-auto min-h-[150px]">
                <SortableContext items={opportunities.map(o => o.id)} strategy={verticalListSortingStrategy}>
                    {opportunities.map(opp => (
                        <OpportunityCard key={opp.id} opportunity={opp} canManage={canManage} />
                    ))}
                </SortableContext>
                {opportunities.length === 0 && <div className="p-4 text-center text-xs text-muted-foreground">Vacío</div>}
            </div>
        </div>
    );
}


export default function PipelinePage() {
    const params = useParams();
    const router = useRouter();
    const customerId = params.customerId as string;
    const { userProfile } = useAuth();
    const { toast } = useToast();

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [opportunities, setOpportunities] = useState<(Opportunity & { urgencyInfo: UrgencyInfo | null })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfYear(new Date()),
        to: endOfYear(new Date()),
    });
    
    const canManagePipeline = useMemo(() => {
        if (!userProfile) return false;
        if (userProfile.role === 'admin') return true;
        if (userProfile.role === 'customer' && userProfile.customer_role === 'administrador_cliente') return true;
        return false;
    }, [userProfile]);

    const fetchData = useCallback(async (currentDateRange: DateRange | undefined) => {
        setLoading(true);
        setError(null);

        try {
            const [allCustomers, oppsData] = await Promise.all([
                apiClient.get<Customer[]>('/get_customers'),
                (async () => {
                    const params = new URLSearchParams({ customer_id: customerId });
                    if (currentDateRange?.from) params.append('startDate', format(currentDateRange.from, 'yyyy-MM-dd'));
                    if (currentDateRange?.to) params.append('endDate', format(currentDateRange.to, 'yyyy-MM-dd'));
                    return apiClient.get<Opportunity[]>(`/get_opportunities?${params.toString()}`);
                })()
            ]);
            
            const currentCustomer = allCustomers.find(c => String(c.id) === customerId);
            if (!currentCustomer) throw new Error('Cliente no encontrado.');
            setCustomer(currentCustomer);
            
            const processedOpportunities = oppsData.map((opp: any) => ({
                ...opp,
                id: String(opp.id),
                title: opp.name,
                deadline: opp.deadline ? new Date(opp.deadline) : undefined,
                urgencyInfo: opp.deadline ? getUrgencyInfo(new Date(opp.deadline)) : null,
            }));
            setOpportunities(processedOpportunities);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido.";
            setError(errorMessage);
            toast({ title: "Error de Carga", description: errorMessage, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [customerId, toast]);

    useEffect(() => {
        if (userProfile && customerId) {
            fetchData(dateRange);
        }
    }, [userProfile, customerId, dateRange, fetchData]);
    
    const metrics = useMemo(() => {
        const pipelineOpps = opportunities.filter(opp => ["Prospecto", "Borrador", "En Desarrollo", "Enviada"].includes(opp.status));
        const wonOpps = opportunities.filter(opp => opp.status === "Ganada");
        const lostOpps = opportunities.filter(opp => opp.status === "Perdida");
        
        const pipelineValue = pipelineOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0);
        const wonValue = wonOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0);
        
        const totalClosed = wonOpps.length + lostOpps.length;
        const winRate = totalClosed > 0 ? (wonOpps.length / totalClosed) * 100 : 0;

        return {
            pipelineValue,
            winRate,
            wonValue,
            activeCount: pipelineOpps.length,
        };
    }, [opportunities]);

    const opportunitiesByStatus = useMemo(() => {
        const grouped: { [key: string]: (Opportunity & { urgencyInfo: UrgencyInfo | null })[] } = {};
        KANBAN_COLUMNS.forEach(col => grouped[col] = []);
        opportunities.forEach(opp => {
            if (grouped[opp.status]) {
                grouped[opp.status].push(opp);
            }
        });
        return grouped;
    }, [opportunities]);
    
    const setDatePreset = (preset: 'thisMonth' | 'last90days' | 'thisYear') => {
        const today = new Date();
        if (preset === 'thisMonth') {
            setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        } else if (preset === 'last90days') {
            setDateRange({ from: subDays(today, 90), to: today });
        } else if (preset === 'thisYear') {
            setDateRange({ from: startOfYear(today), to: endOfYear(today) });
        }
    };
    
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );
    
    function findContainer(id: string) {
        if (KANBAN_COLUMNS.includes(id)) {
            return id;
        }
        return Object.keys(opportunitiesByStatus).find(key => opportunitiesByStatus[key].some(item => String(item.id) === id));
    }

    const handleDragStart = (event: any) => {
        const { active } = event;
        setActiveId(String(active.id));
    };
    
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;
    
        const activeId = String(active.id);
        const overId = String(over.id);

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        const opportunityId = activeId;
        const newStatus = overContainer;
        
        const opportunity = opportunities.find(o => String(o.id) === opportunityId);
        if (!opportunity || opportunity.status === newStatus || !KANBAN_COLUMNS.includes(newStatus)) return;
        
        const originalOpportunities = [...opportunities];
        
        // Optimistic update
        setOpportunities(prev => {
            const activeIndex = prev.findIndex(o => String(o.id) === activeId);
            if (activeIndex === -1) return prev;
            
            const newOpportunities = [...prev];
            newOpportunities[activeIndex] = {
                ...newOpportunities[activeIndex],
                status: newStatus
            };
            return newOpportunities;
        });

        try {
            await apiClient.patch('/update_opportunity', { id: opportunityId, status: newStatus });
            toast({ title: "Éxito", description: `Estado de "${opportunity.title}" actualizado a "${newStatus}".` });

        } catch (error) {
            setOpportunities(originalOpportunities); // Revert on failure
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        }
    };

    if (loading && !customer) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.28))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4">Cargando pipeline...</p>
            </div>
        );
    }
    
    if (error) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.28))] text-center">
           <AlertCircle className="h-10 w-10 text-destructive" />
           <p className="mt-4 text-lg font-semibold">{error}</p>
           <Link href={`/dashboard/customers/${customerId}`} passHref>
              <Button variant="outline" className="mt-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a la Zona del Cliente
              </Button>
            </Link>
        </div>
      );
    }

    const activeOpportunity = activeId ? opportunities.find(o => String(o.id) === activeId) : null;
    
    return (
        <div className="flex flex-col h-full space-y-6">
            <div>
                <Link href={`/dashboard/customers/${customerId}`} className="inline-flex items-center text-sm text-accent hover:underline mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a {customer?.name}
                </Link>
                <h1 className="text-3xl font-headline tracking-tight">Pipeline de Oportunidades</h1>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6 flex flex-wrap items-center gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button id="date" variant={"outline"} className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                                            {format(dateRange.to, "LLL dd, y", { locale: es })}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y", { locale: es })
                                    )
                                ) : (
                                    <span>Seleccionar rango de fechas</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                                locale={es}
                            />
                        </PopoverContent>
                    </Popover>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setDatePreset('thisMonth')}>Este Mes</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDatePreset('last90days')}>Últimos 90 días</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDatePreset('thisYear')}>Este Año</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor en Pipeline</CardTitle>
                        <Sigma className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-highlight">{formatCurrency(metrics.pipelineValue)}</div>
                        <p className="text-xs text-muted-foreground">Valor total de oportunidades activas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.winRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">De las oportunidades cerradas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor Total Ganado</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-accent">{formatCurrency(metrics.wonValue)}</div>
                        <p className="text-xs text-muted-foreground">En el período seleccionado</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Oportunidades Activas</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.activeCount}</div>
                        <p className="text-xs text-muted-foreground">No cerradas en el período</p>
                    </CardContent>
                </Card>
            </div>

            {/* Kanban Board */}
            <DndContext 
              onDragStart={handleDragStart} 
              onDragEnd={handleDragEnd} 
              sensors={sensors} 
              collisionDetection={closestCenter}
            >
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="grid grid-cols-[repeat(7,minmax(300px,1fr))] gap-4 h-full items-start">
                         <SortableContext items={KANBAN_COLUMNS}>
                            {KANBAN_COLUMNS.map(status => (
                                <KanbanColumn 
                                    key={status}
                                    status={status}
                                    opportunities={opportunitiesByStatus[status] || []}
                                    canManage={canManagePipeline}
                                />
                            ))}
                        </SortableContext>
                    </div>
                </div>
                 <DragOverlay>
                    {activeOpportunity ? <OpportunityCard opportunity={activeOpportunity} canManage={canManagePipeline} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

    