import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const MODEL_NAME = "gemini-2.5-flash";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1/models/" +
  MODEL_NAME +
  ":generateContent";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! How can I help you?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto-scroll fix
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${GEMINI_URL}?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              ...messages.map((m) => ({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.content }],
              })),
              { role: "user", parts: [{ text: userMessage.content }] },
            ],
          }),
        }
      );

      const data = await response.json();
      console.log("Gemini Response:", data);

      const aiReply =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text)
          .join(" ") || "I couldn't generate a response.";

      setMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: " + err.message },
      ]);
    }

    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary",
          isOpen && "rotate-90"
        )}
        size="icon"
      >
        {isOpen ? <X /> : <MessageCircle />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-card border rounded-lg shadow-xl z-50 flex flex-col max-h-[500px]">

          {/* Header */}
          <div className="p-4 border-b bg-primary/10 rounded-t-lg">
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Ask anything...</p>
          </div>

          {/* Messages (Fixed Scroller) */}
          <div
            ref={chatRef}
            className="flex-1 p-4 overflow-y-auto space-y-4"
            style={{ maxHeight: "350px" }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-white"
                      : "bg-muted text-foreground"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
              />
              <Button onClick={sendMessage} disabled={isLoading} size="icon">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send />}
              </Button>
            </div>
          </div>

        </div>
      )}
    </>
  );
};

export default Chatbot;
