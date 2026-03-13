import { useState } from 'react';
// 1. Import the ChatMessage type AND the useChat hook
import { useChat, ChatMessage as MessageType } from '@/hooks/useChat'; 
// 2. Import the ChatMessage component
import { ChatMessage } from '@/components/chat/ChatMessage'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send } from 'lucide-react';


const TestChat = () => {
    // messages is now correctly typed as MessageType[]
    const { messages, isLoading, sendMessage } = useChat();
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() === '' || isLoading) return;

        // Call the sendMessage function to initiate the API call to the proxy
        sendMessage(input);
        setInput('');
    };

    return (
        <div className="flex flex-col h-screen p-4 bg-background">
            <h2 className="text-3xl font-extrabold mb-4 text-center text-primary">
                Stage 3: Emotional AI Pipeline Complete
            </h2>
            <p className="text-center text-sm text-muted-foreground mb-4">
                Send a message to confirm the emotion detection and generation pipeline works.
            </p>
            
            {/* Chat History Display Area */}
            <Card className="flex-grow overflow-y-auto mb-4 border shadow-xl">
                <CardContent className="space-y-4 pt-6">
                    {messages.length === 0 ? (
                        <p className="text-center text-lg text-muted-foreground">
                            Start a chat to confirm the connection to http://localhost:3000...
                        </p>
                    ) : (
                        // Replace the complex inline rendering with the ChatMessage component
                        messages.map((msg, index) => (
                            <ChatMessage 
                                key={index} 
                                message={msg.content} 
                                isUser={msg.role === 'user'} 
                                // Use current time as a simple timestamp placeholder
                                timestamp={new Date().toLocaleTimeString()} 
                                emotion={msg.emotion}
                            />
                        ))
                    )}
                    {/* Loading Indicator */}
                    {isLoading && (
                         <div className="flex justify-start">
                             <div className="max-w-xs p-3 rounded-xl shadow-md bg-accent text-accent-foreground">
                                 <p className="animate-pulse">Bot is thinking...</p>
                             </div>
                         </div>
                     )}
                </CardContent>
            </Card>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex space-x-3">
                <Input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your test message here..."
                    disabled={isLoading}
                    className="flex-grow h-12 text-base"
                />
                <Button type="submit" disabled={isLoading} className="h-12 w-24">
                    <Send className="h-5 w-5" />
                    {isLoading ? 'Wait...' : 'Send'}
                </Button>
            </form>
        </div>
    );
};

// Export the component so it can be used in App.tsx
export default TestChat;
