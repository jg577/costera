import { OpenAICompatibleChatSettings } from '@ai-sdk/openai-compatible';

export type CosteraChatModelId = 'costera/chat-model' | (string & {});

export interface CosteraChatSettings extends OpenAICompatibleChatSettings {
    // Add any custom settings here
    baseURL?: string;
    model: CosteraChatModelId;
} 