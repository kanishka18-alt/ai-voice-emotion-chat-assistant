import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'; // shadcn assumed
import { Input } from './components/ui/input'; // shadcn assumed
import { Button } from './components/ui/button'; // shadcn assumed
import { ScrollArea } from './components/ui/scroll-area'; // shadcn assumed
import { Loader2, Send } from 'lucide-react'; // icons

// --- Type Definitions ---
interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  emotion?: string;
  timestamp: Date;
}

// --- Component ---

const App: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  // Using the absolute URL that was stabilized during our previous debugging steps
  const BACKEND_URL = 'http://localhost:3000/api/chat'; 
  
  // Scrolls to the bottom of the chat area whenever history updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory]);

  // --- Core Chat Logic (Kept Simple) ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const userMessageContent = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    // 1. Create and add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessageContent,
      timestamp: new Date(),
    };
    setChatHistory(prev => [...prev, userMessage]);

    // 2. Call the backend API
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessageContent }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // We expect the backend to return 'response' and 'emotion'
      const data: { response: string, emotion: string } = await response.json();

      // 3. Create and add bot message
      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'bot',
        content: data.response,
        emotion: data.emotion,
        timestamp: new Date(),
      };
      setChatHistory(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("API call failed:", error);
      // Add a simple error message to the chat
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'bot',
        content: "I'm sorry, I couldn't connect to the wellness service. Please check the server and try again.",
        emotion: 'ERROR',
        timestamp: new Date(),
      };
      setChatHistory(prev => [...prev, errorMsg]);

    } finally {
      setIsSending(false);
    }
  };
  
  // --- UI Helpers: Emotion Styling ---

  // Function to map emotion to a color/icon for display polish
  const getEmotionStyle = (emotion: string) => {
    switch (emotion) {
      case 'SADNESS': return { color: 'text-indigo-500', bg: 'bg-indigo-100', icon: '😭' };
      case 'JOY': return { color: 'text-yellow-500', bg: 'bg-yellow-100', icon: '😊' };
      case 'ANGER': return { color: 'text-red-500', bg: 'bg-red-100', icon: '😡' };
      case 'FEAR': return { color: 'text-gray-500', bg: 'bg-gray-100', icon: '😨' };
      case 'LOVE': return { color: 'text-pink-500', bg: 'bg-pink-100', icon: '🥰' };
      case 'SURPRISE': return { color: 'text-purple-500', bg: 'bg-purple-100', icon: '😮' };
      default: return { color: 'text-gray-500', bg: 'bg-gray-200', icon: '💬' };
    }
  };

  // --- Render UI ---
  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-gray-50 font-sans antialiased">
      <Card className="w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl rounded-xl">
        <CardHeader className="bg-indigo-600 text-white rounded-t-xl py-4">
          <CardTitle className="text-2xl">
            Wellness AI Assistant
          </CardTitle>
          <p className="text-sm opacity-80">
            I'm here to listen and offer empathetic advice.
          </p>
        </CardHeader>
        <CardContent className="flex-1 p-4 overflow-hidden relative">
          <ScrollArea ref={scrollRef} className="h-full pr-4">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-8">
                <p className="text-lg font-medium mb-2">Welcome!</p>
                <p className="text-sm">
                  Start by telling me how you feel, and I'll offer a supportive response.
                </p>
              </div>
            ) : (
              chatHistory.map((msg) => {
                const isUser = msg.role === 'user';
                // Determine styling based on emotion, defaulting if emotion is missing
                const style = msg.emotion ? getEmotionStyle(msg.emotion) : getEmotionStyle('DEFAULT');
                
                return (
                  <div 
                    key={msg.id} 
                    className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] p-4 rounded-xl shadow-md ${
                        isUser 
                          ? 'bg-indigo-500 text-white rounded-br-none' 
                          : `${style.bg} rounded-tl-none border border-gray-200`
                      }`}
                    >
                      {!isUser && msg.emotion && (
                        <div className={`text-xs font-semibold mb-1 ${style.color}`}>
                          {style.icon} Detected: {msg.emotion}
                        </div>
                      )}
                      <p className={`whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-800'}`}>
                        {msg.content}
                      </p>
                      <span className={`block mt-1 text-xs ${isUser ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            {/* Typing Indicator */}
            {isSending && (
              <div className="flex justify-start mb-4">
                 <div className="max-w-[80%] p-4 rounded-xl shadow-md bg-gray-200 rounded-tl-none border border-gray-300 text-gray-700">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2 text-indigo-500" />
                    <span className="text-sm">AI is responding...</span>
                 </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <div className="p-4 border-t bg-white rounded-b-xl">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              type="text"
              placeholder="Tell me what's on your mind..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 p-3 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg shadow-inner"
              disabled={isSending}
            />
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg shadow-md transition duration-150"
              disabled={isSending || !inputMessage.trim()}
            >
              {isSending ? (
                <Loader2 className="h-5 w-5" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default App;
