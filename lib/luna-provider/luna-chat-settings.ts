import { OpenAICompatibleChatSettings } from '@ai-sdk/openai-compatible';

export type LunaChatModelId = 'luna/chat-model' | (string & {});

export interface LunaChatSettings extends OpenAICompatibleChatSettings {
    // Add any custom settings here
    baseURL?: string;
} 