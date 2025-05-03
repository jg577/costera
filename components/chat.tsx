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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-4 max-h-[400px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet. Start a conversation!</p>
          ) : (
            messages.map((message, i) => (
              <div 
                key={i}
                className={`p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : 'bg-muted mr-auto'
                } max-w-[80%]`}
              >
                {message.content}
              </div>
            ))
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 