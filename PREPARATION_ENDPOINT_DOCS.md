# Fiche de Préparation des Commandes - Documentation

## Overview

Новый эндпоинт для генерации PDF документа "Fiche de préparation des commandes" - суммарного списка продуктов, которые нужно приготовить согласно заказам на определенную дату.

## Endpoint

**URL**: `/api/pdf/gotenberg/preparation`  
**Méthode**: `POST`  
**Authentification**: Bearer token requis  
**Response**: PDF file (application/pdf)

## Structure des données

### Meta (Métadonnées)

```json
{
  "meta": {
    "title": "Fiche de Préparation des Commandes",
    "printedAt": "2025-11-03T15:45:00.000Z",
    "selectedDate": "2025-11-03",
    "selectedDateFormatted": "dimanche 3 novembre 2025",
    "sortMode": {
      "type": "alphabetical"
    },
    "deliveryTypes": [
      {
        "id": "livraison",
        "nom": "Livraison",
        "description": "Livraison standard"
      }
    ]
  }
}
```

### Maison Configuration (Optionnel)

Pour le produit Mini Croissant avec variant Maison:

```json
{
  "meta": {
    "title": "Fiche de Préparation des Commandes",
    "printedAt": "2025-11-03T15:45:00.000Z",
    "selectedDate": "2025-11-03",
    "selectedDateFormatted": "dimanche 3 novembre 2025",
    "sortMode": {
      "type": "alphabetical"
    },
    "deliveryTypes": [
      {
        "id": "livraison-matin",
        "nom": "Tournée du matin"
      },
      {
        "id": "livraison-soir", 
        "nom": "Tournée du soir"
      }
    ],
    "maisonConfig": {
      "baseProductId": "d78736b8-954a-4679-a9d4-309f4098fc5f",
      "baseProductName": "Mini Croissant",
      "maisonClients": [
        { "id": "f6ed5b05-341f-48d1-a3ea-7ce179a73a1c", "nom": "Le Saint-Nicolas" },
        { "id": "cd412258-79c6-411d-be08-5b1708a493dd", "nom": "B&B HOTEL La Rochelle Centre" },
        { "id": "159093f0-353f-4102-ad19-8c5e82b6e281", "nom": "Le Masq" }
      ],
      "visualConfig": {
        "color": "#FB923C",
        "label": "Maison"
      }
    }
  }
}
```

### Products (Liste des produits)

```json
{
  "products": [
    {
      "produit_id": "baguette-trad",
      "produit_nom": "Baguette tradition",
      "produit_description": "Baguette de 250g",
      "total_all": 45,
      "totals": {
        "livraison": 30,
        "emporter": 15
      }
    },
    {
      "produit_id": "d78736b8-954a-4679-a9d4-309f4098fc5f",
      "produit_nom": "Mini Croissant",
      "produit_description": "Mini croissant beurre",
      "total_all": 25,
      "totals": {
        "livraison-matin": 15,
        "livraison-soir": 10
      },
      "maison_total": 12,
      "details": {
        "livraison-matin": [
          {
            "client_id": "f6ed5b05-341f-48d1-a3ea-7ce179a73a1c",
            "client_nom": "Le Saint-Nicolas",
            "quantite": 12,
            "is_maison": true
          },
          {
            "client_id": "other-client-id",
            "client_nom": "Other Client", 
            "quantite": 3,
            "is_maison": false
          }
        ],
        "livraison-soir": [
          {
            "client_id": "cd412258-79c6-411d-be08-5b1708a493dd",
            "client_nom": "B&B HOTEL La Rochelle Centre",
            "quantite": 10,
            "is_maison": false
          }
        ]
      }
    }
  ]
}
```

## Champs détaillés

### meta
- **title** (string, requis): Titre principal du document
- **printedAt** (string, ISO datetime, optionnel): Date/heure d'impression
- **selectedDate** (string, YYYY-MM-DD, requis): Date des commandes
- **selectedDateFormatted** (string, requis): Date formatée en français
- **sortMode** (object, requis): Mode de tri des produits
  - **type** (string): "alphabetical", "total", ou "type"
- **deliveryTypes** (array, requis): Types de livraison à afficher
- **maisonConfig** (object, optionnel): Configuration Maison pour Mini Croissant
  - **baseProductId** (string): ID du produit de base (Mini Croissant)
  - **baseProductName** (string): Nom du produit de base
  - **maisonClients** (array): Liste des clients Maison
  - **visualConfig** (object): Configuration visuelle (couleur, label)

### products
- **produit_id** (string, requis): Identifiant unique du produit
- **produit_nom** (string, requis): Nom du produit
- **produit_description** (string, optionnel): Description courante
- **total_all** (number, requis): Quantité totale toutes livraisons
- **totals** (object, requis): Quantités par type de livraison
- **maison_total** (number, optionnel): Quantité totale Maison
- **details** (object, optionnel): Détails par client et type livraison
  - **[type_id]** (array): Liste des commandes pour ce type
    - **client_id** (string): ID du client
    - **client_nom** (string): Nom du client
    - **quantite** (number): Quantité commandée
    - **is_maison** (boolean): True si commande Maison

## Comportement du template

### Mise en page
- Format A4 portrait avec marges de 15mm
- En-tête avec logo L'ami du Pain
- Tableau des produits avec colonnes dynamiques
- Pied de page avec date d'impression

### Tri des produits
- **Alphabétique**: Tri par nom de produit A→Z
- **Par quantité**: Tri par total décroissant  
- **Par type**: Tri par quantité d'un type spécifique

### Affichage Maison
- **Quantités Maison**: Pour Mini Croissant, affiche "dont X Maison" sous chaque quantité
- **Couleur**: Texte Maison en orange (#FB923C) 
- **Détails clients**: Liste les clients Maison avec quantités spécifiques
- **Total Maison**: Affiche le total Maison dans la colonne Total
- **Produits concernés**: Uniquement Mini Croissant (ID: d78736b8-954a-4679-a9d4-309f4098fc5f)

### Avertissement
Un encadré jaune rappelle que le document est un instantané et que de nouvelles commandes peuvent être ajoutées.

## Exemple d'utilisation

### cURL
```bash
curl -X POST http://localhost:3001/api/pdf/gotenberg/preparation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @preparation-example.json \
  --output fiche-preparation.pdf
```

### JavaScript
```javascript
const response = await fetch('/api/pdf/gotenberg/preparation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(preparationData)
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'fiche-preparation.pdf';
a.click();
```

## Fichiers créés/modifiés

1. **Route**: `/src/routes/preparation.ts` - Nouveau routeur Express
2. **Template**: `/templates/preparation.html` - Template HTML Mustache
3. **Utils**: `/src/utils/pagination.ts` - Ajout fonction `sortProducts()`
4. **Index**: `/src/index.ts` - Intégration du nouveau routeur
5. **Documentation**: `/API_DOCS.md` - Documentation complète
6. **Example**: `/examples/preparation-example.json` - Données de test

## Test

Pour tester le nouvel endpoint:

```bash
# Depuis le répertoire pdf-templates
npm run build
npm start

# Dans un autre terminal
curl -X POST http://localhost:3001/api/pdf/gotenberg/preparation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d @examples/preparation-example.json \
  --output test-preparation.pdf
```

Le PDF généré contiendra la liste des produits à préparer avec les quantités par type de livraison, triée selon le mode spécifié.
