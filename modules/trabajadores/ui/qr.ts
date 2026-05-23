const VERSION = 5;
const SIZE = 17 + VERSION * 4;
const DATA_CODEWORDS = 108;
const ECC_CODEWORDS = 26;

type Cell = boolean | null;

const gfMul = (x: number, y: number) => {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    if (((y >>> i) & 1) !== 0) z ^= x;
  }
  return z & 0xff;
};

const rsGenerator = (degree: number) => {
  let result = [1];
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(result.length + 1).fill(0);
    result.forEach((coef, index) => {
      next[index] ^= gfMul(coef, root);
      next[index + 1] ^= coef;
    });
    result = next;
    root = gfMul(root, 2);
  }
  return result.slice(1);
};

const rsRemainder = (data: number[], degree: number) => {
  const gen = rsGenerator(degree);
  const result = new Array(degree).fill(0);
  data.forEach(byte => {
    const factor = byte ^ result.shift();
    result.push(0);
    gen.forEach((coef, index) => {
      result[index] ^= gfMul(coef, factor);
    });
  });
  return result;
};

const appendBits = (bits: number[], value: number, length: number) => {
  for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
};

const encodeData = (text: string) => {
  const bytes = Array.from(new TextEncoder().encode(text));
  if (bytes.length > 106) throw new Error('El enlace QR es demasiado largo');

  const bits: number[] = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  bytes.forEach(byte => appendBits(bits, byte, 8));
  appendBits(bits, 0, Math.min(4, DATA_CODEWORDS * 8 - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0));
  }
  for (let pad = 0xec; data.length < DATA_CODEWORDS; pad ^= 0xec ^ 0x11) data.push(pad);
  return data.concat(rsRemainder(data, ECC_CODEWORDS));
};

const set = (m: Cell[][], r: number, c: number, value: boolean) => {
  if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) m[r][c] = value;
};

const drawFinder = (m: Cell[][], row: number, col: number) => {
  for (let r = -1; r <= 7; r += 1) {
    for (let c = -1; c <= 7; c += 1) {
      const rr = row + r;
      const cc = col + c;
      const inCore = r >= 0 && r <= 6 && c >= 0 && c <= 6;
      const dark = inCore && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
      set(m, rr, cc, dark);
    }
  }
};

const drawAlignment = (m: Cell[][], row: number, col: number) => {
  for (let r = -2; r <= 2; r += 1) {
    for (let c = -2; c <= 2; c += 1) {
      set(m, row + r, col + c, Math.max(Math.abs(r), Math.abs(c)) !== 1);
    }
  }
};

const formatBits = (mask: number) => {
  let data = (0b01 << 3) | mask;
  let rem = data << 10;
  const poly = 0x537;
  for (let i = 14; i >= 10; i -= 1) {
    if (((rem >>> i) & 1) !== 0) rem ^= poly << (i - 10);
  }
  return ((data << 10) | rem) ^ 0x5412;
};

export const makeQrMatrix = (text: string) => {
  const matrix: Cell[][] = Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null));
  drawFinder(matrix, 0, 0);
  drawFinder(matrix, 0, SIZE - 7);
  drawFinder(matrix, SIZE - 7, 0);
  drawAlignment(matrix, 30, 30);

  for (let i = 8; i < SIZE - 8; i += 1) {
    set(matrix, 6, i, i % 2 === 0);
    set(matrix, i, 6, i % 2 === 0);
  }
  set(matrix, 4 * VERSION + 9, 8, true);

  const codewords = encodeData(text);
  const bits = codewords.flatMap(byte => Array.from({ length: 8 }, (_, i) => (byte >>> (7 - i)) & 1));
  let bitIndex = 0;
  let upward = true;
  for (let col = SIZE - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (let i = 0; i < SIZE; i += 1) {
      const row = upward ? SIZE - 1 - i : i;
      for (let j = 0; j < 2; j += 1) {
        const c = col - j;
        if (matrix[row][c] === null) {
          const raw = bitIndex < bits.length ? bits[bitIndex] === 1 : false;
          matrix[row][c] = raw !== ((row + c) % 2 === 0);
          bitIndex += 1;
        }
      }
    }
    upward = !upward;
  }

  const fmt = formatBits(0);
  for (let i = 0; i <= 5; i += 1) set(matrix, 8, i, ((fmt >>> i) & 1) !== 0);
  set(matrix, 8, 7, ((fmt >>> 6) & 1) !== 0);
  set(matrix, 8, 8, ((fmt >>> 7) & 1) !== 0);
  set(matrix, 7, 8, ((fmt >>> 8) & 1) !== 0);
  for (let i = 9; i < 15; i += 1) set(matrix, 14 - i, 8, ((fmt >>> i) & 1) !== 0);
  for (let i = 0; i < 8; i += 1) set(matrix, SIZE - 1 - i, 8, ((fmt >>> i) & 1) !== 0);
  for (let i = 8; i < 15; i += 1) set(matrix, 8, SIZE - 15 + i, ((fmt >>> i) & 1) !== 0);

  return matrix.map(row => row.map(Boolean));
};
