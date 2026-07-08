import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "@/lib/static-motion";
import { X, Send, Loader2, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { TrpcProvider } from "@/lib/trpc-provider";
import { useEventTracking } from "@/hooks/useAnalytics";
import { useLanguage } from "@/contexts/LanguageContext";
import AILiveAvatarMark from "@/components/AILiveAvatarMark";
import {
  analyzeChatbotConversation,
  createSmartChatbotReply,
  type ChatbotMessage,
} from "@shared/chatbotIntelligence";
import { lineOfficialConfig } from "@shared/lineOfficial";
import LightMarkdown from "./LightMarkdown";

// ===== LINE SVG Icon =====
const LINEIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

// ===== SIRINX Bot Avatar =====
const BotAvatar = () => (
  <div className="sirinx-chat-avatar-mini w-8 h-8 rounded-full bg-[#07131f] ring-1 ring-cyan-300/40 flex items-center justify-center shrink-0 overflow-hidden shadow-lg shadow-cyan-500/15">
    <AILiveAvatarMark className="w-8 h-8" />
  </div>
);

type ChatMessage = ChatbotMessage;

const LINE_OA_URL_DEFAULT = lineOfficialConfig.addFriendUrl;

type FloatingChatWidgetProps = {
  initialOpen?: boolean;
};

const quickReplyKeyPairs = [
  ["chat.quickQuoteLabel", "chat.quickQuoteMessage"],
  ["chat.quickSavingsLabel", "chat.quickSavingsMessage"],
  ["chat.quickRooftopCarportLabel", "chat.quickRooftopCarportMessage"],
  ["chat.quickBessEvLabel", "chat.quickBessEvMessage"],
  ["chat.quickSurveyLabel", "chat.quickSurveyMessage"],
] as const;

function FloatingChatWidgetInner({
  initialOpen = false,
}: FloatingChatWidgetProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(initialOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [localReplyPending, setLocalReplyPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { trackEvent } = useEventTracking();
  const leadAnalysis = analyzeChatbotConversation(messages);
  const remoteChatEnabled = import.meta.env.VITE_ENABLE_REMOTE_CHAT === "true";

  const lineOaUrl =
    (typeof window !== "undefined" &&
      (window as any).__ENV__?.VITE_LINE_OA_URL) ||
    import.meta.env.VITE_LINE_OA_URL ||
    LINE_OA_URL_DEFAULT;

  // AI Chat mutation
  const chatMutation = trpc.chatbot.chat.useMutation({
    onSuccess: response => {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: response.reply },
      ]);
    },
    onError: (_error, request) => {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: createSmartChatbotReply(request.messages as ChatMessage[]),
        },
      ]);
    },
  });
  const isReplyPending = chatMutation.isPending || localReplyPending;

  // Show bubble after 5 seconds
  useEffect(() => {
    if (bubbleDismissed) return;
    const timer = setTimeout(() => {
      setShowBubble(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [bubbleDismissed]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isReplyPending]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setShowBubble(false);
    setBubbleDismissed(true);
    trackEvent("chatbot", "widget_open", { label: "floating_icon" });
  }, [trackEvent]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSend = useCallback(
    (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || isReplyPending) return;

      const userMsg: ChatMessage = { role: "user", content: msg };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");

      trackEvent("chatbot", "message_sent", { label: msg.substring(0, 50) });

      if (!remoteChatEnabled) {
        setLocalReplyPending(true);
        window.setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              role: "assistant",
              content: createSmartChatbotReply(newMessages),
            },
          ]);
          setLocalReplyPending(false);
        }, 350);
        return;
      }

      chatMutation.mutate({
        messages: newMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      });
    },
    [
      input,
      messages,
      isReplyPending,
      remoteChatEnabled,
      chatMutation,
      trackEvent,
    ]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLineClick = useCallback(() => {
    trackEvent("line_click", "line_oa_open", { label: "chatbot_widget" });
    window.open(lineOaUrl, "_blank");
  }, [lineOaUrl, trackEvent]);

  const displayMessages = messages.filter(m => m.role !== "system");

  return (
    <>
      {/* ===== FLOATING ICON ===== */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-4 right-3 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6"
          >
            {/* Bubble Message */}
            <AnimatePresence>
              {showBubble && !bubbleDismissed && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl px-4 py-3 max-w-[240px] border border-gray-200 dark:border-slate-700 cursor-pointer"
                  onClick={handleOpen}
                >
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setBubbleDismissed(true);
                      setShowBubble(false);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-400 dark:bg-slate-600 text-white flex items-center justify-center text-xs hover:bg-gray-500 transition-colors"
                    aria-label={t("chat.dismissBubbleAria")}
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-snug">
                    {t("chat.bubbleTitle")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("chat.bubbleDesc")}
                  </p>
                  {/* Triangle pointer */}
                  <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white dark:bg-slate-800 border-r border-b border-gray-200 dark:border-slate-700 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating contact dock: LINE + AI bot grouped in one row */}
            <div className="sirinx-floating-contact-dock flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 p-1.5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:gap-3 sm:p-2">
              <a
                href={lineOaUrl || lineOfficialConfig.addFriendUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={t("floating.lineAria")}
                title={t("footer.lineEyebrow")}
                onClick={() =>
                  trackEvent("line_click", "line_oa_open", {
                    label: "floating_contact_dock",
                  })
                }
                className="floating-line-cta group flex h-12 min-w-12 items-center justify-center gap-2 rounded-full bg-[#00C300] px-3 font-display text-[11px] font-bold uppercase tracking-[0.06em] text-white shadow-xl shadow-[#00C300]/25 transition-transform hover:-translate-y-0.5 hover:bg-[#00B300] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C300] sm:h-14 sm:min-w-14 sm:px-4 sm:text-xs sm:tracking-[0.08em]"
              >
                <LINEIcon className="h-5 w-5" />
                <span className="hidden sm:inline">LINE</span>
              </a>
              <motion.button
                onClick={handleOpen}
                aria-label={t("floating.botAria")}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="sirinx-live-avatar-trigger group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full shadow-2xl sm:h-16 sm:w-16"
                style={{
                  background:
                    "linear-gradient(135deg, #06b6d4 0%, #0d9488 50%, #00C300 100%)",
                }}
              >
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-full animate-ping bg-cyan-400 opacity-20" />
                <span className="sirinx-live-avatar-orbit sirinx-live-avatar-orbit-a" />
                <span className="sirinx-live-avatar-orbit sirinx-live-avatar-orbit-b" />
                <span className="sirinx-live-avatar-trail sirinx-live-avatar-trail-a" />
                <span className="sirinx-live-avatar-trail sirinx-live-avatar-trail-b" />
                {/* Inner glow */}
                <span className="absolute inset-1 rounded-full bg-gradient-to-br from-cyan-400/30 to-green-400/30 transition-all group-hover:from-cyan-400/50 group-hover:to-green-400/50" />
                {/* Icon */}
                <div className="sirinx-live-avatar-core relative flex items-center justify-center">
                  <AILiveAvatarMark className="h-12 w-12 drop-shadow-md sm:h-14 sm:w-14" />
                </div>
                {/* AI badge */}
                <div className="absolute -top-0.5 -right-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#00C300] text-[9px] font-bold text-white shadow-md">
                  AI
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== CHAT WIDGET ===== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 z-[60] w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-700/50"
            style={{
              background: "linear-gradient(180deg, #0f1729 0%, #0a1628 100%)",
            }}
          >
            {/* Header */}
            <div className="relative px-5 py-4 border-b border-slate-700/50">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-transparent" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <BotAvatar />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0f1729]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">
                      SIRINX Assistant
                    </h3>
                    <p className="text-xs text-cyan-400/80">
                      {t("chat.statusOnline")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full hover:bg-slate-700/50 flex items-center justify-center transition-colors"
                  aria-label={t("chat.closeAria")}
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin"
            >
              {displayMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 px-2">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-7 h-7 text-cyan-400" />
                    </div>
                    <h4 className="font-semibold text-white text-base mb-1.5">
                      {t("chat.welcomeTitle")}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {t("chat.welcomeDesc")}
                    </p>
                  </div>

                  {/* Quick Replies */}
                  <div className="w-full space-y-2">
                    {quickReplyKeyPairs.map(([labelKey, messageKey]) => {
                      const label = t(labelKey);
                      const message = t(messageKey);

                      return (
                      <button
                        key={labelKey}
                        onClick={() => handleSend(message)}
                        disabled={isReplyPending}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-700/60 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all text-sm text-slate-300 hover:text-cyan-300 disabled:opacity-50 flex items-center justify-between group"
                      >
                        <span>{label}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
                      </button>
                    );
                    })}
                  </div>

                  {/* LINE CTA */}
                  <button
                    onClick={handleLineClick}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00C300] hover:bg-[#00B300] text-white font-medium text-sm transition-colors shadow-lg shadow-green-500/20"
                  >
                    <LINEIcon className="w-5 h-5" />
                    <span>{t("chat.addLine")}</span>
                  </button>
                </div>
              ) : (
                <>
                  {displayMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex gap-2.5",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && <BotAvatar />}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                          msg.role === "user"
                            ? "bg-cyan-600 text-white rounded-br-md"
                            : "bg-slate-800 text-slate-200 rounded-bl-md border border-slate-700/50"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-li:my-0.5">
                            <LightMarkdown>{msg.content}</LightMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {isReplyPending && (
                    <div className="flex gap-2.5">
                      <BotAvatar />
                      <div className="bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-700/50">
                        <div className="flex gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick action after conversation */}
                  {displayMessages.length > 0 && !isReplyPending && (
                    <div className="flex gap-2 flex-wrap pt-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-200 text-xs font-medium">
                        <Zap className="w-3.5 h-3.5" />
                        <span>
                          {t("chat.knownFields")} {leadAnalysis.knownFields.length}/
                          {leadAnalysis.fieldCount}
                        </span>
                      </div>
                      <button
                        onClick={handleLineClick}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00C300]/10 border border-[#00C300]/30 text-[#00C300] text-xs font-medium hover:bg-[#00C300]/20 transition-colors"
                        aria-label={t("chat.transferLineAria")}
                      >
                        <LINEIcon className="w-3.5 h-3.5" />
                        {t("chat.transferLine")}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 border-t border-slate-700/50 bg-[#0a1628]/80 backdrop-blur-sm">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2 items-end"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label={t("chat.inputAria")}
                  placeholder={t("chat.inputPlaceholder")}
                  rows={1}
                  className="flex-1 bg-slate-800/80 border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none max-h-24 min-h-[38px]"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isReplyPending}
                  aria-label={t("chat.sendAria")}
                  className="shrink-0 h-[38px] w-[38px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-30"
                >
                  {isReplyPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
              <p className="text-[10px] text-slate-600 text-center mt-1.5">
                {t("chat.aiDisclaimer")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function FloatingChatWidget({
  initialOpen = false,
}: FloatingChatWidgetProps) {
  return (
    <TrpcProvider>
      <FloatingChatWidgetInner initialOpen={initialOpen} />
    </TrpcProvider>
  );
}
