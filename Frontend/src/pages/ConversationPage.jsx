import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Send, ArrowLeft, Check, CheckCheck, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { messageService } from "../api/misc.service";
import { connectChatSocket, getChatSocket } from "../api/chatSocket";
import { useAuthStore } from "../store/authStore";
import { Spinner } from "../components/ui/States";

const MAX_MESSAGE_LENGTH = 299;

const formatMessageTime = (date) =>
  new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(date));

const formatMessageDate = (date) => {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (messageDate.toDateString() === today.toDateString()) return "Today";
  if (messageDate.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(messageDate);
};

const ConversationPage = () => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [chatJoined, setChatJoined] = useState(false);
  const { user } = useAuthStore();
  const messagesRef = useRef(null);
  const bottomRef = useRef(null);
  const messagesLoadedRef = useRef(false);
  const loadingOlderRef = useRef(false);
  const loadedAllHistoryRef = useRef(false);
  const typingTimerRef = useRef(null);
  const typingStatusRef = useRef(false);

  const scrollToBottom = (behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
    setShowNewMessages(false);
  };

  const loadMessages = () => {
    messageService
      .getMessages(conversationId)
      .then((res) => {
        setConversation(res.data.conversation);
        const container = messagesRef.current;
        const wasNearBottom = !container || container.scrollHeight - container.scrollTop - container.clientHeight < 80;
        setMessages((currentMessages) => {
          const knownIds = new Set(currentMessages.map((message) => message._id));
          const newMessages = res.data.messages.filter((message) => !knownIds.has(message._id));
          if (messagesLoadedRef.current && newMessages.length > 0 && !wasNearBottom) {
            setShowNewMessages(true);
          }
          if (currentMessages.length === 0) return res.data.messages;
          const responseById = new Map(res.data.messages.map((message) => [message._id, message]));
          const refreshedMessages = currentMessages.map((message) => {
            const updatedMessage = responseById.get(message._id);
            return updatedMessage ? { ...message, isRead: updatedMessage.isRead } : message;
          });
          return [...refreshedMessages, ...newMessages];
        });
        if (!messagesLoadedRef.current) {
          setHasOlderMessages(res.data.pagination.hasMore);
        } else if (!loadedAllHistoryRef.current && res.data.pagination.hasMore) {
          setHasOlderMessages(true);
        }
        messagesLoadedRef.current = true;
        if (wasNearBottom) requestAnimationFrame(() => scrollToBottom("auto"));
      })
      .catch(() => toast.error("Failed to load messages"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setMessages([]);
    setConversation(null);
    setLoading(true);
    setHasOlderMessages(false);
    setShowNewMessages(false);
    setIsOnline(false);
    setIsTyping(false);
    setSocketConnected(false);
    setChatJoined(false);
    typingStatusRef.current = false;
    messagesLoadedRef.current = false;
    loadedAllHistoryRef.current = false;
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    const socket = connectChatSocket();
    const joinConversation = () => {
      setSocketConnected(true);
      socket.emit("conversation:join", conversationId, (result) => {
        setChatJoined(Boolean(result?.success));
      });
    };
    const handlePresenceUpdate = ({ userId, isOnline: online }) => {
      if (String(userId) !== String(user?._id)) setIsOnline(online);
    };
    const handleTypingUpdate = (update) => {
      if (
        update?.conversationId === conversationId &&
        String(update.userId) !== String(user?._id)
      ) {
        setIsTyping(update.isTyping);
      }
    };
    const handleSocketMessage = ({ conversationId: messageConversationId, message }) => {
      if (messageConversationId !== conversationId || !message?._id) return;
      const container = messagesRef.current;
      const wasNearBottom = !container ||
        container.scrollHeight - container.scrollTop - container.clientHeight < 80;
      setMessages((currentMessages) => {
        if (currentMessages.some((current) => current._id === message._id)) return currentMessages;
        if (!wasNearBottom) setShowNewMessages(true);
        return [...currentMessages, message];
      });
      if (wasNearBottom) requestAnimationFrame(() => scrollToBottom());
    };
    const handleSocketDisconnect = () => {
      setSocketConnected(false);
      setChatJoined(false);
      setIsOnline(false);
      setIsTyping(false);
    };
    socket.on("connect", joinConversation);
    socket.on("disconnect", handleSocketDisconnect);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("typing:update", handleTypingUpdate);
    socket.on("message:new", handleSocketMessage);
    if (socket.connected) joinConversation();

    return () => {
      clearInterval(interval);
      clearTimeout(typingTimerRef.current);
      typingStatusRef.current = false;
      if (socket.connected) socket.emit("conversation:leave", conversationId);
      socket.off("connect", joinConversation);
      socket.off("disconnect", handleSocketDisconnect);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("typing:update", handleTypingUpdate);
      socket.off("message:new", handleSocketMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user?._id]);

  const otherParticipant = conversation?.participants?.find((participant) => participant._id !== user?._id);

  const loadOlderMessages = async () => {
    if (loadingOlderRef.current || messages.length === 0) return;

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    const container = messagesRef.current;
    const previousScrollHeight = container?.scrollHeight || 0;

    try {
      const res = await messageService.getMessages(conversationId, {
        before: messages[0]._id,
      });
      setMessages((currentMessages) => {
        const knownIds = new Set(currentMessages.map((message) => message._id));
        const olderMessages = res.data.messages.filter((message) => !knownIds.has(message._id));
        return [...olderMessages, ...currentMessages];
      });
      setHasOlderMessages(res.data.pagination.hasMore);
      if (!res.data.pagination.hasMore) loadedAllHistoryRef.current = true;
      requestAnimationFrame(() => {
        if (container) container.scrollTop += container.scrollHeight - previousScrollHeight;
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load older messages");
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  };

  const handleMessagesScroll = () => {
    const container = messagesRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
    if (isNearBottom) setShowNewMessages(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const socket = getChatSocket();
      if (typingStatusRef.current) {
        socket?.emit("typing:update", { conversationId, isTyping: false });
        typingStatusRef.current = false;
      }
      clearTimeout(typingTimerRef.current);
      const res = await messageService.sendMessage(conversationId, text);
      setMessages((currentMessages) =>
        currentMessages.some((message) => message._id === res.data.message._id)
          ? currentMessages
          : [...currentMessages, res.data.message]
      );
      setText("");
      requestAnimationFrame(() => scrollToBottom());
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const updateMessageDraft = (nextText) => {
    setText(nextText);
    const socket = getChatSocket();
    if (!socket?.connected) return;

    if (nextText.trim() && !typingStatusRef.current) {
      socket.emit("typing:update", { conversationId, isTyping: true });
      typingStatusRef.current = true;
    }
    if (!nextText.trim() && typingStatusRef.current) {
      socket.emit("typing:update", { conversationId, isTyping: false });
      typingStatusRef.current = false;
    }

    clearTimeout(typingTimerRef.current);
    if (nextText.trim()) {
      typingTimerRef.current = setTimeout(() => {
        socket.emit("typing:update", { conversationId, isTyping: false });
        typingStatusRef.current = false;
      }, 900);
    }
  };

  const handleMessageChange = (event) => {
    updateMessageDraft(event.target.value.slice(0, MAX_MESSAGE_LENGTH));
  };

  const handleMessagePaste = (event) => {
    const input = event.currentTarget;
    const pastedText = event.clipboardData.getData("text");
    const selectionStart = input.selectionStart ?? text.length;
    const selectionEnd = input.selectionEnd ?? text.length;
    const remainingLength =
      MAX_MESSAGE_LENGTH - (text.length - (selectionEnd - selectionStart));

    if (pastedText.length <= remainingLength) return;

    event.preventDefault();
    const insertedText = pastedText.slice(0, Math.max(0, remainingLength));
    const nextText =
      text.slice(0, selectionStart) + insertedText + text.slice(selectionEnd);
    updateMessageDraft(nextText);

    requestAnimationFrame(() => {
      const cursorPosition = selectionStart + insertedText.length;
      input.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] w-full max-w-4xl flex-col bg-white px-0 sm:h-[calc(100dvh-2rem)] sm:px-4 sm:py-4">
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden border-y border-ink-100 bg-[#f3f1ed] sm:rounded-2xl sm:border sm:shadow-sm">
        <header className="z-10 flex shrink-0 items-center gap-3 border-b border-ink-100 bg-white px-3 py-3 sm:px-5">
          <Link
            to="/messages"
            aria-label="Back to messages"
            className="rounded-full p-2 text-ink-500 transition hover:bg-ink-50 hover:text-ink-900"
          >
            <ArrowLeft size={19} />
          </Link>
          {otherParticipant && (
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-denim text-sm font-semibold text-white">
              {otherParticipant.avatar?.url ? (
                <img src={otherParticipant.avatar.url} alt="" className="h-full w-full object-cover" />
              ) : (
                otherParticipant.name?.charAt(0)?.toUpperCase()
              )}
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                  isOnline ? "bg-emerald-500" : "bg-ink-300"
                }`}
                aria-label={isOnline ? "Online" : "Offline"}
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">{otherParticipant?.name || "Conversation"}</p>
            <p className={`truncate text-xs ${isTyping ? "font-medium text-emerald-700" : "text-ink-500"}`}>
              {isTyping
                ? "typing…"
                : socketConnected
                  ? chatJoined ? isOnline ? "Online" : "Offline" : "Status unavailable"
                  : "Reconnecting to chat…"}
            </p>
          </div>
          {socketConnected && chatJoined && (
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live chat
            </span>
          )}
        </header>

        <div
          ref={messagesRef}
          onScroll={handleMessagesScroll}
          className="relative flex-1 space-y-2 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4"
        >
          <div className="mx-auto mb-4 flex max-w-xl items-start justify-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-center text-[11px] leading-4 text-ink-500 shadow-sm">
            <LockKeyhole size={13} className="mt-0.5 shrink-0 text-ink-400" aria-hidden="true" />
            <p>Never share passwords, OTPs, or payment PINs in chat.</p>
          </div>
          {loading ? (
            <Spinner label="Loading messages..." />
          ) : messages.length === 0 ? (
            <div className="mx-auto mt-8 max-w-xs rounded-2xl bg-white/90 px-5 py-4 text-center shadow-sm">
              <p className="text-sm font-semibold text-ink-800">Your conversation starts here</p>
              <p className="mt-1 text-xs leading-5 text-ink-500">Say hello and keep your conversation respectful and safe.</p>
            </div>
          ) : (
            <>
              {hasOlderMessages && (
                <div className="flex justify-center pb-2">
                  <button
                    type="button"
                    disabled={loadingOlder}
                    onClick={loadOlderMessages}
                    className="btn-outline px-3 py-1.5 text-xs"
                  >
                    {loadingOlder ? "Loading..." : "Load older messages"}
                  </button>
                </div>
              )}
              {messages.map((m, index) => {
                const isMine = m.sender._id === user?._id;
                const previousMessage = messages[index - 1];
                const showDate = !previousMessage ||
                  new Date(previousMessage.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
                return (
                  <div key={m._id}>
                    {showDate && (
                      <div className="my-3 flex justify-center">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-ink-500 shadow-sm">
                          {formatMessageDate(m.createdAt)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[88%] rounded-2xl px-3.5 pb-1.5 pt-2.5 text-sm shadow-sm sm:max-w-[75%] ${
                          isMine
                            ? "rounded-br-md bg-[#d9fdd3] text-ink-900"
                            : "rounded-bl-md bg-white text-ink-900"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <div className="mt-1 flex items-center justify-end gap-1">
                          <time className="text-[10px] text-ink-500" dateTime={m.createdAt}>
                            {formatMessageTime(m.createdAt)}
                          </time>
                          {isMine && (
                            m.isRead
                              ? <CheckCheck size={14} className="text-sky-600" aria-label="Read" />
                              : <Check size={14} className="text-ink-400" aria-label="Sent" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {isTyping && (
            <p className="text-xs italic text-ink-500" aria-live="polite">
              {otherParticipant?.name || "Participant"} is typing…
            </p>
          )}
          <div ref={bottomRef} />
          {showNewMessages && (
            <button
              type="button"
              onClick={() => scrollToBottom()}
              className="sticky bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-amber px-3 py-1.5 text-xs font-semibold text-ink-900 shadow"
            >
              New messages ↓
            </button>
          )}
        </div>

        <form onSubmit={handleSend} className="flex shrink-0 items-center gap-2 border-t border-ink-100 bg-white p-3 sm:px-4">
          <div className="min-w-0 flex-1">
            <input
              className="w-full rounded-full border-0 bg-ink-50 px-4 py-3 text-sm text-ink-900 outline-none ring-0 placeholder:text-ink-400 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none"
              placeholder="Type a message"
              aria-label="Type a message"
              aria-describedby="message-character-count"
              maxLength={MAX_MESSAGE_LENGTH}
              value={text}
              onChange={handleMessageChange}
              onPaste={handleMessagePaste}
            />
            <span id="message-character-count" className="mt-1 block text-right text-[10px] text-ink-400">
              {text.length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>
          <button
            disabled={sending || !text.trim()}
            type="submit"
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-ink-200"
          >
            <Send size={16} />
          </button>
        </form>
      </section>
    </div>
  );
};

export default ConversationPage;
