import { useEffect, useMemo, useState } from 'react'
import { chargerEvenements, type Evenement } from './feuille.ts'
import { cleJour, grilleDuMois, parJour } from './mois.ts'
import './App.css'

const LOCALE = 'fr-CA'

const JOURS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']

const titreMois = new Intl.DateTimeFormat(LOCALE, {
  month: 'long',
  year: 'numeric',
})
const heure = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
})
const dateLongue = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

function Details({ jour, evenements }: { jour: Date; evenements: Evenement[] }) {
  return (
    <aside className="details">
      <h2>{dateLongue.format(jour)}</h2>
      {evenements.length === 0 && <p className="vide">Aucun événement.</p>}
      {evenements.map((evenement, i) => (
        <article key={i}>
          <h3>{evenement.titre}</h3>
          <p className="quand">
            {evenement.avecHeure ? heure.format(evenement.debut) : 'Toute la journée'}
            {evenement.fin && evenement.avecHeure && ` – ${heure.format(evenement.fin)}`}
          </p>
          {evenement.lieu && <p className="lieu">{evenement.lieu}</p>}
          {evenement.description && <p>{evenement.description}</p>}
          {evenement.lien && (
            <p>
              <a href={evenement.lien} target="_blank" rel="noreferrer">
                Plus de détails
              </a>
            </p>
          )}
        </article>
      ))}
    </aside>
  )
}

export default function App() {
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(true)
  const [curseur, setCurseur] = useState(() => {
    const maintenant = new Date()
    return new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
  })
  const [selection, setSelection] = useState<Date | null>(null)

  useEffect(() => {
    chargerEvenements()
      .then(setEvenements)
      .catch((e) => {
        console.error('Impossible de charger le calendrier:', e)
        setErreur('Impossible de charger le calendrier.')
      })
      .finally(() => setChargement(false))
  }, [])

  const jours = useMemo(() => parJour(evenements), [evenements])
  const grille = useMemo(
    () => grilleDuMois(curseur.getFullYear(), curseur.getMonth()),
    [curseur],
  )

  const deplacerMois = (delta: number) => {
    setSelection(null)
    setCurseur(new Date(curseur.getFullYear(), curseur.getMonth() + delta, 1))
  }

  const aujourdhui = cleJour(new Date())

  return (
    <div className="app">
      <header>
        <button onClick={() => deplacerMois(-1)} aria-label="Mois précédent">
          ‹
        </button>
        <h1>{titreMois.format(curseur)}</h1>
        <button onClick={() => deplacerMois(1)} aria-label="Mois suivant">
          ›
        </button>
      </header>

      {chargement && <p className="etat">Chargement…</p>}
      {erreur && <p className="etat erreur">{erreur}</p>}

      <div className="calendrier">
        <div className="grille">
          {JOURS.map((jour) => (
            <div key={jour} className="entete">
              {jour}
            </div>
          ))}
          {grille.map((jour) => {
            const cle = cleJour(jour)
            const duJour = jours.get(cle) ?? []
            const classes = [
              'case',
              jour.getMonth() === curseur.getMonth() ? '' : 'hors-mois',
              cle === aujourdhui ? 'aujourdhui' : '',
              selection && cle === cleJour(selection) ? 'choisie' : '',
            ]
            return (
              <button
                key={cle}
                className={classes.filter(Boolean).join(' ')}
                onClick={() => setSelection(jour)}
              >
                <span className="numero">{jour.getDate()}</span>
                {duJour.slice(0, 3).map((evenement, i) => (
                  <span key={i} className="pastille">
                    {evenement.titre}
                  </span>
                ))}
                {duJour.length > 3 && (
                  <span className="reste">+{duJour.length - 3}</span>
                )}
              </button>
            )
          })}
        </div>

        {selection && (
          <Details
            jour={selection}
            evenements={jours.get(cleJour(selection)) ?? []}
          />
        )}
      </div>
    </div>
  )
}
