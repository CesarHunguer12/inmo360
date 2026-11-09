export type PropertyModality = 'VENTA' | 'ALQUILER' | 'ANTICRETICO';
export type PropertyStatus = 'DISPONIBLE' | 'RESERVADA' | 'NO_DISPONIBLE' | 'INACTIVA';
export type PropertyType = 'CASA' | 'DEPARTAMENTO' | 'TERRENO' | 'OFICINA' | 'LOCAL_COMERCIAL' | 'OTRO';

export interface PropertyImage {
  id: string;
  url: string;
  caption?: string | null;
  position: number;
}

export interface Property {
  id: string;
  code: string;
  title: string;
  description: string;
  modality: PropertyModality;
  type: PropertyType;
  status: PropertyStatus;
  price: string | number;
  currency?: string;
  zone: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  areaM2: string | number;
  hasGarage: boolean;
  features: string[];
  ownerId?: string;
  agentId?: string;
  images?: PropertyImage[];
  createdAt?: string;
  agent?: { id: string; fullName: string };
  owner?: { id: string; fullName: string };
}

export interface PropertyFilters {
  modality?: PropertyModality | '';
  type?: PropertyType | '';
  zone?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minAreaM2?: number;
}

export const modalityLabel: Record<PropertyModality, string> = {
  VENTA: 'En venta',
  ALQUILER: 'Alquiler',
  ANTICRETICO: 'Anticrético',
};

export const statusLabel: Record<PropertyStatus, string> = {
  DISPONIBLE: 'Disponible',
  RESERVADA: 'Reservada',
  NO_DISPONIBLE: 'No disponible',
  INACTIVA: 'Inactiva',
};

export const propertyTypeLabel: Record<PropertyType, string> = {
  CASA: 'Casa',
  DEPARTAMENTO: 'Departamento',
  TERRENO: 'Terreno',
  OFICINA: 'Oficina',
  LOCAL_COMERCIAL: 'Local comercial',
  OTRO: 'Otro',
};
