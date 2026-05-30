import {
  createSmartChatbotReply,
  type ChatbotMessage,
} from "@shared/chatbotIntelligence";

export const createFallbackChatbotReply = (messages: ChatbotMessage[]) =>
  createSmartChatbotReply(messages);
