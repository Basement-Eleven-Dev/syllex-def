# Scrittura nuove funzioni

## Dichiarare funzioni
1. Apri il file `functions-declarations.config.ts` (Cmd/Ctrl + P);
2. Aggiungere un oggetto alla lista `FUNCTION_INTEGRATIONS`, dove `apiRoute` è la rotta completa dell'api (scrivere tra graffe le variabili dinamiche, es: `{classId}` a cui si può accedere tramite `request.pathParameters.classId`), `functionPath` è il file della funzione (dalla directory `src/functions/`), `method` il metodo, e role il ruolo di esecuzione dell'api.
3. Creare il file definito il `functionPath` e seguire la sintassi di esempio del file `src/functions/status.ts`. 

## Ambiente locale
1. Creare un file .env all'interno di `backend` contenente
```
LOCAL_TESTING=true
STAGE=stg
COGNITO_POOL_ID=eu-south-1_w77iyt3xa
COGNITO_CLIENT_ID=4tc0qd18cvu46tbkccoi1nc12e
DB_CONNECTION={database connection string}
```
2. Lanciare `npm run dev`
N.B. Assicurarsi di aver fatto l'accesso alla cli di aws tramite l'account di pathway sotto il profilo `pathway`