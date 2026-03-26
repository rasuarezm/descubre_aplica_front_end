import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const normalizeDocName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/de|el|la|y|o/g, '') // Quitar palabras conectoras
    .replace(/c(é|e)dula de ciudadan(í|i)a del representante legal/g, 'cedularepresentante')
    .replace(/c(é|e)dula del representante/g, 'cedularepresentante')
    .replace(/certificado de existencia y representaci(ó|o)n legal/g, 'camaracomercio')
    .replace(/c(á|a)mara de comercio/g, 'camaracomercio')
    .replace(/registro (ú|u)nico de proponentes/g, 'rup')
    .replace(/estados financieros/g, 'estadosfinancieros')
    .replace(/certificado de antecedentes disciplinarios/g, 'antecedentesprocuraduria')
    .replace(/\s+/g, '') // Quitar espacios
    .replace(/[^\w]/gi, ''); // Quitar caracteres no alfanuméricos
};
