import { ObjectId } from "mongodb";

export type Test = {
  _id: ObjectId;
  name: string;
  availableFrom: Date;
  availableTo?: Date;
  classIds: ObjectId[];
  password?: string;
  questions: {
    questionId: ObjectId;
    points: number;
  }[];
  fitScore: number; // Punteggio minimo per superare il test
  timeLimit?: number; // Tempo massimo in minuti (undefined = illimitato)
  randomizeQuestions?: boolean; // Se true, l'ordine delle domande è casuale per ogni studente
  teacherId: ObjectId;
  subjectId: ObjectId;
  status: "bozza" | "pubblicato" | "archiviato";
  createdAt: Date;
  updatedAt: Date;
};
