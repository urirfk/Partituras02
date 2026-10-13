import type { ChordNotation } from '../../types/scoreConfig'

const LATIN_TO_AMERICAN_ROOTS: Record<string, string> = {
  Do: 'C',
  Re: 'D',
  Mi: 'E',
  Fa: 'F',
  Sol: 'G',
  La: 'A',
  Si: 'B',
}

const AMERICAN_TO_LATIN_ROOTS: Record<string, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
}

export function formatChordText(
  fullText: string,
  root: string,
  notation: ChordNotation = 'latin',
): string {
  if (notation === 'american') {
    // If root is Latin (e.g. "Si", "Do", "Sol"), convert to American ("B", "C", "G")
    const americanRoot = LATIN_TO_AMERICAN_ROOTS[root]
    if (americanRoot && fullText.startsWith(root)) {
      return americanRoot + fullText.slice(root.length)
    }
  } else if (notation === 'latin') {
    // If root is American (e.g. "B", "C", "G"), convert to Latin ("Si", "Do", "Sol")
    const latinRoot = AMERICAN_TO_LATIN_ROOTS[root]
    if (latinRoot && fullText.startsWith(root)) {
      return latinRoot + fullText.slice(root.length)
    }
  }

  return fullText
}
