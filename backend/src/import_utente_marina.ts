import { connectDatabase } from "./_helpers/getDatabase";
import { Types } from "mongoose";
import { Class } from "./models/schemas/class.schema";

const classIds: Types.ObjectId[] = [
  new Types.ObjectId("69c3fcde4b451bf4dad7d87c"), //26° NMRS SSC/ECG
  new Types.ObjectId("69c3fcde4b451bf4dad7d87e"), //28° Corso N.MRS - Np e Np/OP
  new Types.ObjectId("69c3fcdf4b451bf4dad7d880"), //SSP/TM e NP/MS
];

interface Student {
  name: string;
  surname: string;
  email: string;
}

const ClassStudents: { classId: Types.ObjectId; students: Student[] }[] = [
  {
    classId: new Types.ObjectId("69c3fcde4b451bf4dad7d87c"),
    students: [
      {
        name: "Alessia Bianca",
        surname: "Leone",
        email: "alessiab.leone@marina.difesa.it",
      },
      {
        name: "Davide",
        surname: "Zullo",
        email: "davide.zullo@marina.difesa.it",
      },
      {
        name: "Donato",
        surname: "Ricciardi",
        email: "donato.ricciardi@marina.difesa.it",
      },
      {
        name: "Gabriele",
        surname: "Canta",
        email: "gabriele.canta@marina.difesa.it",
      },
      {
        name: "Rosa",
        surname: "Verolino",
        email: "rosa.verolino@marina.difesa.it",
      },
      {
        name: "Sabrina",
        surname: "Loffredo",
        email: "sabrina.loffredo@marina.difesa.it",
      },
      {
        name: "Giuseppe",
        surname: "Lacorte",
        email: "giuseppe1.lacorte@marina.difesa.it",
      },
      {
        name: "Francesco",
        surname: "Trinchero",
        email: "francesco.trinchero@marina.difesa.it",
      },
      {
        name: "Giovanni",
        surname: "Violino",
        email: "giovanni.violino@marina.difesa.it",
      },
    ],
  },
  {
    classId: new Types.ObjectId("69c3fcde4b451bf4dad7d87e"),
    students: [
      {
        name: "Martina",
        surname: "Accoto",
        email: "martina-accoto@marina.difesa.it",
      },
      {
        name: "Giacomo",
        surname: "Aquino",
        email: "giacomo-aquino@marina.difesa.it",
      },
      {
        name: "Aurelia Iris",
        surname: "Azzarone",
        email: "aureliai.azzarone@marina.difesa.it",
      },
      {
        name: "Alba",
        surname: "Caniglia",
        email: "alba-caniglia@marina.difesa.it",
      },
      {
        name: "Beatrice",
        surname: "Capobianco",
        email: "beatrice-capobianco@marina.difesa.it",
      },
      {
        name: "Ferdinando",
        surname: "Cerbone",
        email: "ferdinando-cerbone@marina.difesa.it",
      },
      {
        name: "Chiara",
        surname: "Chiello",
        email: "chiara-chiello@marina.difesa.it",
      },
      {
        name: "Veronica",
        surname: "Crapanzano",
        email: "veronica.crapanzano@marina.difesa.it",
      },
      {
        name: "Anna",
        surname: "D'Agostino",
        email: "anna-dagostino@marina.difesa.it",
      },
      {
        name: "Giorgia",
        surname: "De Palo",
        email: "giorgia-depalo@marina.difesa.it",
      },
      {
        name: "Filippo",
        surname: "De Rosa",
        email: "filippo-derosa@marina.difesa.it",
      },
      {
        name: "Simone",
        surname: "Di Lorenzo",
        email: "simone-dilorenzo@marina.difesa.it",
      },
      {
        name: "Andrea",
        surname: "Ercolani",
        email: "andrea-ercolani@marina.difesa.it",
      },
      {
        name: "Giuseppe",
        surname: "Filomena",
        email: "giuseppe-filomena@marina.difesa.it",
      },
      {
        name: "Sabino",
        surname: "Fuggetta",
        email: "sabino-fuggetta@marina.difesa.it",
      },
      {
        name: "Enrica",
        surname: "Gussoni",
        email: "enrica-gussoni@marina.difesa.it",
      },
      {
        name: "Giovanni",
        surname: "Ingrao",
        email: "giovanni-ingrao@marina.difesa.it",
      },
      {
        name: "Ilenia",
        surname: "Laguardia",
        email: "ilenia-laguardia@marina.difesa.it",
      },
      {
        name: "Luigi",
        surname: "Lionetti",
        email: "luigi-lionetti@marina.difesa.it",
      },
      {
        name: "Andrea",
        surname: "Lombardo",
        email: "andrea-lombardo@marina.difesa.it",
      },
      {
        name: "Gabriele Pio",
        surname: "Lussoso",
        email: "gabrielep-lussoso@marina.difesa.it",
      },
      {
        name: "Lorenzo",
        surname: "Maggi",
        email: "lorenzo-maggi@marina.difesa.it",
      },
      {
        name: "Sonia",
        surname: "Martucci",
        email: "sonia-martucci@marina.difesa.it",
      },
      {
        name: "Marco",
        surname: "Marturano",
        email: "marco-marturano@marina.difesa.it",
      },
      {
        name: "Gabriele Giacinto",
        surname: "Mastrodomenico",
        email: "gabrieleg-mastrodomenico@marina.difesa.it",
      },
      {
        name: "Sara",
        surname: "Mastronuzzi",
        email: "sara-mastronuzzi@marina.difesa.it",
      },
      {
        name: "Alfredo",
        surname: "Mirante",
        email: "alfredo-mirante@marina.difesa.it",
      },
      {
        name: "Michela",
        surname: "Monterisi",
        email: "michela-monterisi@marina.difesa.it",
      },
      {
        name: "Gabriele",
        surname: "Pizzardi",
        email: "gabriele-pizzardi@marina.difesa.it",
      },
      {
        name: "Pierluigi",
        surname: "Precone",
        email: "pierluigi-precone@marina.difesa.it",
      },
      {
        name: "Marco",
        surname: "Raggiu",
        email: "marco-raggiu@marina.difesa.it",
      },
      {
        name: "Emanuele",
        surname: "Roncarolo",
        email: "emanuele-roncarolo@marina.difesa.it",
      },
      {
        name: "Roberta",
        surname: "Ruffo",
        email: "roberta-ruffo@marina.difesa.it",
      },
      {
        name: "Davide",
        surname: "Smeraldo",
        email: "davide-smeraldo@marina.difesa.it",
      },
      {
        name: "Giuseppe",
        surname: "Taormina",
        email: "giuseppe-taormina@marina.difesa.it",
      },
    ],
  },
  {
    classId: new Types.ObjectId("69c3fcdf4b451bf4dad7d880"),
    students: [
      {
        name: "Alessandra",
        surname: "Cappello",
        email: "alessandraf.cappello@marina.difesa.it",
      },
      {
        name: "Matteo",
        surname: "Cinefra",
        email: "matteop.cinefra@marina.difesa.it",
      },
      {
        name: "Lorenzo",
        surname: "D'Amico",
        email: "lorenzo.damico@marina.difesa.it",
      },
      {
        name: "Federico",
        surname: "Di Mario",
        email: "federico.dimario@marina.difesa.it",
      },
      {
        name: "Gioele",
        surname: "Gambini",
        email: "gioele.gambini@marina.difesa.it",
      },
      {
        name: "Mattia",
        surname: "Lacitignola",
        email: "mattia.lacitignola@marina.difesa.it",
      },
      {
        name: "Nicholas",
        surname: "Lannocca",
        email: "nicholas.lannocca@marina.difesa.it",
      },
      {
        name: "Jonathan",
        surname: "Laporta",
        email: "jonathan.laporta@marina.difesa.it",
      },
      {
        name: "Marco",
        surname: "Maina",
        email: "marco.maina@marina.difesa.it",
      },
      {
        name: "Nicolò",
        surname: "Manno",
        email: "nicolo.manno@marina.difesa.it",
      },
      {
        name: "Francesco",
        surname: "Musumeci",
        email: "francesco.musumeci@marina.difesa.it",
      },
      {
        name: "Alessandro",
        surname: "Nisi",
        email: "alessandro2.nisi@marina.difesa.it",
      },
      {
        name: "Luca",
        surname: "Padolecchia",
        email: "luca.padolecchia@marina.difesa.it",
      },
      {
        name: "Samuele",
        surname: "Rollo",
        email: "samuele.rollo@marina.difesa.it",
      },
      {
        name: "Vincenzo",
        surname: "Samarelli",
        email: "vincenzo.samarelli@marina.difesa.it",
      },
      {
        name: "Matteo",
        surname: "Sfienti",
        email: "matteo.sfienti@marina.difesa.it",
      },
      {
        name: "Christian",
        surname: "Statile",
        email: "christian.statile@marina.difesa.it",
      },
      {
        name: "Gaia",
        surname: "Varriale",
        email: "gaia.varriale@marina.difesa.it",
      },
      {
        name: "Stefano",
        surname: "Carbone",
        email: "stefano-carbone@marina.difesa.it",
      },
      {
        name: "Giovanni",
        surname: "Giannoccaro",
        email: "giovanni-giannoccaro@marina.difesa.it",
      },
      {
        name: "Gabriele",
        surname: "Logrillo",
        email: "gabriele-logrillo@marina.difesa.it",
      },
      {
        name: "Michele",
        surname: "Socionovi",
        email: "michele-socionovi@marina.difesa.it",
      },
    ],
  },
];

async function main() {
  let database = await connectDatabase(
    "mongodb+srv://app:88N1cF6PE48brh1j@clusterprod.xbffgxx.mongodb.net/?appName=ClusterProd",
  );

  let classes = await Class.find({ _id: { $in: classIds } });

  for (let cs of ClassStudents) {
    let c = classes.find((c) => c._id.equals(cs.classId));
    if (!c) {
      console.error("Class not found for id", cs.classId.toHexString());
      continue;
    }
    console.log("Class name: ", c.name);
    console.log("Class students: ", cs.students.length);
    for (let s of cs.students) {
      console.log(s.name, s.surname, s.email);
    }
    console.log("--------------------------------");
  }
}

main();
