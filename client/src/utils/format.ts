/**
 * Formatea un número a moneda boliviana (Bs)
 * @param amount - Cantidad a formatear
 * @returns String formateado: 'Bs 1.234,56'
 */
export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(amount).replace('BOB', 'Bs');
};
