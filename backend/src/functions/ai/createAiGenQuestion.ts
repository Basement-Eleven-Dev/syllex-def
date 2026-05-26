import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import createHttpError from "http-errors";
import { Types, mongo } from "mongoose";
import { connectDatabase } from "../../_helpers/getDatabase";
import { z } from "zod";
import { askStructuredLLM } from "../../_helpers/AI/simpleCompletion";
import { fetchBuffer } from "../../_helpers/fetchBuffer";

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
  topicId?: string;
  numberOfAlternatives?: number;
  instructions?: string;
  type: QuestionType;
  language?: string;
  difficulty?: QuestionDifficulty;
  count?: number;
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
  topicId: z.string().optional(),
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
  topicId: z.string().optional(),
});
const OpenQuestionStructure = z.object({
  text: z.string(),
  correctAnswer: z.string(),
  topicId: z.string().optional(),
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
- Base questions and answers ONLY and strictly on the content of the attached documents.
- Do NOT use any outside knowledge, assumptions, or external facts not explicitly written in the attached documents. If a concept is not present in the attached documents, you MUST not ask questions about it or include it in any option or explanation.
- If the attached documents contain no text, are empty, or do not contain enough facts to generate the requested quiz questions, you must NOT invent any facts; you must base questions strictly on whatever minimal words are available or return empty/blank values where appropriate.
- NEVER reference the source material. Do NOT use phrases like "secondo il testo", "in base al documento", "come indicato nel materiale", "il testo afferma", "dal brano si evince", "come riportato", "stando a quanto scritto", or any similar expression.
- Explanations must be CONCISE and DIRECT: go straight to the point, state the fact, no rhetorical introductions, no greetings, no filler phrases like "ricordate che", "fate attenzione", "cari ragazzi", "è importante notare".
- Maximum 2-3 sentences per explanation. State the correct concept plainly.
- VARIETY: each question must use a different angle, perspective, or aspect of the topic. Vary the sentence structure, vocabulary, and the specific concept tested. Never repeat the same pattern or phrasing across questions.`;

// 0.8-2 for high randomness
const QUESTION_GENERATION_MODEL_TEMPERATURE = 1.4;

export const generateTrueFalseQuestions = async (
  context: Context,
  difficulty: string,
  materialObjects: Material[],
  topic: Topic | null,
  subjectTopics: Topic[] = [],
  language: string = "it",
  instructions: string = "",
  count: number = 1,
): Promise<Partial<Question>[]> => {
  const isAuto = !topic;
  const topicPromptPart = isAuto
    ? `about the overall content of the attached documents. Since we are generating questions from the entire document, you must select the most relevant topic for each question from the list of existing topics provided below.`
    : `about the topic "${topic.name}".`;

  const classificationInstructions = isAuto
    ? `
CLASSIFICATION REQUIREMENT:
You must categorize each question by setting the "topicId" field to the MongoDB _id of the most appropriate topic from the following list. Do NOT invent new IDs; only use the exact _id strings listed below:
${subjectTopics.map(t => `- Topic Name: "${t.name}", ID: "${t._id.toString()}"`).join("\n")}
`
    : "";

  if (count <= 1) {
    const PROMPT = `${getSystemPrompt(language)}

Create a true/false quiz question ${topicPromptPart} with ${difficulty} difficulty.
The question must be a clear declarative statement that is either true or false.
In the "explanation" field, state concisely (2-3 sentences max) why the statement is true or false. Go straight to the factual explanation, no preambles.
${classificationInstructions}
${instructions ? `\nAdditional instructions from the teacher: ${instructions}` : ""}`;
    const result = await askStructuredLLM(
      PROMPT,
      materialObjects,
      TrueFalseQuestionStructure,
      QUESTION_GENERATION_MODEL_TEMPERATURE,
      0.95,
      64,
    );

    let resolvedTopicId = topic?._id;
    if (isAuto) {
      const match = subjectTopics.find(t => t._id.toString() === result.topicId);
      resolvedTopicId = match ? match._id : (subjectTopics[0]?._id || new mongo.ObjectId());
    }

    const question: Partial<Question> = {
      type: "vero falso",
      text: result.text,
      explanation: result.explanation,
      policy: "private",
      correctAnswer: result.correctAnswer,
      aiGenerated: true,
      difficulty: difficulty as Question["difficulty"],
      topicId: resolvedTopicId!,
      teacherId: context.user!._id,
      subjectId: context.subjectId!,
    };
    return [question];
  }

  const PROMPT = `${getSystemPrompt(language)}

Create exactly ${count} distinct and diverse true/false quiz questions ${topicPromptPart} with ${difficulty} difficulty.
Each question must focus on a completely different aspect, subtopic, or concept of the material to ensure high variety.
Requirements:
- Each question must be a clear declarative statement that is either true or false.
- In the "explanation" field, state concisely (2-3 sentences max) why the statement is true or false. Go straight to the factual explanation, no preambles.
- VARIETY IS CRITICAL: Each question must test a different concept, subtopic, or aspect of the material. Do not repeat concepts, structures, or terms.
${classificationInstructions}
${instructions ? `\nAdditional instructions from the teacher: ${instructions}` : ""}`;

  const result = await askStructuredLLM(
    PROMPT,
    materialObjects,
    z.object({ questions: z.array(TrueFalseQuestionStructure) }),
    QUESTION_GENERATION_MODEL_TEMPERATURE,
    0.95,
    64,
  );

  return result.questions.map((q) => {
    let resolvedTopicId = topic?._id;
    if (isAuto) {
      const match = subjectTopics.find(t => t._id.toString() === q.topicId);
      resolvedTopicId = match ? match._id : (subjectTopics[0]?._id || new mongo.ObjectId());
    }

    return {
      type: "vero falso",
      text: q.text,
      explanation: q.explanation,
      policy: "private",
      correctAnswer: q.correctAnswer,
      aiGenerated: true,
      difficulty: difficulty as Question["difficulty"],
      topicId: resolvedTopicId!,
      teacherId: context.user!._id,
      subjectId: context.subjectId!,
    };
  });
};

export const generateOpenQuestions = async (
  context: Context,
  difficulty: string,
  materialObjects: Material[],
  topic: Topic | null,
  subjectTopics: Topic[] = [],
  language: string = "it",
  instructions: string = "",
  count: number = 1,
): Promise<Partial<Question>[]> => {
  const isAuto = !topic;
  const topicPromptPart = isAuto
    ? `about the overall content of the attached documents. Since we are generating questions from the entire document, you must select the most relevant topic for each question from the list of existing topics provided below.`
    : `about the topic "${topic.name}".`;

  const classificationInstructions = isAuto
    ? `
CLASSIFICATION REQUIREMENT:
You must categorize each question by setting the "topicId" field to the MongoDB _id of the most appropriate topic from the following list. Do NOT invent new IDs; only use the exact _id strings listed below:
${subjectTopics.map(t => `- Topic Name: "${t.name}", ID: "${t._id.toString()}"`).join("\n")}
`
    : "";

  if (count <= 1) {
    const PROMPT = `${getSystemPrompt(language)}

Create an open-answer quiz question ${topicPromptPart} with ${difficulty} difficulty.
The question must NOT include any answer choices — the student must formulate the answer independently.
In the "correctAnswer" field, provide a concise but complete model answer. Go straight to the content, no preambles or rhetorical phrases.
${classificationInstructions}
${instructions ? `\nAdditional instructions from the teacher: ${instructions}` : ""}`;

    const result = await askStructuredLLM(
      PROMPT,
      materialObjects,
      OpenQuestionStructure,
      QUESTION_GENERATION_MODEL_TEMPERATURE,
      0.95,
      64,
    );

    let resolvedTopicId = topic?._id;
    if (isAuto) {
      const match = subjectTopics.find(t => t._id.toString() === result.topicId);
      resolvedTopicId = match ? match._id : (subjectTopics[0]?._id || new mongo.ObjectId());
    }

    const question: Partial<Question> = {
      type: "risposta aperta",
      text: result.text,
      explanation: result.correctAnswer,
      policy: "private",
      aiGenerated: true,
      difficulty: difficulty as Question["difficulty"],
      topicId: resolvedTopicId!,
      teacherId: context.user!._id,
      subjectId: context.subjectId!,
    };
    return [question];
  }

  const PROMPT = `${getSystemPrompt(language)}

Create exactly ${count} distinct and diverse open-answer quiz questions ${topicPromptPart} with ${difficulty} difficulty.
Each question must focus on a completely different aspect, fact, or concept of the material to ensure variety.
Requirements:
- The questions must NOT include any answer choices — the student must formulate the answer independently.
- In the "correctAnswer" field, provide a concise but complete model answer. Go straight to the content, no preambles or rhetorical phrases.
- VARIETY IS CRITICAL: Each question must focus on a completely different aspect, fact, or concept from the material. Ensure diverse framing and syntax.
${classificationInstructions}
${instructions ? `\nAdditional instructions from the teacher: ${instructions}` : ""}`;

  const result = await askStructuredLLM(
    PROMPT,
    materialObjects,
    z.object({ questions: z.array(OpenQuestionStructure) }),
    QUESTION_GENERATION_MODEL_TEMPERATURE,
    0.95,
    64,
  );

  return result.questions.map((q) => {
    let resolvedTopicId = topic?._id;
    if (isAuto) {
      const match = subjectTopics.find(t => t._id.toString() === q.topicId);
      resolvedTopicId = match ? match._id : (subjectTopics[0]?._id || new mongo.ObjectId());
    }

    return {
      type: "risposta aperta",
      text: q.text,
      explanation: q.correctAnswer,
      policy: "private",
      aiGenerated: true,
      difficulty: difficulty as Question["difficulty"],
      topicId: resolvedTopicId!,
      teacherId: context.user!._id,
      subjectId: context.subjectId!,
    };
  });
};

export const generateMultipleChoiceQuestions = async (
  context: Context,
  difficulty: string,
  materialObjects: Material[],
  topic: Topic | null,
  subjectTopics: Topic[] = [],
  language: string = "it",
  numberOfAlternatives: number = 5,
  instructions: string = "",
  count: number = 1,
): Promise<Partial<Question>[]> => {
  const isAuto = !topic;
  const topicPromptPart = isAuto
    ? `about the overall content of the attached documents. Since we are generating questions from the entire document, you must select the most relevant topic for each question from the list of existing topics provided below.`
    : `about the topic "${topic.name}".`;

  const classificationInstructions = isAuto
    ? `
CLASSIFICATION REQUIREMENT:
You must categorize each question by setting the "topicId" field to the MongoDB _id of the most appropriate topic from the following list. Do NOT invent new IDs; only use the exact _id strings listed below:
${subjectTopics.map(t => `- Topic Name: "${t.name}", ID: "${t._id.toString()}"`).join("\n")}
`
    : "";

  if (count <= 1) {
    const PROMPT = `${getSystemPrompt(language)}

Create a multiple-choice quiz question ${topicPromptPart} with ${difficulty} difficulty.
Requirements:
- Exactly ${numberOfAlternatives} answer options, with exactly ONE correct.
- Do NOT prefix options with labels like A/B/C/D/E.
- Wrong options must be plausible but clearly incorrect based on the content.
- In the "explanation" field, state concisely (2-3 sentences max) why the correct answer is right. Go straight to the factual explanation, no preambles.
${classificationInstructions}
${instructions ? `\nAdditional instructions from the teacher: ${instructions}` : ""}`;
    const result = await askStructuredLLM(
      PROMPT,
      materialObjects,
      MultipleChoiceQuestionStructure,
      QUESTION_GENERATION_MODEL_TEMPERATURE,
      0.95,
      64,
    );

    let resolvedTopicId = topic?._id;
    if (isAuto) {
      const match = subjectTopics.find(t => t._id.toString() === result.topicId);
      resolvedTopicId = match ? match._id : (subjectTopics[0]?._id || new mongo.ObjectId());
    }

    const question: Partial<Question> = {
      type: "scelta multipla",
      text: result.text,
      explanation: result.explanation,
      options: result.options as Question["options"],
      policy: "private",
      aiGenerated: true,
      difficulty: difficulty as Question["difficulty"],
      topicId: resolvedTopicId!,
      teacherId: context.user!._id,
      subjectId: context.subjectId!,
    };
    return [question];
  }

  const PROMPT = `${getSystemPrompt(language)}

Create exactly ${count} distinct and diverse multiple-choice quiz questions ${topicPromptPart} with ${difficulty} difficulty.
Each question must test a different concept, subtopic, or factual detail from the material to ensure that none of the questions or their distractors overlap in content or style.
Requirements:
- For each question: exactly ${numberOfAlternatives} answer options, with exactly ONE correct.
- Do NOT prefix options with labels like A/B/C/D/E.
- Wrong options must be plausible but clearly incorrect based on the content.
- In the "explanation" field, state concisely (2-3 sentences max) why the correct answer is right. Go straight to the factual explanation, no preambles.
- VARIETY IS CRITICAL: Each question must test a different concept, subtopic, or factual detail from the material. Ensure that none of the questions or their distractors overlap in content or style.
${classificationInstructions}
${instructions ? `\nAdditional instructions from the teacher: ${instructions}` : ""}`;

  const result = await askStructuredLLM(
    PROMPT,
    materialObjects,
    z.object({ questions: z.array(MultipleChoiceQuestionStructure) }),
    QUESTION_GENERATION_MODEL_TEMPERATURE,
    0.95,
    64,
  );

  return result.questions.map((q) => {
    let resolvedTopicId = topic?._id;
    if (isAuto) {
      const match = subjectTopics.find(t => t._id.toString() === q.topicId);
      resolvedTopicId = match ? match._id : (subjectTopics[0]?._id || new mongo.ObjectId());
    }

    return {
      type: "scelta multipla",
      text: q.text,
      explanation: q.explanation,
      options: q.options as Question["options"],
      policy: "private",
      aiGenerated: true,
      difficulty: difficulty as Question["difficulty"],
      topicId: resolvedTopicId!,
      teacherId: context.user!._id,
      subjectId: context.subjectId!,
    };
  });
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
    count,
  } = JSON.parse(request.body || "{}") as AIGenQuestionInput;

  //error handling
  if (!type || !isQuestionType(type))
    throw createHttpError.BadRequest(
      `type field is required. Accepted values: ${questionTypes.join(", ")}. You passed "${type}"`,
    );

  let materialOIds = (materialIds || []).map((el) => new mongo.ObjectId(el));
  await connectDatabase();

  const materialObjects = await Material.find({
    _id: { $in: materialOIds },
    subjectId: context.subjectId,
    aiGenerated: { $ne: true },
  });

  // Fetch all text buffers and validate combined content length
  let totalTextLength = 0;
  for (const m of materialObjects) {
    if (m.extractedTextFileUrl) {
      try {
        const buffer = await fetchBuffer(m.extractedTextFileUrl);
        totalTextLength += buffer.toString("utf-8").trim().length;
      } catch (e) {
        console.error(`Failed to fetch buffer for material ${m._id}:`, e);
      }
    }
  }

  // If there are materials selected but they have less than 150 characters, reject
  if (materialObjects.length > 0 && totalTextLength < 150) {
    throw createHttpError.BadRequest(
      `Non è possibile avviare la generazione automatica perché il documento selezionato non contiene testo sufficiente (rilevati solo ${totalTextLength} caratteri). Per garantire l'accuratezza didattica del test ed evitare che l'Intelligenza Artificiale inventi di sana pianta concetti non presenti (fenomeno delle allucinazioni), è necessario che il file di riferimento contenga del testo concreto (come dispense, capitoli di libri o appunti). Ti invitiamo a caricare un documento completo di testo e riprovare!`
    );
  }

  //load topic
  let topic: Topic | null = null;
  let subjectTopics: Topic[] = [];

  if (topicId && topicId !== "auto") {
    topic = await Topic.findOne({
      _id: new mongo.ObjectId(topicId),
    });
    if (!topic)
      throw createHttpError.BadRequest(`topic ${topicId} doesn't exist`);
  } else {
    // Auto classification mode: load all topics of the subject
    subjectTopics = await Topic.find({
      subjectId: new mongo.ObjectId(context.subjectId!),
    });
    if (subjectTopics.length === 0) {
      throw createHttpError.BadRequest(`No topics found for subject ${context.subjectId}. You must create at least one topic first.`);
    }
  }

  //create question
  const difficultyPrompt = DIFFICULTY_PROMPT_MAP[difficulty || "medium"];
  const requestedCount = count && count > 0 ? count : 1;

  const questions =
    type == "open"
      ? await generateOpenQuestions(
          context,
          difficultyPrompt,
          materialObjects,
          topic,
          subjectTopics,
          language,
          instructions,
          requestedCount,
        )
      : type == "true-false"
        ? await generateTrueFalseQuestions(
            context,
            difficultyPrompt,
            materialObjects,
            topic,
            subjectTopics,
            language,
            instructions,
            requestedCount,
          )
        : await generateMultipleChoiceQuestions(
            context,
            difficultyPrompt,
            materialObjects,
            topic,
            subjectTopics,
            language,
            numberOfAlternatives || 5,
            instructions,
            requestedCount,
          );

  return {
    question: questions[0],
    questions,
  };
};

export const handler = lambdaRequest(createAIGenQuestion);
