export interface AlertaBajoStock {
  id: number;
  nombre: string;
  stock_minimo: number;
  stock_actual: number;
}

export interface AlertaVencimiento {
  id: number;
  insumo_id: number;
  lote?: string;
  fecha_vencimiento: Date;
  cantidad_actual: number;
  insumo?: {
    nombre: string;
  };
}
