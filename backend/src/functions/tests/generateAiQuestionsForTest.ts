import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { ObjectId } from "mongodb";
import { getRagResponse } from "../../_helpers/_ai-aws/assistant.service";
import { extractJsonFromResponse } from "../../_helpers/_ai-aws/ai-utils";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "teacher") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const {
    materialIds: materialIdsInput,
    numQuestions = 3,
    questionTypes = ["multiple-choice"],
    difficulty = "medium",
    focusTopics = "",
    language = "italian",
  } = JSON.parse(req.body || "{}");

  const materialIds = Array.isArray(materialIdsInput)
    ? materialIdsInput
    : materialIdsInput
      ? [materialIdsInput]
      : [];

  if (materialIds.length === 0) {
    return res
      .status(400)
      .json({ message: "È necessario fornire almeno un ID di materiale." });
  }

  try {
    // Enhanced difficulty specifications
    const difficultySpecs = {
      easy: {
        points: 1,
        description:
          "Test basic recall and direct comprehension of facts and simple concepts from the material. Questions should require straightforward recognition without complex reasoning.",
        cognitiveLevel: "Remember and Understand",
        distractorGuidance:
          "Create obvious but not absurd wrong answers, with one moderately plausible distractor.",
      },
      medium: {
        points: 2,
        description:
          "Test application of concepts, comparison of ideas, cause-effect relationships, and analysis of information. Questions should require connecting ideas and drawing inferences.",
        cognitiveLevel: "Apply and Analyze",
        distractorGuidance:
          "Create two highly plausible distractors that represent common misconceptions or partial understanding, plus one clearly wrong option.",
      },
      hard: {
        points: 3,
        description:
          "Test synthesis of multiple concepts, critical evaluation, judgment formation, and complex reasoning. Questions should require deep analysis and evaluation of interconnected ideas.",
        cognitiveLevel: "Synthesize and Evaluate",
        distractorGuidance:
          "Create sophisticated distractors that could fool even well-prepared students - representing subtle misconceptions, overgeneralizations, or logical fallacies.",
      },
    };

    const currentDifficultySpec =
      difficultySpecs[difficulty as keyof typeof difficultySpecs] ||
      difficultySpecs.medium;

    const systemPrompt = `You are an expert instructional designer, specialized in creating high-quality educational assessments. Your goal is to generate questions that test critical thinking, not just memorization.

**CRITICAL RULES (NON-NEGOTIABLE):**
1. **KNOWLEDGE SOURCE:** Your ONLY source of information is the provided context. It is FORBIDDEN to use your general knowledge.
2. **LANGUAGE:** Your entire JSON output, including all text inside it, MUST be written in **${language}**.
3. **NATURAL PHRASING:** Frame questions and explanations naturally, as a human teacher would. AVOID robotic phrases like "Based on the provided context..." or "According to the text...".

**DIFFICULTY LEVEL: ${difficulty.toUpperCase()}**
- **Cognitive Level:** ${currentDifficultySpec.cognitiveLevel}
- **Requirement:** ${currentDifficultySpec.description}
- **Points:** ${currentDifficultySpec.points}

**CRITICAL RULES FOR MULTIPLE-CHOICE QUESTIONS:**
4. **DISTRACTOR STRUCTURE (MANDATORY):** Create exactly 4 options with this distribution:
   - 1 CORRECT answer (based on provided material)
   - 2 HIGHLY PLAUSIBLE but incorrect answers (sophisticated distractors that seem correct at first glance)
   - 1 CLEARLY WRONG but not absurd answer (still topic-related)

5. **DISTRACTOR QUALITY:** The plausible distractors must:
   - Be the same length and complexity as the correct answer
   - Use appropriate terminology from the context
   - Represent logical errors a student might make
   - NOT be obviously wrong to someone who partially knows the topic
   - Include PARTIAL TRUTHS that sound academically credible
   - Mix correct elements with subtle errors
   - ${currentDifficultySpec.distractorGuidance}

6. **CRITICAL ANSWER BALANCE RULE:** 
   - All 4 options MUST have approximately THE SAME WORD COUNT (±3 words maximum)
   - All options MUST use equally sophisticated academic language
   - The correct answer MUST NOT be more detailed, elaborate, or explanatory than distractors
   - If the correct answer is getting longer, SHORTEN IT or EXPAND the distractors to match
   - FORBIDDEN: Making the correct answer a mini-essay while distractors are brief

7. **DIFFICULTY CALIBRATION:** For ${difficulty} level:
   ${currentDifficultySpec.description}

   **CRITICAL RULES FOR TRUE-FALSE QUESTIONS:**
- The "correctAnswer" field MUST contain ONLY the English word "True" or "False" (case-insensitive)
- Even if the question text is in ${language}, the correctAnswer must be in English
- FORBIDDEN: Using boolean values (true/false), translated words, or any other format
- Example: "correctAnswer": "True" ✓
- Example: "correctAnswer": "False" ✓
- Example: "correctAnswer": "Vero" ✗
- Example: "correctAnswer": true ✗

**JSON FORMAT ONLY:** Your response must be ONLY a valid JSON array of question objects, with no other text. 
The keys for each object MUST be in English: "type", "question", "options", "correctAnswer", "explanation", "points".
The values (question text, options, explanation, topic) MUST be written in **${language}**.

**TOPIC FIELD (MANDATORY):**
- Each question MUST include a "topic" field
- Assign ONE specific topic from the focus areas to each question: "${focusTopics}"
- If multiple topics were requested, distribute them across questions
- Write the topic in **${language}**
- Use the EXACT topic names provided, or create specific sub-topics related to them

**EXAMPLES OF GOOD DISTRACTORS:**
For a question about photosynthesis at medium level:
- Correct: "Converts light energy into chemical energy"
- Plausible distractor 1: "Converts chemical energy into light energy" (logical reversal)
- Plausible distractor 2: "Converts light energy into kinetic energy" (related process confusion)
- Wrong but not absurd: "Converts sound energy into chemical energy" (wrong energy type)

**MANDATORY FORMATTING RULES:**
- WORD COUNT: All 4 options must have 15-25 words each (strictly enforced)
- TONE: All options must sound equally academic and authoritative  
- STRUCTURE: Use similar sentence structures across all options
- TERMINOLOGY: Each option should contain 2-3 technical terms from the subject

**DISTRACTOR SOPHISTICATION RULES:**
- Plausible distractors should represent PARTIAL TRUTHS or COMMON SCHOLARLY DEBATES
- Include interpretations that advanced students might argue for in class
- Mix correct historical facts with wrong applications
- Create options that combine real concepts from the material in incorrect ways
- Use REAL terminology and concepts from the context, but in wrong relationships

**VALIDATION CHECKLIST:**
- Are all 4 options between 15-25 words each?
- Do all options use equally sophisticated language?
- Would the plausible distractors fool someone with partial knowledge?
- Could an expert argue for any of the distractor interpretations?
- Is the difficulty appropriate for ${difficulty} level?
- Are all texts in ${language}?
- Does each option contain appropriate technical terminology?`;

    const pointsValue = currentDifficultySpec.points;
    const requestedTypes = Array.isArray(questionTypes)
      ? questionTypes
      : [questionTypes];

    const topicInstruction = focusTopics
      ? `The questions must focus specifically on this topic: "${focusTopics}".`
      : "The questions must cover diverse and significant topics from the provided context.";

    const userQueryForRag = `Generate ${numQuestions} test questions at ${difficulty} difficulty level.
- Difficulty: "${difficulty}" (${currentDifficultySpec.cognitiveLevel})
- Question Types: ${requestedTypes.join(", ")}
- Focus: ${topicInstruction}
- Points per question: ${pointsValue}

IMPORTANT: For multiple-choice questions, ensure sophisticated distractors that create genuine difficulty appropriate for ${difficulty} level. The distractors should represent common misconceptions and logical errors students might make.`;

    const aiResponseString = await getRagResponse(
      userQueryForRag,
      materialIds,
      systemPrompt,
      'questions-generation'
    );
    const generatedQuestions = extractJsonFromResponse(aiResponseString);
    const validatedQuestions = generatedQuestions
      .map((q: any, index: number) => {
        if (q.type === "true-false") {
          const normalized = String(q.correctAnswer ?? "")
            .toLowerCase()
            .trim();

          if (!["true", "false", "vero", "falso"].includes(normalized)) {
            console.error(
              `[VALIDATION ERROR] Question ${index + 1
              } has invalid true-false answer:`,
              q.correctAnswer
            );
            // Opzione A: Scarta la domanda
            return null;

            // Opzione B: Prova a inferire dalla spiegazione (se disponibile)
            // return inferCorrectAnswer(q);
          }
        }
        return q;
      })
      .filter(Boolean); // Rimuovi domande null

    if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
      return res.status(500).json({
        message:
          "L'AI non ha generato domande valide o il materiale non era sufficiente.",
        aiRawResponse: aiResponseString,
      });
    }

    const finalQuestions = generatedQuestions.map((q: any) => {
      let finalQuestionType = "";
      let finalOptions: { text: string }[] = [];
      let finalCorrectAnswer = "";

      const correctAnswer = q.correctAnswer as
        | string
        | number
        | boolean
        | undefined;

      // Normalizza un valore in lowercase string
      const normalize = (val: any) =>
        String(val ?? "")
          .toLowerCase()
          .trim();

      if (q.type === "true-false") {
        finalQuestionType = "true-false";

        // Opzioni mostrate sempre in inglese per coerenza con Angular
        finalOptions = [{ text: "True" }, { text: "False" }];

        const normalized = normalize(correctAnswer);

        // Gestione multilingua
        const trueValues = [
          "true",
          "vero",
          "vrai",
          "sí",
          "si",
          "ja",
          "verdadero",
          "wahr",
          "1",
          "yes",
          "y",
        ];
        const falseValues = ["false", "falso", "faux", "no", "n", "0", "nein"];

        const isTrue = trueValues.includes(normalized);
        const isFalse = falseValues.includes(normalized);

        // ⚠️ VALIDAZIONE ESPLICITA
        if (!isTrue && !isFalse) {
          console.warn(
            `[TRUE-FALSE WARNING] Unrecognized value: "${correctAnswer}" - Defaulting to False`
          );
          // Potresti anche rigettare la domanda invece di assumere False
        }

        finalCorrectAnswer = isTrue ? "True" : "False";
      } else if (q.type === "multiple-choice") {
        finalQuestionType = "multiple-choice";

        // Cast sicuro e cleaning
        const rawOptions = (q.options ?? []) as string[];
        let cleanedOptions = [
          ...new Set(
            rawOptions.map((opt) => opt.replace(/^[A-Z]\)\s*/, "").trim())
          ),
        ];

        // Ensure we have exactly 4 options for multiple-choice
        if (cleanedOptions.length < 4) {
          console.warn(
            `Question has only ${cleanedOptions.length} options, expected 4`
          );
        }

        // QUALITY CHECK: Validate option lengths for balance
        const optionWordCounts = cleanedOptions.map(
          (opt) => opt.split(" ").length
        );
        const correctAnswerWords = String(finalCorrectAnswer).split(" ").length;
        const avgWords =
          optionWordCounts.reduce((a, b) => a + b, correctAnswerWords) /
          (cleanedOptions.length + 1);

        if (correctAnswerWords > avgWords * 1.5) {
          console.warn(
            `Correct answer (${correctAnswerWords} words) significantly longer than average (${avgWords.toFixed(
              1
            )} words)`
          );
        }

        // Trova la risposta corretta
        if (
          typeof correctAnswer === "number" &&
          cleanedOptions[correctAnswer]
        ) {
          finalCorrectAnswer = cleanedOptions[correctAnswer];
        } else if (typeof correctAnswer === "string") {
          const normalizedCorrect = normalize(correctAnswer);
          const matchedOption = cleanedOptions.find(
            (opt) => normalize(opt) === normalizedCorrect
          );
          if (matchedOption) {
            finalCorrectAnswer = matchedOption;
          }
        }

        // Rimuovi duplicati della risposta corretta
        cleanedOptions = cleanedOptions.filter(
          (opt) => normalize(opt) !== normalize(finalCorrectAnswer)
        );

        // Reinserisci la corretta in cima
        finalOptions = [
          { text: finalCorrectAnswer },
          ...cleanedOptions.map((opt) => ({ text: opt })),
        ];
      } else {
        finalQuestionType = "open-ended-short";
        finalCorrectAnswer =
          typeof correctAnswer === "string" ? correctAnswer : "";
      }

      return {
        _id: new ObjectId(),
        questionText: q.question || "Question text not found",
        questionType: finalQuestionType,
        topic: q.topic || focusTopics || "",
        options: finalOptions,
        correctAnswer: finalCorrectAnswer,
        points: q.points || pointsValue,
        explanation: q.explanation || "",
        aiGenerated: true,
        difficulty: difficulty, // Add difficulty tracking
      };
    });

    return res.status(200).json({
      message: `${finalQuestions.length} domande generate con successo.`,
      questions: finalQuestions,
      difficulty: difficulty,
      cognitiveLevel: currentDifficultySpec.cognitiveLevel,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Errore server durante la generazione AI.",
      error: error.message,
    });
  }
};
