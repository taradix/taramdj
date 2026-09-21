// Lecture des événements depuis le tableur Google public, servi par nginx
// sous /evenements.csv (voir frontend/nginx.conf.template).
//
// Les heures du tableur sont des heures « murales » : elles sont affichées
// telles quelles, sans conversion de fuseau horaire. C'est ce que veut une
// personne qui écrit « 19:00 » dans la colonne Début.

export type Evenement = {
  debut: Date
  fin: Date | null
  avecHeure: boolean
  titre: string
  lieu: string
  lien: string
  description: string
}

/** Découpe un CSV (RFC 4180) : guillemets, virgules et sauts de ligne inclus. */
export function analyserCsv(texte: string): string[][] {
  const lignes: string[][] = []
  let ligne: string[] = []
  let champ = ''
  let dansGuillemets = false

  for (let i = 0; i < texte.length; i++) {
    const c = texte[i]

    if (dansGuillemets) {
      if (c !== '"') {
        champ += c
      } else if (texte[i + 1] === '"') {
        champ += '"'
        i++
      } else {
        dansGuillemets = false
      }
      continue
    }

    if (c === '"') {
      dansGuillemets = true
    } else if (c === ',') {
      ligne.push(champ)
      champ = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texte[i + 1] === '\n') i++
      ligne.push(champ)
      champ = ''
      lignes.push(ligne)
      ligne = []
    } else {
      champ += c
    }
  }

  if (champ !== '' || ligne.length) {
    ligne.push(champ)
    lignes.push(ligne)
  }

  return lignes
}

/** « Début » -> « debut » : les en-têtes sont écrits par des humains. */
function normaliser(entete: string): string {
  return entete
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
}

const DATE_HEURE = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2})[:h](\d{2}))?/

function analyserDate(valeur: string): { date: Date; avecHeure: boolean } | null {
  const m = DATE_HEURE.exec(valeur.trim())
  if (!m) return null

  const [, a, mo, j, h, mi] = m
  const date = new Date(+a, +mo - 1, +j, h ? +h : 0, mi ? +mi : 0)
  // Rejette les dates impossibles (2026-02-31 devient le 3 mars sinon).
  if (date.getMonth() !== +mo - 1 || date.getDate() !== +j) return null

  return { date, avecHeure: h !== undefined }
}

/** Colonnes attendues : Début, Fin, Titre, Lieu, Lien, Description. */
export function analyserEvenements(csv: string): Evenement[] {
  const [entetes, ...rangees] = analyserCsv(csv)
  if (!entetes) return []

  const colonne = Object.fromEntries(entetes.map((e, i) => [normaliser(e), i]))
  const champ = (rangee: string[], nom: string) =>
    (rangee[colonne[nom]] ?? '').trim()

  const evenements: Evenement[] = []
  for (const rangee of rangees) {
    const debut = analyserDate(champ(rangee, 'debut'))
    const titre = champ(rangee, 'titre')
    // Une rangée sans date ou sans titre est une rangée vide ou en chantier.
    if (!debut || !titre) continue

    evenements.push({
      debut: debut.date,
      fin: analyserDate(champ(rangee, 'fin'))?.date ?? null,
      avecHeure: debut.avecHeure,
      titre,
      lieu: champ(rangee, 'lieu'),
      lien: champ(rangee, 'lien'),
      description: champ(rangee, 'description'),
    })
  }

  return evenements.sort((a, b) => +a.debut - +b.debut)
}

export async function chargerEvenements(): Promise<Evenement[]> {
  const reponse = await fetch('/evenements.csv')
  if (!reponse.ok) throw new Error(`Tableur inaccessible (${reponse.status})`)
  return analyserEvenements(await reponse.text())
}
