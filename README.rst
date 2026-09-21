TaraMDJ - Maison des Jeunes
===========================

Calendrier web alimenté par un tableur Google public.

Fonctionnement
--------------

1. Les événements sont saisis dans un tableur Google partagé en lecture.
2. Le nginx du conteneur ``frontend`` expose ce tableur en CSV sous
   ``/evenements.csv`` et garde la réponse en cache 5 minutes.
3. Le navigateur lit ce CSV et dessine la grille du mois.

L'identifiant du tableur ne quitte jamais le serveur, il n'y a ni CORS, ni clé
d'API, et Google reçoit une requête par 5 minutes au lieu d'une par visite.

Le tableur
----------

Un onglet (``SHEET_TAB``, ``Evenements`` par défaut) avec une ligne d'en-tête :

.. list-table::
   :header-rows: 1
   :widths: 15 15 70

   * - Colonne
     - Requise
     - Contenu
   * - ``Début``
     - oui
     - ``AAAA-MM-JJ`` ou ``AAAA-MM-JJ HH:MM``
   * - ``Fin``
     - non
     - même format; vide = événement d'une seule journée
   * - ``Titre``
     - oui
     - nom affiché dans la case du jour
   * - ``Lieu``
     - non
     - affiché dans le panneau de détails
   * - ``Lien``
     - non
     - URL « Plus de détails »
   * - ``Description``
     - non
     - texte libre; les virgules sont permises

Les rangées sans ``Début`` valide ou sans ``Titre`` sont ignorées, ce qui permet
de laisser des brouillons dans le tableur.

**Important** : mettre les colonnes ``Début`` et ``Fin`` en format
*Texte brut* (Format > Nombre > Texte brut), sinon Sheets réécrit les dates.

Les heures sont affichées telles quelles, sans conversion de fuseau horaire :
``19:00`` dans le tableur s'affiche ``19:00``.

Partage du tableur
~~~~~~~~~~~~~~~~~~

Partager > Accès général > « Tous les utilisateurs disposant du lien » >
*Lecteur*. Copier l'identifiant depuis l'URL :

.. code-block::

   https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit

Installation
------------

.. code-block:: sh

   git clone git@github.com:taradix/taramdj.git
   cd taramdj
   git submodule update --init --recursive
   cp .env.example .env
   # renseigner SERVER_HOSTNAME et SHEET_ID
   make deploy

Configuration
-------------

.. list-table::
   :header-rows: 1
   :widths: 25 10 15 50

   * - Variable
     - Requise
     - Défaut
     - Rôle
   * - ``SERVER_HOSTNAME``
     - oui
     - —
     - Nom d'hôte public, aussi le CN du certificat
   * - ``SHEET_ID``
     - oui
     - —
     - Identifiant du tableur Google
   * - ``SHEET_TAB``
     - non
     - ``Evenements``
     - Nom de l'onglet contenant les événements
   * - ``RELOAD_SERVICES``
     - non
     - —
     - Services à recharger après renouvellement du certificat
   * - ``IPV4_NETWORK``
     - non
     - ``172.22.8``
     - Sous-réseau Docker; ne doit pas entrer en conflit avec les autres projets

Commandes
---------

.. code-block:: sh

   make deploy      # déploiement
   make dev         # développement (certificat auto-signé)
   make undeploy    # arrêt
   make check       # lint des fichiers compose
   make test        # tests du frontend
   make clean       # nettoyage des fichiers ignorés

Développement
-------------

.. code-block:: sh

   cd frontend
   npm install
   SHEET_ID=... npm run dev

En développement, Vite relaie lui-même ``/evenements.csv`` vers Google; nginx
n'est pas dans le chemin.

Architecture
------------

.. code-block::

   navigateur
       │  https
       ▼
   nginx (TLS, certificat taracert)
       │  http
       ▼
   frontend (nginx : dist/ + cache du CSV)
       │  https
       ▼
   docs.google.com

Le certificat est géré par le sous-module ``taracert`` (renouvellement Let's
Encrypt, bootstrap auto-signé en développement).

Licence
-------

Voir ``LICENSE.rst``.
