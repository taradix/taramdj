import { describe, expect, it } from 'vitest'
import { analyserCsv, analyserEvenements } from './feuille.ts'
import { cleJour, grilleDuMois, parJour } from './mois.ts'

describe('analyserCsv', () => {
  it('garde les virgules et les sauts de ligne entre guillemets', () => {
    const csv = 'a,b\n"un, deux","trois\nquatre"\n'
    expect(analyserCsv(csv)).toEqual([
      ['a', 'b'],
      ['un, deux', 'trois\nquatre'],
    ])
  })

  it('décode les guillemets doublés', () => {
    expect(analyserCsv('"dit ""bonjour"""')).toEqual([['dit "bonjour"']])
  })
})

describe('analyserEvenements', () => {
  const csv = [
    'Début,Fin,Titre,Lieu,Lien,Description',
    '2026-10-02 19:00,2026-10-02 22:00,Soirée cinéma,Salle A,https://ex.ca,"Pizza, maïs et film"',
    '2026-10-01,,Journée portes ouvertes,,,',
    'pas une date,,Ignoré,,,',
    '2026-10-05,,,,,',
    '',
  ].join('\n')

  const evenements = analyserEvenements(csv)

  it('ignore les rangées sans date ou sans titre', () => {
    expect(evenements.map((e) => e.titre)).toEqual([
      'Journée portes ouvertes',
      'Soirée cinéma',
    ])
  })

  it('lit les en-têtes accentués et les champs entre guillemets', () => {
    const cinema = evenements[1]
    expect(cinema.description).toBe('Pizza, maïs et film')
    expect(cinema.lieu).toBe('Salle A')
    expect(cinema.avecHeure).toBe(true)
    expect(cinema.debut.getHours()).toBe(19)
    expect(cinema.fin?.getHours()).toBe(22)
  })

  it('traite une date sans heure comme toute la journée', () => {
    expect(evenements[0].avecHeure).toBe(false)
    expect(evenements[0].fin).toBeNull()
  })

  it('rejette une date impossible', () => {
    expect(analyserEvenements('Début,Titre\n2026-02-31,Test')).toEqual([])
  })
})

describe('grilleDuMois', () => {
  it('commence le lundi précédant le 1er', () => {
    // Le 1er octobre 2026 est un jeudi : la grille commence le lundi 28 sept.
    const grille = grilleDuMois(2026, 9)
    expect(grille).toHaveLength(42)
    expect(cleJour(grille[0])).toBe('2026-09-28')
    expect(cleJour(grille[3])).toBe('2026-10-01')
  })

  it('commence le 1er lui-même quand il tombe un lundi', () => {
    // 1er juin 2026 = lundi.
    expect(cleJour(grilleDuMois(2026, 5)[0])).toBe('2026-06-01')
  })
})

describe('parJour', () => {
  it('répète un événement sur chacune de ses journées', () => {
    const csv = 'Début,Fin,Titre\n2026-10-30,2026-11-01,Camp\n'
    const jours = parJour(analyserEvenements(csv))
    expect([...jours.keys()]).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ])
  })
})
