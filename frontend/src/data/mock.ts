export interface Document {
  id: string;
  name: string;
  model: string;
  concept: string;
  period: string;
  date: string;
  status: 'revision' | 'listo' | 'borrador' | 'procesando';
  fields: number;
  filled: number;
  flagged: number;
}

export interface StatusMeta {
  label: string;
  tone: 'warn' | 'ok' | 'muted' | 'accent';
}

export interface Field {
  c: string;
  label: string;
  value: string;
  unit?: string;
  conf: 'alta' | 'media' | 'baja';
  ai: boolean;
  line?: number;
  note?: string;
}

export interface FieldGroup {
  id: string;
  title: string;
  fields: Field[];
}

export interface PipelineStep {
  id: string;
  label: string;
  detail: string;
}

export const DOCUMENTS: Document[] = [
  { id: 'd1', name: 'Modelo 303 · 2T 2026', model: '303', concept: 'IVA · Autoliquidación',             period: '2T 2026',    date: '12 jun 2026', status: 'revision',  fields: 28, filled: 28, flagged: 2 },
  { id: 'd2', name: 'Modelo 130 · 2T 2026', model: '130', concept: 'IRPF · Pago fraccionado',           period: '2T 2026',    date: '10 jun 2026', status: 'listo',     fields: 14, filled: 14, flagged: 0 },
  { id: 'd3', name: 'Modelo 303 · 1T 2026', model: '303', concept: 'IVA · Autoliquidación',             period: '1T 2026',    date: '08 abr 2026', status: 'listo',     fields: 28, filled: 28, flagged: 0 },
  { id: 'd4', name: 'Modelo 111 · 1T 2026', model: '111', concept: 'Retenciones IRPF',                  period: '1T 2026',    date: '07 abr 2026', status: 'listo',     fields: 11, filled: 11, flagged: 0 },
  { id: 'd5', name: 'Modelo 349 · Mar 2026', model: '349', concept: 'Operaciones intracomunitarias',    period: 'Marzo 2026', date: '02 abr 2026', status: 'borrador',  fields: 9,  filled: 4,  flagged: 0 },
  { id: 'd6', name: 'Modelo 130 · 1T 2026', model: '130', concept: 'IRPF · Pago fraccionado',          period: '1T 2026',    date: '06 abr 2026', status: 'listo',     fields: 14, filled: 14, flagged: 0 },
];

export const STATUS_META: Record<string, StatusMeta> = {
  revision:   { label: 'En revisión', tone: 'warn'   },
  listo:      { label: 'Listo',       tone: 'ok'     },
  borrador:   { label: 'Borrador',    tone: 'muted'  },
  procesando: { label: 'Procesando',  tone: 'accent' },
};

export const FIELD_GROUPS: FieldGroup[] = [
  {
    id: 'ident', title: 'Identificación',
    fields: [
      { c: '—', label: 'NIF',                               value: 'B-86420135',            conf: 'alta',  ai: true, line: 4 },
      { c: '—', label: 'Apellidos y nombre / Razón social', value: 'Talleres Nórdicos S.L.', conf: 'alta', ai: true, line: 5 },
      { c: '—', label: 'Ejercicio',                         value: '2026',                  conf: 'alta',  ai: true, line: 6 },
      { c: '—', label: 'Periodo',                           value: '2T',                    conf: 'alta',  ai: true, line: 7 },
    ],
  },
  {
    id: 'devengado', title: 'IVA devengado',
    fields: [
      { c: '01', label: 'Base imponible (21%)',  value: '84.320,00',  unit: '€', conf: 'alta',  ai: true, line: 14 },
      { c: '03', label: 'Cuota (21%)',           value: '17.707,20',  unit: '€', conf: 'alta',  ai: true, line: 15 },
      { c: '04', label: 'Base imponible (10%)',  value: '6.150,00',   unit: '€', conf: 'media', ai: true, line: 16 },
      { c: '06', label: 'Cuota (10%)',           value: '615,00',     unit: '€', conf: 'media', ai: true, line: 17 },
      { c: '27', label: 'Total cuota devengada', value: '18.322,20',  unit: '€', conf: 'alta',  ai: true, line: 19 },
    ],
  },
  {
    id: 'deducible', title: 'IVA deducible',
    fields: [
      { c: '28', label: 'Base cuotas soportadas (operac. interiores)', value: '41.880,00', unit: '€', conf: 'alta',  ai: true, line: 24 },
      { c: '29', label: 'Cuota deducible operac. interiores',          value: '8.794,80',  unit: '€', conf: 'baja',  ai: true, line: 25, note: 'Importe ilegible en el escaneo — verifica con tus facturas.' },
      { c: '45', label: 'Total a deducir',                             value: '8.794,80',  unit: '€', conf: 'baja',  ai: true, line: 27 },
    ],
  },
  {
    id: 'resultado', title: 'Resultado',
    fields: [
      { c: '46', label: 'Resultado régimen general',       value: '9.527,40', unit: '€', conf: 'alta',  ai: true, line: 31 },
      { c: '71', label: 'Resultado de la autoliquidación', value: '9.527,40', unit: '€', conf: 'media', ai: true, line: 33, note: 'Sin cuotas a compensar de periodos anteriores.' },
    ],
  },
];

export const GENERATED_MD = `# Modelo 303 — Autoliquidación de IVA
> Generado por Casilla · convertido desde \`modelo-303-2T.pdf\`

## Identificación
- **NIF:** B-86420135
- **Razón social:** Talleres Nórdicos S.L.
- **Ejercicio:** 2026
- **Periodo:** 2T

## IVA devengado
| Casilla | Concepto              | Base       | Cuota      |
|--------:|-----------------------|-----------:|-----------:|
| 01 / 03 | Operaciones al 21 %   | 84.320,00  | 17.707,20  |
| 04 / 06 | Operaciones al 10 %   |  6.150,00  |    615,00  |
| **27**  | **Total devengado**   |            | **18.322,20** |

## IVA deducible
| Casilla | Concepto                     | Base       | Cuota     |
|--------:|------------------------------|-----------:|----------:|
| 28 / 29 | Cuotas soportadas interiores | 41.880,00  | 8.794,80  |
| **45**  | **Total a deducir**          |            | **8.794,80** |

## Resultado
- **Casilla 46** — Régimen general: **9.527,40 €**
- **Casilla 71** — Resultado de la autoliquidación: **9.527,40 €**

_Resultado: a ingresar._
`;

export const PIPELINE: PipelineStep[] = [
  { id: 'upload', label: 'Subiendo documento',       detail: 'modelo-303-2T.pdf · 2,4 MB' },
  { id: 'ocr',    label: 'Extrayendo texto (OCR)',    detail: '3 páginas reconocidas' },
  { id: 'md',     label: 'Convirtiendo a Markdown',  detail: 'Estructura y tablas detectadas' },
  { id: 'fill',   label: 'Rellenando casillas',       detail: '28 campos identificados' },
  { id: 'check',  label: 'Validando importes',        detail: 'Cuadre devengado − deducible' },
];
