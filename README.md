# PharmaDistrib

## Description
PharmaDistrib est une plateforme web permettant aux pharmaciens de créer et de gérer des commandes groupées de produits pharmaceutiques. Les produits disponibles sont contenus dans des fichiers CSV importés sur la plateforme. Lorsqu'un pharmacien crée une commande, d'autres peuvent ajouter leurs propres besoins sur cette même commande. Une fois celle-ci finalisée, les informations sont centralisées pour permettre une répartition correcte des produits entre les pharmaciens ayant commandé.

## Fonctionnalités
- **Gestion des commandes** : Un pharmacien peut créer une commande et d'autres peuvent y ajouter leurs produits.
- **Suivi des commandes** : Une fois la commande fermée, les informations sur les produits commandés et leurs destinataires sont accessibles.
- **Gestion des produits** : L'administrateur peut ajouter ou supprimer des fichiers CSV pour mettre à jour la liste des produits.
- **Gestion des utilisateurs** : Un administrateur peut gérer les comptes des pharmaciens et surveiller les commandes.

## Technologies utilisées
- **Frontend** : HTML, CSS, JavaScript
- **Backend** : Node.js
- **Base de données** : Better-Sqlite3

## Installation
1. **Cloner le projet**
   ```sh
   git clone https://github.com/votre-utilisateur/PharmaDistrib.git
   cd PharmaDistrib
   ```
2. **Installer les dépendances**
   ```sh
   npm install
   ```
3. **Lancer le serveur**
   ```sh
   node start
   ```

## Utilisation
- Accéder à l'interface via `http://localhost:3000`
- Se connecter en tant que pharmacien pour créer et participer aux commandes.
- Se connecter en tant qu'administrateur pour gérer les commandes et les produits.

## Améliorations futures
- Implémentation d'une authentification sécurisée.
- Ajout d'une base de données pour un stockage plus efficace.
- Intégration d'un tableau de bord statistique pour suivre les commandes.
- Notifications pour informer les pharmaciens des nouvelles commandes disponibles.
- Rendre les pages responsives

## Auteur
Projet développé par MkDriss.

