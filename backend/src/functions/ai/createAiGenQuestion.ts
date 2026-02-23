import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import createHttpError from "http-errors";
import { ObjectId } from "mongodb";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { MaterialInterface } from "../../models/material";
import { z } from "zod";
import { askStructuredLLM } from "../../_helpers/AI/simpleCompletion";

import { Question } from "../../models/question";
import { Topic } from "../../models/topic";

//API TYPES
const questionTypes = ["open", "true-false", "multiple"] as const;
type QuestionType = (typeof questionTypes)[number];
function isQuestionType(value: any): value is QuestionType {
  return questionTypes.includes(value);
}
export type AIGenQuestionInput = {
  materialIds: string[];
  topicId: string;
  numberOfAlternatives?: number;
  instructions?: string;
  type: QuestionType;
  language?: string;
  difficulty?: 1 | 2 | 3;
};

//LLM STRUCTURES
const TrueFalseQuestionStructure = z.object({
  text: z.string(),
  explanation: z.string(),
  correctAnswer: z.boolean(),
});
const MultipleChoiceQuestionStructure = z.object({
  text: z.string(),
  explanation: z.string(),
  options: z.array(z.object({
    label: z.string(),
    isCorrect: z.boolean(),
  })),
});
const OpenQuestionStructure = z.object({
  text: z.string(),
  correctAnswer: z.string(),
});

//MAPS
const DIFFICULTY_MAP: Record<1 | 2 | 3, string> = {
  1: "low",
  2: "medium",
  3: "high",
};

//GUARDRAILS
const getGuardrail = (language: string = "it") => `
    Use the ${language || "it"} language.
    Answer the query using only the information provided in the attached documents.
    Do not use any outside knowledge, facts, or assumptions not explicitly stated in these files.`;

// 0.8-2 for high randomness
const QUESTION_GENERATION_MODEL_TEMPERATURE = 1;
export const generateTrueFalseQuestion = async (
  context: Context,
  difficulty: string,
  materialObjects: MaterialInterface[],
  topic: Topic,
  language: string = "it",
  instructions: string = "",
): Promise<Question> => {
  const INSTRUCTIONS = `Create a ${difficulty} difficulty true/false quiz question about the topic "${topic.name}" based on these documents.
   ${instructions}`;

  const PROMPT = `${INSTRUCTIONS}
    ${getGuardrail(language)}`;
  const result = await askStructuredLLM(
    PROMPT,
    materialObjects,
    TrueFalseQuestionStructure,
    QUESTION_GENERATION_MODEL_TEMPERATURE,
  );
  const question: Question = {
    type: "vero falso",
    text: result.text,
    explanation: result.explanation,
    policy: "private",
    correctAnswer: result.correctAnswer,
    aiGenerated: true,
    topicId: topic._id!,
    teacherId: context.user!._id,
    subjectId: context.subjectId!,
  };
  return question;
}
export const generateOpenQuestion = async (
  context: Context,
  difficulty: string,
  materialObjects: MaterialInterface[],
  topic: Topic,
  language: string = "it",
  instructions: string = "",
): Promise<Question> => {
  const INSTRUCTIONS = `Create a ${difficulty} difficulty quiz question about the topic "${topic.name}" based on these documents. The quiz question must be open-answer (no choices included), and you must include the correct answer. ${instructions}`;
  const PROMPT = `${INSTRUCTIONS}
    ${getGuardrail(language)}`;
  const result = await askStructuredLLM(
    PROMPT,
    materialObjects,
    OpenQuestionStructure,
    QUESTION_GENERATION_MODEL_TEMPERATURE,
  );
  const question: Question = {
    type: "risposta aperta",
    text: result.text,
    explanation: result.correctAnswer,
    policy: "private",
    aiGenerated: true,
    topicId: topic._id!,
    teacherId: context.user!._id,
    subjectId: context.subjectId!,
  };
  return question;
};
export const generateMultipleChoiceQuestion = async (
  context: Context,
  difficulty: string,
  materialObjects: MaterialInterface[],
  topic: Topic,
  language: string = "it",
  numberOfAlternatives: number = 5,
  instructions: string = "",
): Promise<Question> => {
  const INSTRUCTIONS = `Create a ${difficulty} difficulty quiz question (multiple choice, only one is correct) about the topic "${topic.name}" based on these documents.
    The quiz question must contain ${numberOfAlternatives} alternatives to choose from  and you need to specify which one is correct. Avoid labels A/B/C/D/E/... in the text of the alternatives. ${instructions}`;


  const PROMPT = `${INSTRUCTIONS}
    ${getGuardrail(language)}`;
  const result = await askStructuredLLM(
    PROMPT,
    materialObjects,
    MultipleChoiceQuestionStructure,
    QUESTION_GENERATION_MODEL_TEMPERATURE,
  );
  const question: Question = {
    type: "scelta multipla",
    text: result.text,
    explanation: result.explanation,
    options: result.options,
    policy: "private",
    aiGenerated: true,
    topicId: topic._id!,
    teacherId: context.user!._id,
    subjectId: context.subjectId!,
  };
  return question;
};

const createAIGenQuestion = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const {
    topicId,
    materialIds,
    numberOfAlternatives,
    type,
    language,
    difficulty,
    instructions,
  } = JSON.parse(request.body || "{}") as AIGenQuestionInput;

  //error handling
  if (!type || !isQuestionType(type))
    throw createHttpError.BadRequest(
      `type field is required. Accepted values: ${questionTypes.join(", ")}. You passed "${type}"`,
    );
  if (!topicId) throw createHttpError.BadRequest(`type topicId is required`);
  let materialOIds = (materialIds || []).map((el) => new ObjectId(el));
  const db = await getDefaultDatabase();

  const materialCollection = db.collection<MaterialInterface>("materials");
  const materialObjects: MaterialInterface[] = await materialCollection.find({ _id: { $in: materialOIds } }).toArray() as MaterialInterface[]; //forse non serve

  //load topic
  const topicCollection = db.collection("topics");
  const topic: Topic | null = (await topicCollection.findOne({
    _id: new ObjectId(topicId),
  })) as Topic | null;
  if (!topic)
    throw createHttpError.BadRequest(`topic ${topicId} doesn't exist`);

  //create question
  const question =
    type == "open"
      ? await generateOpenQuestion(
        context,
        DIFFICULTY_MAP[difficulty || 2],
        materialObjects,
        topic,
        language,
        instructions,
      )
      : (
        type == 'true-false' ? await generateTrueFalseQuestion(
          context,
          DIFFICULTY_MAP[difficulty || 2],
          materialObjects,
          topic,
          language,
          instructions
        ) : await generateMultipleChoiceQuestion(
          context,
          DIFFICULTY_MAP[difficulty || 2],
          materialObjects,
          topic,
          language,
          numberOfAlternatives || 5,
          instructions,
        )
      );

  //store question - don't store yet
  /* const questionsCollection = db.collection("questions");
  question._id = (await questionsCollection.insertOne(question)).insertedId; */
  return { question };
};

export const handler = lambdaRequest(createAIGenQuestion);
