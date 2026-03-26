
"use client";

import { useMemo } from 'react';
import type { WBS, WBSNode, BudgetItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CheckCircle, Edit, Download, CircleDollarSign, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Papa from 'papaparse';

interface TaskNodeProps {
  node: WBSNode;
  level: number;
}

const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
};

const TaskNode = ({ node, level }: TaskNodeProps) => {
  const defaultOpenValue = level < 2 ? `task-${node.id}` : undefined;
  
  const phaseTotal = useMemo(() => {
    let total = 0;
    const calculateTotal = (currentNode: WBSNode) => {
        if (currentNode.budget_items) {
            total += currentNode.budget_items.reduce((sum, item) => {
                // Aseguramos que el valor se trate como número antes de sumarlo
                const cost = Number(item.total_cost_suggestion) || 0;
                return sum + cost;
            }, 0);
        }
        if (currentNode.sub_tasks) {
            currentNode.sub_tasks.forEach(calculateTotal);
        }
    };
    calculateTotal(node);
    return total;
  }, [node]);

  return (
    <Accordion type="single" collapsible defaultValue={defaultOpenValue}>
      <AccordionItem value={`task-${node.id}`} className="border-b-0">
        <AccordionTrigger 
            className={`pl-${level * 4} hover:no-underline rounded-md hover:bg-muted/50 py-3`}
            style={{ paddingLeft: `${level * 1.5}rem` }}
        >
          <div className="text-left flex-1 flex justify-between items-center w-full pr-4">
            <p className="font-semibold text-base">{node.task_name}</p>
             {phaseTotal > 0 && <Badge variant="secondary">{formatCurrency(phaseTotal)}</Badge>}
          </div>
        </AccordionTrigger>
        <AccordionContent 
            className={`pb-0`}
            style={{ paddingLeft: `${level * 1.5}rem` }}
        >
          <div className="space-y-4 pt-2 border-l-2 border-dashed border-highlight/50 ml-2 pl-6">
            <div>
              <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2 flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-highlight"/> Entregable</h4>
              <p className="text-sm text-foreground/90">{node.deliverable}</p>
            </div>
            
            {node.budget_items && node.budget_items.length > 0 && (
               <div>
                <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2 flex items-center"><CircleDollarSign className="h-4 w-4 mr-2 text-highlight"/> Ítems de Presupuesto</h4>
                <div className="mt-2 pl-2 space-y-3">
                    {node.budget_items.map((budgetItem, index) => (
                    <div key={index} className="p-3 border rounded-md bg-muted/50">
                        <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold">{budgetItem.item}</p>
                            {budgetItem.description && <p className="text-xs text-muted-foreground">{budgetItem.description}</p>}
                             <p className="text-xs text-muted-foreground">Cantidad: {budgetItem.quantity}</p>
                        </div>
                        {(budgetItem.total_cost_suggestion ?? 0) > 0 && (
                            <div className="text-right flex-shrink-0 ml-4">
                                <p className="font-semibold">{formatCurrency(budgetItem.total_cost_suggestion)}</p>
                                {(budgetItem.unit_cost_suggestion ?? 0) > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    ({formatCurrency(budgetItem.unit_cost_suggestion)} / unidad)
                                </p>
                                )}
                            </div>
                        )}
                        </div>
                        {budgetItem.notes && (
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md flex items-start gap-2">
                            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span><span className="font-semibold">Nota IA:</span> {budgetItem.notes}</span>
                        </p>
                        )}
                    </div>
                    ))}
                </div>
                </div>
            )}
            
            {node.sub_tasks && node.sub_tasks.length > 0 && (
              <div className="space-y-2 pt-2">
                {node.sub_tasks.map(subtask => (
                  <TaskNode key={subtask.id} node={subtask} level={level + 1} />
                ))}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

interface WBSViewerProps {
  wbs: WBS;
  opportunityName: string;
}

const flattenWBS = (wbsData: WBSNode[]): any[] => {
  const flattened: any[] = [];

  const recurse = (nodes: WBSNode[], phaseId: string, phaseName: string) => {
    nodes.forEach(node => {
      if (node.budget_items && node.budget_items.length > 0) {
        node.budget_items.forEach(item => {
          flattened.push({
            'Fase_ID': phaseId,
            'Fase_Nombre': phaseName,
            'Tarea_ID': String(node.id),
            'Tarea_Nombre': node.task_name,
            'Entregable': node.deliverable,
            'Item_Presupuesto': item.item,
            'Descripcion_Item': item.description,
            'Cantidad': item.quantity,
            'Costo_Unitario_Sugerido': item.unit_cost_suggestion,
            'Costo_Total_Sugerido': item.total_cost_suggestion,
            'Notas_IA': item.notes
          });
        });
      } else {
        flattened.push({
          'Fase_ID': phaseId,
          'Fase_Nombre': phaseName,
          'Tarea_ID': String(node.id),
          'Tarea_Nombre': node.task_name,
          'Entregable': node.deliverable,
          'Item_Presupuesto': '',
          'Descripcion_Item': '',
          'Cantidad': '',
          'Costo_Unitario_Sugerido': '',
          'Costo_Total_Sugerido': '',
          'Notas_IA': ''
        });
      }
      
      if (node.sub_tasks && node.sub_tasks.length > 0) {
        recurse(node.sub_tasks, phaseId, phaseName);
      }
    });
  };

  wbsData.forEach(phase => {
    recurse([phase], String(phase.id), phase.task_name);
  });

  return flattened;
};

export function WBSViewer({ wbs, opportunityName }: WBSViewerProps) {

  const handleExport = () => {
    const flattenedData = flattenWBS(wbs.data);
    const csv = Papa.unparse(flattenedData);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const fileName = `WBS-${opportunityName.replace(/[^a-z0-9]/gi, '_')}.csv`;
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-6 w-6"/>
                    Estructura de Desglose de Trabajo (WBS) - Borrador
                </CardTitle>
                <CardDescription>
                    Generado el {format(new Date(wbs.generated_at), "dd 'de' MMMM, yyyy 'a las' p", { locale: es })}. 
                    Estado: <span className="capitalize font-medium">{wbs.status}</span>
                </CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" disabled>
                    <Edit className="mr-2 h-4 w-4"/> Editar
                </Button>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4"/> Exportar a CSV
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-2 space-y-2">
            {wbs.data.map(rootNode => (
              <div key={rootNode.id} className="bg-card rounded-md pt-2">
                 <TaskNode node={rootNode} level={0} />
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

