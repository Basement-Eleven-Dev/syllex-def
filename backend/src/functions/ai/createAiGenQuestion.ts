import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import createHttpError from "http-errors";
import { Types, mongo } from "mongoose";
import { connectDatabase } from "../../_helpers/getDatabase";
import { z } from "zod";
import { askStructuredLLM } from "../../_helpers/AI/simpleCompletion";

import { Topic } from "../../models/schemas/topic.schema";
import { Material } from "../../models/schemas/material.schema";
import { Question } from "../../models/schemas/question.schema";

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
  difficulty?: QuestionDifficulty;
};
export type QuestionDifficulty =
  | "elementary"
  | "easy"
  | "medium"
  | "hard"
  | "very_hard";
//LLM STRUCTURES
const TrueFalseQuestionStructure = z.object({
  text: z.string(),
  explanation: z.string(),
  correctAnswer: z.boolean(),
});
const MultipleChoiceQuestionStructure = z.object({
  text: z.string(),
  explanation: z.string(),
  options: z.array(
    z.object({
      label: z.string(),
      isCorrect: z.boolean(),
    }),
  ),
});
const OpenQuestionStructure = z.object({
  text: z.string(),
  correctAnswer: z.string(),
});

//MAPS
const DIFFICULTY_PROMPT_MAP: Record<QuestionDifficulty, string> = {
  elementary: "very easy (elementary level)",
  easy: "easy",
  medium: "medium",
  hard: "hard",
  very_hard: "very hard (expert level)",
};

//SYSTEM PROMPT
const getSystemPrompt = (
  language: string = "it",
) => `You are a teacher creating quiz questions.
Write everything in ${language || "it"} language.

CRITICAL RULES:
- Base questions and answers ONLY on the content of the attached documents.
- Do NOT use any outside knowledge not explicitly stated in those documents.
- NEVER reference the source material. Do NOT use phrases like "secondo il testo", "in base al documento", "come indicato nel materiale", "il testo afferma", "dal brano si evince", "come riportato", "stando a quanto scritto", or any similar expression.
- Explanations must be CONCISE and DIRECT: go straight to the point, state the fact, no rhetorical introductions, no greetings, no filler phrases like "ricordate che", "fate attenzione", "cari ragazzi", "è importante notare".
- Maximum 2-3 sentences per explanation. State the correct concept plainly.
- VARIETY: each question must use a different angle, perspective, or aspect of the topic. Vary the sentence structure, vocabulary, and the specific concept tested. Never repeat the same pattern or phrasing across questions.`;

// 0.8-2 for high randomness
const QUESTION_GENERATION_MODEL_TEMPERATURE = 1.4;
export const generateTrueFalseQuestion = async (
  context: Context,
  difficulty: string,
  materialObjects: Material[],
  topic: Topic,
  language: string = "it",
  instructions: string = "",
): Promise<Partial<Question>> => {
  const PROMPT = `${getSystemPrompt(language)}

Create a true/false quiz question about the topic "${topic.name}" with ${difficulty} difficulty.
The question must be a clear declarative statement that is either true or false.
In the "explanation" field, state concisely (2-3 sentences max) why the statement is true or false. Go straight to the factual explanation, no preambles.
${instructions ? `\nAdditional instructions from the teacher: ${instructions}` : ""}`;
  const result = await askStructuredLLM(
    PROMPT,
    materialObjects,
    TrueFalseQuestionStructure,
    QUESTION_GENERATION_MODEL_TEMPERATURE,
    0.95,
    64,
  );
  const question: Partial<Question> = {
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
};
export const generateOpenQuestion = async (
  context: Context,
  difficulty: string,
  materialObjects: Material[],
  topic: Topic,
  language: string = "it",
  instructions: string = "",
): Promise<Partial<Question>> => {
  const PROMPT = `${getSystemPrompt(language)}

Create an open-answer quiz question about the topic "${topic.name}" with ${difficulty} difficulty.
The question must NOT include any answer choices — the student must formulate the answer independently.
In the "correctAnswer" field, provide a concise but complete model answer. Go straight to the content, no preambles or rhetorical phrases.
${instructions ? `\nAdditional instructions from the teacher: ${instructions}` : ""}`;

  const result = await askStructuredLLM(
    PROMPT,
    materialObjects,
    OpenQuestionStructure,
    QUESTION_GENERATION_MODEL_TEMPERATURE,
    0.95,
    64,
  );
  const question: Partial<Question> = {
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
  materialObjects: Material[],
  topic: Topic,
  language: string = "it",
  numberOfAlternatives: number = 5,
  instructions: string = "",
): Promise<Partial<Question>> => {
  const PROMPT = `${getSystemPrompt(language)}

Create a multiple-choice quiz question about the topic "${topic.name}" with ${difficulty} difficulty.
Requirements:
- Exactly ${numberOfAlternatives} answer options, with exactly ONE correct.
- Do NOT prefix options with labels like A/B/C/D/E.
- Wrong options must be plausible but clearly incorrect based on the content.
- In the "explanation" field, state concisely (2-3 sentences max) why the correct answer is right. Go straight to the factual explanation, no preambles.
${instructions ? `\nAdditional instructions from the teacher: ${instructions}` : ""}`;
  const result = await askStructuredLLM(
    PROMPT,
    materialObjects,
    MultipleChoiceQuestionStructure,
    QUESTION_GENERATION_MODEL_TEMPERATURE,
    0.95,
    64,
  );
  const question: Partial<Question> = {
    type: "scelta multipla",
    text: result.text,
    explanation: result.explanation,
    options: result.options as Question["options"],
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
  let materialOIds = (materialIds || []).map((el) => new mongo.ObjectId(el));
  await connectDatabase();

  const materialObjects = await Material.find({
    _id: { $in: materialOIds },
    subjectId: context.subjectId,
    aiGenerated: { $ne: true },
  });

  //load topic
  const topic = await Topic.findOne({
    _id: new mongo.ObjectId(topicId),
  });
  if (!topic)
    throw createHttpError.BadRequest(`topic ${topicId} doesn't exist`);

  //create question
  const difficultyPrompt = DIFFICULTY_PROMPT_MAP[difficulty || "medium"];
  const question =
    type == "open"
      ? await generateOpenQuestion(
          context,
          difficultyPrompt,
          materialObjects,
          topic,
          language,
          instructions,
        )
      : type == "true-false"
        ? await generateTrueFalseQuestion(
            context,
            difficultyPrompt,
            materialObjects,
            topic,
            language,
            instructions,
          )
        : await generateMultipleChoiceQuestion(
            context,
            difficultyPrompt,
            materialObjects,
            topic,
            language,
            numberOfAlternatives || 5,
            instructions,
          );

  return { question };
};

export const handler = lambdaRequest(createAIGenQuestion);
