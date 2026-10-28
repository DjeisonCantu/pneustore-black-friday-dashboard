// Gerador pseudoaleatório determinístico (mulberry32) para que os dados
// fictícios sejam estáveis entre renderizações, mas variem com os filtros.
// Isso evita números "decorativos": mudar período/dispositivo muda a semente
// e, portanto, os valores exibidos.

export function hashStringToSeed(value: string): () => number {
  let h = 1779033703 ^ value.length
  for (let i = 0; i < value.length; i++) {
    h = Math.imul(h ^ value.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h ^= h >>> 16) >>> 0
  }
}

export function mulberry32(seed: number) {
  let a = seed
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createRng(key: string) {
  const seedFn = hashStringToSeed(key)
  return mulberry32(seedFn())
}

export function rangeNoise(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min)
}
