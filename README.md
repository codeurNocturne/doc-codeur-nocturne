# Codeur Nocturne · le guide

Page de téléchargement du guide annoncé dans la vidéo « 3 erreurs du vibe coding ».
En ligne : https://doc-codeur-nocturne.vercel.app

Site statique : HTML, CSS et JavaScript, sans framework, sans dépendance, sans cookie ni traqueur.

## Contenu

| Chemin | Rôle |
| --- | --- |
| `index.html` | La page |
| `404.html` | Page « introuvable » |
| `vercel.json` | En-têtes de sécurité HTTP et cache |
| `assets/css/site.css` | Styles |
| `assets/js/site.js` | Liseuse, erreurs interactives, copie du lien |
| `assets/fonts/` | Montserrat, JetBrains Mono, Anton (WOFF2 allégés, licence OFL) |
| `assets/img/` | Photo, couverture, aperçus de chapitres |
| `assets/pages/` | Les 45 pages du guide en WebP, pour la lecture dans la page |
| `guide/Guide-Complet-Backend-Laravel.pdf` | Le guide, identique à l'original |
| `og.jpg` | Image affichée quand le lien est partagé |

## Déploiement

Hébergé sur Vercel, sans étape de construction : le dossier est servi tel quel.

```sh
vercel deploy --prod
```

## Sécurité

- Aucun serveur, aucun formulaire, aucune base de données : il n'y a rien à injecter ni à voler.
- En-têtes HTTP (`vercel.json`) : CSP stricte, HSTS, `X-Frame-Options: DENY` et `frame-ancestors 'none'` contre le clickjacking, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`.
- La CSP n'autorise que les fichiers du site : aucun script en ligne, aucun script tiers, aucune connexion réseau depuis la page.
- Trusted Types activés : le code ne peut pas injecter de HTML, ce qui ferme la porte aux failles XSS.
- Tout est hébergé ici : pas de CDN, pas de Google Fonts, donc aucun risque venant d'un service tiers.
- L'empreinte SHA-256 du PDF est publiée sur la page : chacun peut vérifier que le fichier n'a pas été modifié.

Le point d'entrée réel d'une attaque, ce sont les comptes : double authentification activée sur GitHub et sur Vercel, branche `main` protégée.

## Mettre à jour le guide

Les scripts sont dans `tools/scripts/` du dossier de travail (hors du dépôt) :

```sh
# copie le PDF tel quel, rend les pages et les aperçus en PNG
tools/venv/Scripts/python.exe -I tools/scripts/site_pdf.py <guide.pdf> site <dossier_png>
# puis encoder chaque PNG en WebP sans perte
ffmpeg -i p01.png -c:v libwebp -lossless 1 -compression_level 6 site/assets/pages/p01.webp
```

Le script affiche la nouvelle empreinte SHA-256 : la reporter dans `index.html` (bloc « Vérifier le fichier »).
Si le nombre de pages change, mettre à jour `PAGES` dans `assets/js/site.js` et les numéros de page dans `index.html`.
