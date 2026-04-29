export interface Compra {
  id: number;
  proveedor_id: number;
  fecha: Date;
  total: number;
  estado: string;
}

export interface CompraDetalle {
  id: number;
  compra_id: number;
  insumo_id: number;
  cantidad: number;
  precio_unitario: number;
}
