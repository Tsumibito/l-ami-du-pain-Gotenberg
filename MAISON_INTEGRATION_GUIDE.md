# Maison Integration Guide for PDF Service

## 🎯 Overview

This guide explains how to integrate Maison functionality into the PDF generation service for L'ami du Pain.

## 📋 What is Maison?

Maison is a special product variant system:
- **Base Product**: Mini Croissant (ID: `d78736b8-954a-4679-a9d4-309f4098fc5f`)
- **Special Clients**: 3 specific clients receive Maison variant
- **Visual Highlight**: Orange color (#FB923C) with "Maison" label

## 🔄 Data Flow

1. **Frontend** detects Maison clients via configuration
2. **API Payload** includes Maison metadata and formatted data
3. **PDF Service** receives enriched data with Maison information
4. **PDF Template** renders Maison quantities with special formatting

## 📊 Incoming Data Structure

### Request Endpoint
```
POST /api/pdf/gotenberg/preparation
```

### Maison Configuration (`meta.maisonConfig`)
```json
{
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
```

### Enhanced Product Data
```json
{
  "produit_id": "d78736b8-954a-4679-a9d4-309f4098fc5f",
  "produit_nom": "Mini Croissant",
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
        "is_maison": true,
        "quantite_formatted": "12 (Maison)"
      },
      {
        "client_id": "other-client-id",
        "client_nom": "Other Client",
        "quantite": 3,
        "is_maison": false,
        "quantite_formatted": "3"
      }
    ]
  }
}
```

## 🎨 Required PDF Template Changes

### 1. CSS Styles
These CSS classes are already added to the template:

```css
.maison-text {
  color: #FB923C;
  font-weight: 600;
}

.maison-badge {
  background-color: #FB923C;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.8em;
  font-weight: 600;
}

.maison-total {
  color: #FB923C;
  font-size: 0.9em;
  margin-top: 2px;
}

.maison-small {
  color: #FB923C;
  font-size: 0.8em;
  font-weight: normal;
}

.flex-col {
  display: flex;
  flex-direction: column;
  align-items: center;
}
```

### 2. Main Product Table
The template has been updated to handle Maison data:

```html
<!-- For each product row -->
{{#products}}
<tr>
  <td>{{produit_nom}}</td>
  
  <!-- Dynamic delivery type columns -->
  {{#deliveryValues}}
  <td class="quantity">
    <div class="flex-col">
      <span>{{value}}</span>
      {{#if maisonCount}}
      <span class="maison-total">dont {{maisonCount}} Maison</span>
      {{/if}}
    </div>
  </td>
  {{/deliveryValues}}
  
  <!-- Total column -->
  <td class="quantity">
    <div class="flex-col">
      <span>{{total_all}}</span>
      {{#if maisonTotal}}
      <span class="maison-total">dont {{maisonTotal}} Maison</span>
      {{/if}}
    </div>
  </td>
</tr>

<!-- Client details rows -->
{{#details}}
{{#each this}}
<tr>
  <td style="padding-left: 24px; font-size: 9pt; color: #666;">{{client_nom}}</td>
  {{#each ../../deliveryValues}}
  <td class="quantity" style="font-size: 9pt;">
    {{#if is_maison}}
    <div class="flex-col">
      <span class="maison-text">{{quantite}}</span>
      <span class="maison-small">Maison</span>
    </div>
    {{else}}
    <span>{{quantite}}</span>
    {{/if}}
  </td>
  {{/each}}
  <td class="quantity" style="font-size: 9pt;">
    {{#if is_maison}}
    <div class="flex-col">
      <span class="maison-text">{{quantite}}</span>
      <span class="maison-small">Maison</span>
    </div>
    {{else}}
    <span>{{quantite}}</span>
    {{/if}}
  </td>
</tr>
{{/each}}
{{/details}}
{{/products}}
```

### 3. Backend Processing
The preparation.ts endpoint processes Maison data:

```javascript
// Maison counts are pre-computed in deliveryValues
const deliveryValues = meta.deliveryTypes.map((type: any) => ({
  id: type.id,
  value: product.totals?.[type.id] || 0,
  maisonCount: product.details?.[type.id]?.filter((item: any) => item.is_maison)
    .reduce((sum: number, item: any) => sum + Number(item.quantite || 0), 0) || 0
}));

// Maison total is preserved
return {
  ...product,
  deliveryValues,
  maisonTotal: product.maison_total || 0
};
```

## 🧪 Testing Data

Use this test payload to verify Maison integration:

```json
{
  "meta": {
    "title": "Fiche de Préparation des Commandes",
    "selectedDate": "2025-11-04",
    "selectedDateFormatted": "mardi 4 novembre 2025",
    "deliveryTypes": [
      { "id": "livraison-matin", "nom": "Tournée du matin" },
      { "id": "livraison-soir", "nom": "Tournée du soir" }
    ],
    "maisonConfig": {
      "baseProductId": "d78736b8-954a-4679-a9d4-309f4098fc5f",
      "baseProductName": "Mini Croissant",
      "maisonClients": [
        { "id": "f6ed5b05-341f-48d1-a3ea-7ce179a73a1c", "nom": "Le Saint-Nicolas" }
      ],
      "visualConfig": {
        "color": "#FB923C",
        "label": "Maison"
      }
    }
  },
  "products": [
    {
      "produit_id": "d78736b8-954a-4679-a9d4-309f4098fc5f",
      "produit_nom": "Mini Croissant",
      "total_all": 15,
      "totals": {
        "livraison-matin": 12,
        "livraison-soir": 3
      },
      "maison_total": 12,
      "details": {
        "livraison-matin": [
          {
            "client_id": "f6ed5b05-341f-48d1-a3ea-7ce179a73a1c",
            "client_nom": "Le Saint-Nicolas",
            "quantite": 12,
            "is_maison": true,
            "quantite_formatted": "12 (Maison)"
          }
        ],
        "livraison-soir": [
          {
            "client_id": "other-client-id",
            "client_nom": "Other Client",
            "quantite": 3,
            "is_maison": false,
            "quantite_formatted": "3"
          }
        ]
      }
    }
  ]
}
```

## 📋 Expected Output

The PDF should show:

### Main Table:
```
| Produit          | Tournée du matin | Tournée du soir | Total    |
|------------------|------------------|-----------------|----------|
| Mini Croissant   | 12               | 3               | 15       |
|                  | dont 12 Maison   |                 | dont 12 Maison |
```

### Client Details:
```
Le Saint-Nicolas  12
                  Maison
Other Client       3
```

## 🔍 Implementation Checklist

- [x] Add CSS styles for Maison elements
- [x] Update table template to handle Maison data
- [x] Pre-compute Maison values in backend
- [x] Test with sample payload above
- [x] Verify orange color (#FB923C) is applied correctly
- [x] Ensure "Maison" label appears in right places
- [x] Test that non-Maison products are unaffected

## 🚨 Important Notes

1. **Only Mini Croissant**: Maison logic applies only to product with ID `d78736b8-954a-4679-a9d4-309f4098fc5f` 
2. **Specific Clients**: Only the 3 clients listed in `maisonConfig.maisonClients` 
3. **Color Consistency**: Use exactly `#FB923C` (orange-400) for consistency
4. **Backward Compatibility**: Changes should not break existing PDF generation for non-Maison data
5. **Data Processing**: Maison counts are pre-computed in backend for template simplicity

## 📞 Support

If you have questions about Maison integration:
- Check the payload structure in this guide
- Test with the provided sample data
- Review the preparation.ts endpoint implementation
- Check the template updates in preparation.html
