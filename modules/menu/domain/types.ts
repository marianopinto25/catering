export interface PlatoDTO {
  id: number;
  nombre: string;
  descripcion?: string | null;
  estado: string;
}

export interface MenuItemDTO {
  id: number;
  semana: number;
  dia: string;
  turno: string;
  porciones_estimadas: number;
  plato: PlatoDTO;
}
