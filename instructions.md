# PDF-шаблоны для печатных форм

Эта папка предназначена для серверной реализации генерации PDF. Здесь собраны HTML-шаблоны, повторяющие текущие макеты фронтенда, а также инструкции по сопоставлению данных Directus.

## Структура каталога
docs/pdf-templates/ ├─ README.md ← текущий файл с описанием ├─ avis.html ← «Bon de livraison» (многостраничный шаблон) └─ summary.html ← «Feuille de synthèse» (карточки заказов тура)


Все шаблоны используют синтаксис Mustache (`{{variable}}`, `{{#section}}`, `{{/section}}`, `{{^inverse}}`). Для рендера сформируйте объект контекста и прогоните шаблон через любой движок Mustache/Handlebars.

---

## Общие договорённости

1. **Таймзона и формат дат** — `Europe/Paris`. На фронтенде используются функции [formatDateParis](cci:1://file:///Users/al1/windsurf/LADP-Nuxt/components/client/print/AvisDeLivraison.vue:169:0-173:1) и [formatYMD](cci:1://file:///Users/al1/windsurf/LADP-Nuxt/server/api/pdf/avis.get.ts:24:0-34:1) (@components/client/print/AvisDeLivraison.vue#170-184). На сервере необходимо применять аналогичное форматирование.
2. **Логотип** — путь `/ladp_logo.svg` (файл лежит в `public/ladp_logo.svg`). Ссылку оставляем абсолютной.
3. **Комментарии** — только на французском (требование проекта «L’ami du Pain»).
4. **Стили** — инлайн в HTML, чтобы итоговый документ был самодостаточным.

---

## Шаблон `avis.html` (Bon de livraison)

Точно повторяет структуру, формируемую функцией [buildHTML](cci:1://file:///Users/al1/windsurf/LADP-Nuxt/server/api/pdf/avis.get.ts:36:0-210:1) в [/server/api/pdf/avis.get.ts](cci:7://file:///Users/al1/windsurf/LADP-Nuxt/server/api/pdf/avis.get.ts:0:0-0:0) (@server/api/pdf/avis.get.ts#142-210).

### Обязательные данные

| Поле | Источник в Directus | Описание |
| --- | --- | --- |
| `company.name`, `company.address`, `company.siret` | Константы/настройки | Сейчас значения жёстко зашиты в API (@server/api/pdf/avis.get.ts#112-117). |
| `company.phone`, `company.email` | Константы/настройки | Отображаются, если заданы. |
| `order.id` | `commandes.id` | Для внутреннего использования (опционально). |
| `order.numero` | `commandes.numero_de_commande` | Номер заказа. |
| `order.date_created` | `commandes.date_created` | ISO-строка создания (UTC). |
| `order.date_livraison` | `commandes.date_de_livraison_souhaitee` | Желаемая дата доставки (YYYY-MM-DD). |
| `order.type.nom` | `commandes.type_de_livraison.nom` | Название типа доставки. |
| `order.type.description` | `commandes.type_de_livraison.description` | Описание (опционально). |
| `order.besoin_de_cheque` | `commandes.besoin_de_cheque` | Булево значение. |
| `order.commentaire_client` | `commandes.commentaire_client` | Инструкции по доставке. |
| `order.demandes_speciales` | `commandes.demandes_speciales` | Спецзапросы (опционально). |
| `order.client.nom` | `commandes.client.nom_du_client` | Название клиента. |
| `order.client.telephone` | `commandes.client.telephone` | Телефон (опционально). |
| `order.client.site` | `commandes.client.site` | Сайт (опционально). |
| `order.juridique.*` | `commandes.details_juridiques` | Поля raison_sociale, forme_juridique, siren, siret, code_naf, tva_intracom. |
| `order.client_adresse.*` | `clients_adresses` (первая запись) либо `details_juridiques.adresse_siege` | Блок адреса клиента. |
| `pages[*].first_page` | Расчёт на сервере | `true` для первой страницы, чтобы выводить сетку с метаданными. |
| `pages[*].lines[*]` | `lignes_commande` + `produit` | Каждая строка содержит `num`, `produit_nom`, `quantite`, `tranche` (булево). |

### Постраничное деление

- В текущей реализации используется размер страницы 12 строк (`perPage = 12`, @server/api/pdf/avis.get.ts#177-190).
- Для длинных "Demandes spéciales" рекомендуется динамически уменьшать лимит строк на первой странице.
- Шапка таблицы и футер повторяются автоматически на каждой странице.

---

## Шаблон `summary.html` (Feuille de synthèse)

Основан на HTML из `/api/pdf/summary` (@server/api/pdf/summary.get.ts#22-102). Отображает карточки заказов для одного типа доставки.

### Обязательные данные

| Поле | Источник в Directus | Описание |
| --- | --- | --- |
| `meta.date` | Параметр `date` | Дата тура (YYYY-MM-DD). |
| `meta.date_formatted` | Форматирование на сервере | Дата в читаемом виде (weekday, day, month, year). |
| `tour.type.nom` | `types_de_livraison.nom` | Название тура. |
| `tour.type.description` | `types_de_livraison.description` | Описание (опционально). |
| `orders[*].client_nom` | `commandes.client.nom_du_client` | Имя клиента. |
| `orders[*].numero` | `commandes.numero_de_commande` | Номер заказа. |
| `orders[*].besoin_de_cheque` | `commandes.besoin_de_cheque` | Булево. |
| `orders[*].demandes_speciales` | `commandes.demandes_speciales` | Текст спец. запроса (опционально). |
| `orders[*].lignes[*].produit_nom` | `lignes_commande.produit.nom_du_produit` | Название продукта. |
| `orders[*].lignes[*].quantite` | `lignes_commande.quantite_commandee` | Количество. |
| `orders[*].lignes[*].tranche` | `lignes_commande.tranche` | Булево, отображается как `tr.`. |

### Сортировка

Фронтенд поддерживает режимы `alpha`, `numero`, `time` (@server/api/pdf/summary.get.ts#80-82). На сервере можно применять такую же сортировку перед рендером.

---

## Порядок использования шаблонов

1. Получите из Directus необходимые данные и сформируйте объект контекста.
2. Отрендерьте шаблон (`avis` или `summary`) при помощи Mustache-совместимого движка.
3. Передайте HTML в выбранный генератор PDF (Chromium/Puppeteer, WeasyPrint, wkhtmltopdf и т.п.).
4. Для `avis` предварительно разбейте `lignes_commande` на массив страниц и отметьте `first_page`.
5. Для массовой печати (merge) используйте `avis.html` для каждого заказа, затем объедините PDF инструментом вроде pdf-lib или Ghostscript.

Готовые HTML-шаблоны находятся в файлах `avis.html` и `summary.html` в этой папке.

Логотип
Логотип уже лежит в проекте: public/ladp_logo.svg — его нужно просто скопировать или оставить по тому же пути, потому что в шаблонах он используется как /ladp_logo.svg.

5. Инструкция по заполнению полей (краткая)
Avis (avis.html): нужно подготовить объект {company, order, pages}. 
pages
 — массив, где каждый элемент {first_page: true/false, lines: []}. Каждая строка в lines содержит {num, produit_nom, quantite, tranche}.
Summary (summary.html): объект {meta, tour, orders}. orders — массив карточек, каждая содержит {client_nom, numero, besoin_de_cheque, demandes_speciales, lignes: []}. Каждая строка в lignes — {produit_nom, quantite, tranche}.
Даты форматируются в Europe/Paris.
Все поля, помеченные опциональными, можно не передавать — шаблон сам скроет блоки через {{#...}}.