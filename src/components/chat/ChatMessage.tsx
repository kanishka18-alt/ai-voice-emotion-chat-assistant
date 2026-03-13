import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: string;
    // Add the new optional prop to display the detected emotion
  emotion?: string; 
}

export function ChatMessage({ message, isUser, timestamp, emotion }: ChatMessageProps) {
  // Determine colors based on role (isUser)
  const messageBg = isUser 
    ? "bg-gradient-message text-primary-foreground ml-auto rounded-br-none" 
    : "bg-chat-bot-message text-foreground rounded-tl-none";
  
  const timestampColor = isUser ? "text-primary-foreground/70" : "text-muted-foreground";

  return (
    <div className={cn(
      "flex items-start space-x-3 p-4 transition-all duration-300",
      isUser ? "justify-end" : "justify-start"
    )}>
      {/* Bot Icon */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
      
      {/* Message Bubble */}
      <div className={cn(
        "max-w-[80%] rounded-xl p-4 shadow-message", // Adjusted to rounded-xl for consistency
        messageBg
      )}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message}
        </p>
        
        {/* New: Display the detected emotion if available (and it's a bot message) */}
        {!isUser && emotion && (
            <p className="text-xs mt-2 opacity-80 italic font-medium text-blue-400">
                Emotion Detected: {emotion.toUpperCase()}
            </p>
        )}

        {/* Timestamp */}
        <p className={cn(
          "text-xs mt-2 opacity-70",
          timestampColor
        )}>
          {timestamp}
        </p>
      </div>

      {/* User Icon */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
