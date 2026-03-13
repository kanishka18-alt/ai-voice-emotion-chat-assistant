import { useState, useRef, useEffect } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messages: Message[];
}

const Index = () => {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      title: "Welcome Chat",
      lastMessage: "Hello! How can I help you today?",
      timestamp: "2 min ago",
      messages: [
        {
          id: "1",
          content: "Hello! I'm your AI assistant. How can I help you today?",
          isUser: false,
          timestamp: "2 min ago"
        }
      ]
    }
  ]);
  const [activeChat, setActiveChat] = useState<string>("1");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const getCurrentChat = () => {
    return chats.find(chat => chat.id === activeChat);
  };

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Add user message
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === activeChat 
          ? { 
              ...chat, 
              messages: [...chat.messages, newMessage],
              lastMessage: message,
              timestamp: "now"
            }
          : chat
      )
    );

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "That's an interesting question! Let me think about that...",
        "I understand what you're asking. Here's my perspective on that topic.",
        "Great question! I'd be happy to help you with that.",
        "That's a thoughtful inquiry. Let me provide you with some insights.",
        "I can definitely assist you with that. Here's what I think..."
      ];
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: responses[Math.floor(Math.random() * responses.length)],
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === activeChat 
            ? { 
                ...chat, 
                messages: [...chat.messages, aiResponse],
                lastMessage: aiResponse.content,
                timestamp: "now"
              }
            : chat
        )
      );
      
      setIsLoading(false);
    }, 1500);
  };

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `New Chat ${chats.length}`,
      lastMessage: "Start a new conversation",
      timestamp: "now",
      messages: []
    };

    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat.id);
    setSidebarOpen(false);
    
    toast({
      title: "New chat created",
      description: "You can now start a fresh conversation.",
    });
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
    setSidebarOpen(false);
  };

  const currentChat = getCurrentChat();

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        chats={chats}
        activeChat={activeChat}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Chat Header */}
        <div className="border-b border-border bg-background/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {currentChat?.title || "AI Chat"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Powered by Advanced AI
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {currentChat?.messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md mx-auto p-8">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-foreground">
                    Start a Conversation
                  </h2>
                  <p className="text-muted-foreground">
                    Ask me anything! I'm here to help with questions, creative tasks, analysis, and more.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {currentChat?.messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message.content}
                    isUser={message.isUser}
                    timestamp={message.timestamp}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          placeholder="Ask me anything..."
        />
      </div>
    </div>
  );
};

export default Index;