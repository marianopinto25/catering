export interface Inventario {
  id: number;
  insumo_id: number;
  lote?: string;
  fecha_vencimiento?: Date;
  cantidad_actual: number;
  estado: string;
}

export interface MovimientoInventario {
  id: number;
  insumo_id: number;
  inventario_id?: number;
  tipo_movimiento: string;
  cantidad: number;
  fecha: Date;
  motivo?: string;
  usuario_id: number;
}
