# Boîte à outils accessibilité (Neodyr)

Une boîte à outils d'accessibilité numérique, gratuite, qui fonctionne entièrement dans le navigateur. Aucune donnée n'est envoyée. Chaque outil est rattaché aux critères RGAA et WCAG qu'il aide à traiter.

L'objectif est qu'elle soit elle-même exemplaire en accessibilité, puisque c'est un outil de Neodyr, cabinet d'audit RGAA.

## Outils disponibles

Colorimètre. Mesure le contraste d'un duo de couleurs selon WCAG 2.1 et selon APCA, propose des couleurs valides proches en cas d'échec, et simule trois formes de daltonisme. Critères visés : RGAA 3.2 (WCAG 1.4.3), RGAA 3.3 (WCAG 1.4.11), WCAG 1.4.6, RGAA 3.1 (WCAG 1.4.1).

Convertisseur de couleurs. Convertit instantanément entre HEX, RGB, HSL et OKLCH. Outil support pour préparer des couleurs contrastées (WCAG 1.4.3 et 1.4.11).

## Outils à venir

Les fiches et les critères de ces outils sont déjà en place dans la navigation ; leur interface arrivera par la suite.

1. Audit express HTML. Hiérarchie des titres et images sans alternative, à partir de HTML collé. Critères RGAA 9.1 (WCAG 1.3.1) et RGAA 1.1 (WCAG 1.1.1).
2. Simulateur daltonisme sur image. Critère RGAA 3.1 (WCAG 1.4.1).
3. Cibles tactiles. Taille minimale des zones cliquables. Critères WCAG 2.5.8 et 2.5.5.
4. Ordre de lecture et focus. Ordre du DOM et ordre de tabulation d'une page. Critères RGAA 12.8 (WCAG 2.4.3) et RGAA 10.3 (WCAG 1.3.2).

## Technique

Le projet est sans build : HTML, CSS et JavaScript classique. Le fichier index.html charge le squelette (assets/app.js, assets/app.css) puis chaque outil (tools/*.js).

Chaque outil s'enregistre via Toolbox.register avec un objet contenant id, name, tagline, icon, criteres, howto et mount(root). Ajouter un outil revient donc à créer un fichier dans tools/ et une ligne script dans index.html.

Le dépôt est déployable tel quel sur GitHub Pages ; le fichier .nojekyll est présent.

## Accessibilité du projet

Lien d'évitement, landmarks, navigation au clavier, gestion du focus au changement d'outil, région d'annonces aria-live, thème clair, sombre ou système, respect de prefers-reduced-motion, contrastes vérifiés avec axe.

## Licence

MIT. Copyright 2026 Neodyr.
