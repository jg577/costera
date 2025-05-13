import React from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatProps {
  onSendMessage?: (message: string) => Promise<void>;
  isLoading?: boolean;
  messages?: ChatMessage[];
}

export function Chat({ onSendMessage, isLoading = false, messages = [] }: ChatProps) {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !onSendMessage) return;
    
    await onSendMessage(input);
    setInput('');
  };

  return (
    <Card className="w-full max-w-full border border-gray-200 shadow-sm">
      <CardHeader className="bg-blue-50 border-b border-gray-200">
        <CardTitle className="text-xl md:text-3xl font-bold text-gray-900">Chat</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col gap-4 mb-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-base md:text-lg text-gray-500">No messages yet. Start a conversation!</p>
          ) : (
            messages.map((message, i) => (
              <div 
                key={i}
                className={`p-3 md:p-4 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white ml-auto' 
                    : 'bg-white border border-gray-200 mr-auto'
                } max-w-[80%] text-sm md:text-lg`}
              >
                {message.content}
              </div>
            ))
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2 md:gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 text-sm md:text-lg border border-gray-200 focus:border-blue-300 focus:ring-blue-300"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="text-sm md:text-lg bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 