# TypeSelector Component

Componente generico riutilizzabile per la selezione di tipologie tramite card interattive con icone FontAwesome.

## Utilizzo

```typescript
import { TypeSelector, TypeOption } from './type-selector/type-selector';

// Definire le opzioni
const options: TypeOption[] = [
  {
    label: 'Opzione 1',
    value: 'option-1',
    icon: faIcon1,
    description: 'Descrizione opzionale' // Solo se showDescription=true
  },
  // ...
];

// Nel template
<app-type-selector
  [options]="options"
  [(selectedValue)]="selectedValue"
  [direction]="'row'"
  [size]="'default'"
  [showDescription]="false"
  (typeSelected)="onTypeChange($event)"
></app-type-selector>
```

## Input

- **options** (required): Array di `TypeOption[]` con le opzioni disponibili
- **selectedValue** (required, two-way binding): Valore correntemente selezionato
- **direction**: `'row'` (griglia) o `'column'` (fila orizzontale). Default: `'row'`
- **size**: `'default'` (con label) o `'small'` (solo icona). Default: `'default'`
- **showDescription**: Se `true`, mostra la descrizione nelle card. Default: `false`

## Output

- **typeSelected**: Emette il valore selezionato quando cambia

## Interfaccia TypeOption

```typescript
interface TypeOption {
  label: string; // Testo visualizzato
  value: string; // Valore univoco
  icon: IconDefinition; // Icona FontAwesome
  description?: string; // Descrizione opzionale
}
```

## Layout

### Row (griglia)

Layout a griglia responsive con card distribuite su più colonne (col-12 col-md-4 col-xl-3).

### Column (fila orizzontale)

Layout a fila orizzontale con card affiancate. Ideale per `size='small'`.

## Esempi d'uso

### Question Type Selector (piccolo)

```html
<app-type-selector [options]="questionTypes" [(selectedValue)]="selectedType" [direction]="'column'" [size]="'small'"></app-type-selector>
```

### Material Type Selector (con descrizioni)

```html
<app-type-selector [options]="materialTypes" [(selectedValue)]="selectedType" [direction]="'row'" [showDescription]="true"></app-type-selector>
```
