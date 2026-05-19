import { Types } from "mongoose";
import { connectDatabase } from "../../getDatabase";
import { Message } from "../../../models/schemas/message.schema";
import { generateConversationTitleGemini, generateConversationSummaryTitle } from "../../AI/generateConversationTitle";

export async function saveMessage(
  subjectId: Types.ObjectId,
  userId: Types.ObjectId,
  role: "user" | "agent",
  content: string,
  inputType: "text" | "voice" = "text",
  conversationId: string,
) {
  await connectDatabase();

  // Check if this is the first message in this conversation to generate a summary title
  const count = await Message.countDocuments({ conversationId });
  let conversationTitle: string | undefined = undefined;

  // Retrieve existing user messages to build an evolving summary of their real intent
  const userMessages = await Message.find({ conversationId, role: "user" }).select("content").lean();
  const allUserContents = [...userMessages.map(m => m.content), content];

  if (role === "user" && allUserContents.length <= 3) {
    try {
      console.log(`[saveMessage] Evolving summary title for user prompts: ${allUserContents.length} turns`);
      const mappedMessages = allUserContents.map(c => ({ role: "user", content: c }));
      const newTitle = await generateConversationSummaryTitle(mappedMessages);
      console.log(`[saveMessage] Evolved title: "${newTitle}"`);

      if (newTitle) {
        if (count === 0) {
          // Set directly on the first message
          conversationTitle = newTitle;
        } else {
          // Update the first message's title dynamically in the background!
          const firstMsg = await Message.findOne({ conversationId }).sort({ timestamp: 1 });
          if (firstMsg) {
            firstMsg.conversationTitle = newTitle;
            await firstMsg.save();
            console.log(`[saveMessage] Updated first message title to: "${newTitle}"`);
          }
        }
      }
    } catch (err) {
      console.error("Error generating/updating title in saveMessage:", err);
    }
  }

  const message = {
    subjectId: subjectId,
    userId: userId,
    conversationId,
    role,
    content,
    inputType,
    timestamp: new Date(),
    conversationTitle,
  };
  const result = await Message.insertOne(message);
  return result._id;
}
