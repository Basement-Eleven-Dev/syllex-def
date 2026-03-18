### **1. Usa i Sostantivi, non i Verbi**

Le rotte dovrebbero rappresentare **risorse** (oggetti), non azioni. L'azione è già espressa dal metodo HTTP (GET, POST, etc.).

* ❌ **No:** GET /getUtenti o POST /creaProdotto  
* ✅ **Sì:** GET /users o POST /products

### **2. Plurale per le Collezioni**

È standard universale usare il plurale per identificare una collezione di risorse. Questo rende il percorso coerente sia quando richiedi l'intera lista, sia quando richiedi un elemento specifico.

* GET /customers (Lista di tutti i clienti)  
* GET /customers/123 (Il cliente specifico con ID 123\)

### **3. Sfrutta correttamente i Metodi HTTP**

Il protocollo HTTP mette a disposizione "verbi" specifici che definiscono l'operazione da compiere sulla risorsa:

| Metodo | Azione (CRUD) | Esempio |
| :---- | :---- | :---- |
| **GET** | Read (Lettura) | GET /orders |
| **POST** | Create (Creazione) | POST /orders |
| **PUT** | Update (Sostituzione completa) | PUT /orders/45 |
| **PATCH** | Update (Modifica parziale) | PATCH /orders/45 |
| **DELETE** | Delete (Eliminazione) | DELETE /orders/45 |

### **4. Gerarchia e Relazioni (Nesting)**

Se una risorsa appartiene logicamente a un'altra, rifletti questa gerarchia nell'URL. Tuttavia, evita di superare i **2-3 livelli di profondità** per non rendere l'URL illeggibile.

* GET /authors/7/books (Tutti i libri dell'autore 7\)  
* GET /authors/7/books/21 (Il libro 21 dell'autore 7\)

### **5\. Filtri, Ordinamento e Paginazione**

Non creare rotte diverse per filtrare i dati. Usa le **Query Parameters** (?).

* ❌ **No:** GET /products/category/electronics  
* ✅ **Sì:** GET /products?category=electronics\&sort=price\_asc\&page=2


### **6. Azioni speciali**

A volte devi fare qualcosa che non è una semplice operazione CRUD (es. inviare una mail o attivare un account). In quel caso, puoi usare un "verbo" alla fine del percorso, ma trattalo come una sottorisorsa:

* POST /users/123/send-verification-email  
* PUT /orders/45/cancel

### **7. Versionamento dell'API** (opzionale)

Le API evolvono. Per evitare di rompere le integrazioni esistenti quando apporti modifiche radicali, includi la versione nel percorso.

* https://api.esempio.it/v1/users  
* https://api.esempio.it/v2/users

**Nota di stile:** Usa sempre il **kebab-case** (trattini) per gli URL (es. /user-profiles), poiché sono più leggibili e "SEO friendly" rispetto al camelCase o allo snake\_case.
