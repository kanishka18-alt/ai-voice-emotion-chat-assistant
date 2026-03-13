import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast'; 

export interface ChatMessage {
    role: 'user' | 'bot';
    content: string;
    emotion?: string; 
}

export const useChat = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast(); 
    
    // *** CRITICAL FIX: Explicitly pointing to the server running on port 3000 ***
    const BACKEND_URL = 'http://localhost:3000/api/chat'; 

    const sendMessage = async (userMessage: string) => {
        // 1. Add user message to the chat history immediately
        const userMsg: ChatMessage = { role: 'user', content: userMessage };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            // 2. Make the POST request to the secure backend proxy
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage }),
            });

            if (!response.ok) {
                // Handle non-200 responses (e.g., 400 or 500 errors from the backend)
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    throw new Error(errorData.response || `HTTP error! status: ${response.status}`);
                } else {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}. Server returned non-JSON data.`);
                }
            }

            // 3. Process the response from the server proxy (Keys: 'response' and 'emotion')
            const data: { response: string, emotion: string } = await response.json();

            // 4. Add the bot's response to the chat history
            const botMsg: ChatMessage = { 
                role: 'bot', 
                content: data.response, 
                emotion: data.emotion
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error("Chat API Error:", error);
            
            // Show a destructive toast notification for connection issues
            toast({
                title: "Connection Error",
                description: `Could not communicate with the AI proxy. Error: ${error.message}`,
                variant: "destructive",
            });
            
            // Add a simple error message to the chat history
            const errorMsg: ChatMessage = { 
                role: 'bot', 
                content: "An internal error occurred. Please check the console for details." 
            };
            setMessages(prev => [...prev, errorMsg]);
            
        } finally {
            setIsLoading(false);
        }
    };

    return { messages, isLoading, sendMessage };
};
