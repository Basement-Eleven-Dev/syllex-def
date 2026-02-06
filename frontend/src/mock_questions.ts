import { Question } from './components/search-questions/search-questions';

export const mockQuestions: Question[] = [
  {
    id: '1',
    imageUrl:
      'https://t4.ftcdn.net/jpg/06/57/37/01/360_F_657370150_pdNeG5pjI976ZasVbKN9VqH1rfoykdYU.jpg',
    text: "Quale città italiana è stata designata capitale della Repubblica Italiana nel 1871, dopo l'unificazione del paese e la presa di Porta Pia?",
    type: 'scelta multipla',
    topic: 'Geografia',
    aiGenerated: true,
    explanation:
      "Roma è stata proclamata capitale d'Italia nel 1871, dopo la breccia di Porta Pia del 20 settembre 1870 che sancì la fine del potere temporale dei papi. Prima di Roma, altre città avevano ricoperto il ruolo di capitale: Torino (1861-1865) e Firenze (1865-1871). La scelta di Roma come capitale definitiva era simbolicamente importante per il nuovo stato italiano, rappresentando la continuità con l'antica Roma e l'eredità del Risorgimento.",
    options: [
      {
        label: 'Milano, centro economico e industriale del nord Italia',
        isCorrect: false,
      },
      {
        label:
          'Roma, antica capitale dello Stato Pontificio e città simbolo della civiltà romana',
        isCorrect: true,
      },
      {
        label: "Torino, prima capitale del Regno d'Italia dal 1861",
        isCorrect: false,
      },
      {
        label: 'Firenze, capitale provvisoria tra il 1865 e il 1871',
        isCorrect: false,
      },
      {
        label: 'Napoli, capitale del Regno delle Due Sicilie fino al 1861',
        isCorrect: false,
      },
    ],
    policy: 'pubblica',
  },
  {
    id: '2',
    text: "A causa della rotazione terrestre da ovest verso est e della posizione del nostro pianeta rispetto al Sole, un osservatore situato nell'emisfero boreale vede il Sole sorgere dal punto cardinale est",
    type: 'vero falso',
    topic: 'Scienze',
    explanation:
      "L'affermazione è vera. La Terra ruota attorno al proprio asse da ovest verso est con un periodo di circa 24 ore (giorno siderale). Questo movimento di rotazione, combinato con la posizione fissa apparente del Sole, fa sì che per un osservatore terrestre il Sole sembri muoversi da est verso ovest nel cielo. Di conseguenza, il Sole sorge a est e tramonta a ovest. È importante notare che la direzione esatta varia leggermente durante l'anno a causa dell'inclinazione dell'asse terrestre (23,5°) e del moto di rivoluzione della Terra attorno al Sole. Nei giorni degli equinozi (21 marzo e 23 settembre), il Sole sorge precisamente a est e tramonta precisamente a ovest, mentre nei solstizi (21 giugno e 21 dicembre) la posizione di alba e tramonto si sposta leggermente verso nord-est/nord-ovest o sud-est/sud-ovest a seconda dell'emisfero e della stagione.",
    policy: 'pubblica',
  },
  {
    id: '3',
    text: "Descrivi in modo dettagliato il ciclo idrologico (ciclo dell'acqua), spiegando le principali fasi attraverso cui l'acqua si muove tra l'atmosfera, la superficie terrestre e gli oceani. Includi nella tua risposta i processi di evaporazione, traspirazione, condensazione, precipitazione, infiltrazione e ruscellamento, specificando il ruolo dell'energia solare in questo ciclo.",
    type: 'risposta aperta',
    topic: 'Scienze',
    explanation:
      "Il ciclo idrologico, o ciclo dell'acqua, è un processo continuo attraverso cui l'acqua circola tra la superficie terrestre, l'atmosfera e il sottosuolo. Le fasi principali sono: 1) EVAPORAZIONE: l'energia solare riscalda l'acqua degli oceani, laghi e fiumi, trasformandola in vapore acqueo che sale nell'atmosfera. Circa il 86% dell'evaporazione globale proviene dagli oceani. 2) TRASPIRAZIONE: le piante rilasciano vapore acqueo attraverso gli stomi delle foglie. Insieme all'evaporazione forma l'evapotraspirazione. 3) CONDENSAZIONE: il vapore acqueo si raffredda salendo in quota e si condensa formando goccioline d'acqua che costituiscono le nuvole. 4) PRECIPITAZIONE: quando le gocce diventano troppo pesanti, cadono come pioggia, neve o grandine. 5) INFILTRAZIONE: parte dell'acqua penetra nel terreno alimentando le falde acquifere. 6) RUSCELLAMENTO: l'acqua che non si infiltra scorre sulla superficie formando torrenti e fiumi che riportano l'acqua agli oceani, chiudendo il ciclo. L'energia solare è il motore principale di questo processo, fornendo l'energia necessaria per l'evaporazione. Questo ciclo è essenziale per la distribuzione dell'acqua dolce sulla Terra e per la regolazione del clima globale.",
    policy: 'privata',
  },
  {
    id: '4',
    text: "Quale tra le seguenti rappresenta correttamente la formula chimica della molecola d'acqua, indicando sia il numero che il tipo di atomi che la compongono?",
    type: 'scelta multipla',
    topic: 'Chimica',
    explanation:
      "La formula chimica corretta dell'acqua è H₂O, che indica che ogni molecola d'acqua è composta da due atomi di idrogeno (H) e un atomo di ossigeno (O) legati covalentemente. L'acqua ha una struttura molecolare angolare con un angolo di legame di circa 104,5° a causa delle coppie elettroniche non condivise presenti sull'atomo di ossigeno. La molecola è polare, con l'ossigeno che porta una parziale carica negativa e gli idrogeni una parziale carica positiva, il che spiega molte delle proprietà uniche dell'acqua come l'elevato punto di ebollizione, la tensione superficiale e la capacità di agire come solvente universale. Le altre opzioni sono errate: CO₂ è l'anidride carbonica (un atomo di carbonio e due di ossigeno), O₂ è l'ossigeno molecolare (due atomi di ossigeno), OH⁻ è lo ione idrossido, e H₂O₂ è il perossido di idrogeno (acqua ossigenata).",
    options: [
      {
        label: 'H₂O - due atomi di idrogeno e un atomo di ossigeno',
        isCorrect: true,
      },
      {
        label: 'CO₂ - un atomo di carbonio e due atomi di ossigeno',
        isCorrect: false,
      },
      { label: 'O₂ - due atomi di ossigeno legati tra loro', isCorrect: false },
      {
        label: 'OH⁻ - ione idrossido formato da un ossigeno e un idrogeno',
        isCorrect: false,
      },
      {
        label: 'H₂O₂ - perossido di idrogeno (acqua ossigenata)',
        isCorrect: false,
      },
      {
        label: 'HO - un atomo di idrogeno e un atomo di ossigeno',
        isCorrect: false,
      },
    ],
    policy: 'pubblica',
  },
  {
    id: '5',
    text: 'Secondo le teorie scientifiche moderne e le evidenze raccolte attraverso osservazioni astronomiche, misurazioni geodetiche e immagini satellitari, la Terra ha una forma perfettamente sferica',
    type: 'vero falso',
    topic: 'Geografia',
    explanation:
      "L'affermazione è falsa. La Terra non è perfettamente sferica, ma ha la forma di un geoide, più precisamente di uno sferoide oblato o ellissoide di rotazione. Questo significa che il pianeta è leggermente schiacciato ai poli e rigonfio all'equatore a causa della forza centrifuga generata dalla rotazione terrestre. Il raggio equatoriale è di circa 6.378 km, mentre il raggio polare è di circa 6.357 km, con una differenza di circa 21 km. Inoltre, la superficie terrestre presenta irregolarità dovute alle catene montuose, alle fosse oceaniche e alle variazioni nella densità della crosta terrestre, rendendo la forma del pianeta ancora più complessa di un semplice ellissoide. Il geoide rappresenta la forma teorica che assumerebbe la superficie degli oceani estesa idealmente sotto i continenti, in equilibrio gravitazionale. Le prime prove della forma non piatta della Terra risalgono all'antica Grecia (Aristotele, Eratostene), ma la forma esatta è stata determinata con precisione solo con l'avvento delle misurazioni satellitari nel XX secolo.",
    policy: 'pubblica',
  },
  {
    id: '6',
    text: "Quale evento storico del 14 luglio 1789 viene comunemente considerato l'inizio simbolico della Rivoluzione Francese e della caduta dell'Ancien Régime?",
    type: 'scelta multipla',
    topic: 'Storia',
    explanation:
      "La presa della Bastiglia, avvenuta il 14 luglio 1789, è considerata l'evento simbolico che segna l'inizio della Rivoluzione Francese. La Bastiglia era una fortezza-prigione parigina che rappresentava il potere assoluto del re e l'oppressione dell'Ancien Régime. Sebbene al momento dell'assalto contenesse solo sette prigionieri, la sua conquista da parte del popolo parigino ebbe un enorme valore simbolico: rappresentò la rivolta contro il dispotismo monarchico e l'affermazione della volontà popolare. L'evento fu scatenato dalle tensioni economiche, dalla crisi finanziaria dello Stato francese, e dal tentativo del re Luigi XVI di reprimere l'Assemblea Nazionale. La presa della Bastiglia portò alla rapida diffusione della rivoluzione in tutta la Francia. Oggi, il 14 luglio è la festa nazionale francese.",
    options: [
      {
        label: 'La presa della Bastiglia da parte del popolo parigino',
        isCorrect: true,
      },
      {
        label: "L'esecuzione di Luigi XVI sulla ghigliottina",
        isCorrect: false,
      },
      {
        label:
          "La proclamazione della Dichiarazione dei Diritti dell'Uomo e del Cittadino",
        isCorrect: false,
      },
      {
        label: 'La convocazione degli Stati Generali da parte di Luigi XVI',
        isCorrect: false,
      },
      {
        label: 'Il colpo di stato di Napoleone Bonaparte (18 brumaio)',
        isCorrect: false,
      },
    ],
    policy: 'privata',
  },
  {
    id: '7',
    text: 'Nel 1492, il navigatore genovese Cristoforo Colombo, al servizio della corona spagnola, raggiunse le coste del continente americano cercando una rotta occidentale verso le Indie',
    type: 'vero falso',
    topic: 'Storia',
    explanation:
      "L'affermazione è vera. Il 12 ottobre 1492, Cristoforo Colombo, dopo un viaggio di circa due mesi partito dal porto di Palos in Spagna, sbarcò su un'isola delle Bahamas che chiamò San Salvador. Colombo era al servizio dei Re Cattolici di Spagna, Isabella di Castiglia e Ferdinando d'Aragona, che avevano finanziato la sua spedizione. L'obiettivo iniziale era trovare una rotta marittima occidentale verso le Indie (Asia) per il commercio delle spezie, aggirando il controllo ottomano sulle rotte terrestri. Colombo era convinto di aver raggiunto le coste asiatiche e morì senza sapere di aver scoperto un nuovo continente. Questo evento segnò l'inizio dell'era delle esplorazioni europee nelle Americhe e ebbe conseguenze storiche, culturali ed economiche immense, dando il via al processo di colonizzazione del Nuovo Mondo. È importante notare che l'America era già abitata da civiltà indigene e che i Vichinghi l'avevano raggiunta secoli prima, ma il viaggio di Colombo segnò l'inizio del contatto permanente tra i due continenti.",
    policy: 'pubblica',
  },
  {
    id: '8',
    text: "Spiega il funzionamento della fotosintesi clorofilliana nelle piante, descrivendo la reazione chimica complessiva, il ruolo della luce solare, della clorofilla e degli stomi, e distinguendo tra fase luminosa e fase oscura (ciclo di Calvin). Indica inoltre quali sono i prodotti finali del processo e dove viene utilizzata l'energia chimica prodotta.",
    type: 'risposta aperta',
    topic: 'Biologia',
    explanation:
      "La fotosintesi clorofilliana è il processo attraverso cui le piante verdi convertono l'energia luminosa del sole in energia chimica, producendo glucosio e ossigeno a partire da anidride carbonica e acqua. La reazione complessiva è: 6CO₂ + 6H₂O + energia luminosa → C₆H₁₂O₆ + 6O₂. Il processo si divide in due fasi: FASE LUMINOSA (reazioni luce-dipendenti): avviene nei tilacoidi dei cloroplasti. La clorofilla assorbe la luce solare (principalmente lunghezze d'onda rosse e blu), eccitando gli elettroni. Attraverso una catena di trasporto degli elettroni, viene prodotto ATP (energia) e NADPH (potere riducente), mentre l'acqua viene scissa (fotolisi) liberando ossigeno come prodotto di scarto. FASE OSCURA (Ciclo di Calvin): avviene nello stroma dei cloroplasti e non richiede direttamente la luce. Utilizza l'ATP e il NADPH prodotti nella fase luminosa per fissare il CO₂ atmosferico (assorbito attraverso gli stomi delle foglie) e convertirlo in glucosio attraverso una serie di reazioni enzimatiche catalizzate dall'enzima RuBisCO. Il glucosio prodotto viene utilizzato dalla pianta per la respirazione cellulare (producendo energia ATP), per la crescita, e come materiale di riserva (amido). La fotosintesi è fondamentale per la vita sulla Terra: produce l'ossigeno che respiriamo e costituisce la base della catena alimentare.",
    policy: 'privata',
  },
];
