import type { Evenement } from './feuille.ts'

/** Clé de regroupement par jour, en heure locale : « 2026-09-20 ». */
export function cleJour(date: Date): string {
  const mois = `${date.getMonth() + 1}`.padStart(2, '0')
  const jour = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${mois}-${jour}`
}

/**
 * Les 42 cases de la grille du mois, du lundi précédant le 1er au dimanche
 * suivant le dernier jour.
 */
export function grilleDuMois(annee: number, mois: number): Date[] {
  const premier = new Date(annee, mois, 1)
  // getDay() : 0 = dimanche. La semaine commence le lundi ici.
  const decalage = (premier.getDay() + 6) % 7

  return Array.from(
    { length: 42 },
    (_, i) => new Date(annee, mois, 1 - decalage + i),
  )
}

/**
 * Regroupe les événements par jour. Un événement de plusieurs jours apparaît
 * dans chacune de ses journées.
 */
export function parJour(evenements: Evenement[]): Map<string, Evenement[]> {
  const jours = new Map<string, Evenement[]>()

  for (const evenement of evenements) {
    const dernier = evenement.fin ?? evenement.debut
    const curseur = new Date(
      evenement.debut.getFullYear(),
      evenement.debut.getMonth(),
      evenement.debut.getDate(),
    )

    // ponytail: borné à 366 jours, les événements plus longs sont tronqués.
    for (let i = 0; curseur <= dernier && i < 366; i++) {
      const cle = cleJour(curseur)
      jours.set(cle, [...(jours.get(cle) ?? []), evenement])
      curseur.setDate(curseur.getDate() + 1)
    }
  }

  return jours
}
