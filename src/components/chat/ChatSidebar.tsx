import { useState } from "react";
import { Plus, MessageSquare, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

interface ChatSidebarProps {
  chats: Chat[];
  activeChat: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatSidebar({ 
  chats, 
  activeChat, 
  onChatSelect, 
  onNewChat, 
  isOpen, 
  onToggle 
}: ChatSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-chat-sidebar border-r border-border z-50 transition-transform duration-300 lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "w-80 shadow-sidebar"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Chat History</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggle}
            className="lg:hidden hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <Button 
            onClick={onNewChat}
            className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-glow hover:shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onChatSelect(chat.id)}
              className={cn(
                "w-full text-left p-4 hover:bg-muted/50 transition-colors border-l-2",
                activeChat === chat.id
                  ? "bg-muted border-l-primary"
                  : "border-l-transparent"
              )}
            >
              <div className="flex items-start space-x-3">
                <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {chat.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {chat.lastMessage}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {chat.timestamp}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="fixed top-4 left-4 z-30 lg:hidden bg-background/80 backdrop-blur-sm hover:bg-muted"
      >
        <Menu className="h-4 w-4" />
      </Button>
    </>
  );
}