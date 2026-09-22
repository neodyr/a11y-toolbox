# Boîte à outils accessibilité — Neodyr

Une boîte à outils d'**accessibilité numérique**, gratuite, qui fonctionne
entièrement dans le navigateur (aucune donnée envoyée). Chaque outil est
rattaché aux **critères RGAA / WCAG** qu'il aide à traiter.

Objectif : être elle-même **exemplaire en accessibilité** — c'est un outil de
Neodyr, cabinet d'audit RGAA.

## Outils

| Outil | Rôle | Critères visés |
|-------|------|----------------|
| **Colorimètre** | Contraste WCAG 2.1 + APCA, suggestions de couleurs valides, simulation daltonisme | RGAA 3.2 (1.4.3), 3.3 (1.4.11), 1.4.6, 3.1 (1.4.1) |
| **Convertisseur** | HEX ↔ RGB ↔ HSL ↔ OKLCH | support 1.4.3 / 1.4.11 |
| _Audit express HTML_ | Hiérarchie des titres, images sans alternative | 9.1 (1.3.1), 1.1 (1.1.1) — _à venir_ |
| _Simulateur daltonisme_ | Voir une image en protanopie / deutéranopie / tritanopie | 3.1 (1.4.1) — _à venir_ |
| _Cibles tactiles_ | Taille minimale des zones cliquables | 2.5.8 / 2.5.5 — _à venir_ |
| _Ordre de lecture & focus_ | Ordre du DOM et de tabulation d'une page | 12.8 (2.4.3), 10.3 (1.3.2) — _à venir_ |

## Technique

- **Sans build** : HTML + CSS + JavaScript classique. `index.html` charge le
  squelette (`assets/app.js`, `assets/app.css`) puis chaque outil (`tools/*.js`).
- Chaque outil s'enregistre via `Toolbox.register({ id, name, tagline, icon,
  criteres, howto, mount(root) })`. Ajouter un outil = un fichier dans `tools/`
  + une ligne `<script>` dans `index.html`.
- Déployable tel quel sur **GitHub Pages** (`.nojekyll` présent).

## Accessibilité du projet

Lien d'évitement, landmarks, navigation au clavier, gestion du focus au
changement d'outil, région d'annonces (`aria-live`), thème clair/sombre/système,
respect de `prefers-reduced-motion`, contrastes vérifiés.

## Licence

MIT — © 2026 Neodyr.
