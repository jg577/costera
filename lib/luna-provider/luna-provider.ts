import { LanguageModelV1 } from '@ai-sdk/provider';
import {
    OpenAICompatibleChatLanguageModel,
    OpenAICompatibleCompletionLanguageModel,
} from '@ai-sdk/openai-compatible';
import {
    FetchFunction,
    loadApiKey,
    withoutTrailingSlash,
} from '@ai-sdk/provider-utils';
import { LunaChatModelId, LunaChatSettings } from './luna-chat-settings';

export interface LunaProviderSettings {
    /**
     * Luna API key.
     */
    apiKey?: string;
    /**
     * Base URL for the API calls.
     */
    baseURL?: string;
    /**
     * Custom headers to include in the requests.
     */
    headers?: Record<string, string>;
    /**
     * Optional custom url query parameters to include in request urls.
     */
    queryParams?: Record<string, string>;
    /**
     * Custom fetch implementation.
     */
    fetch?: FetchFunction;
}

export interface LunaProvider {
    /**
     * Creates a chat model for text generation.
     */
    (
        modelId: LunaChatModelId,
        settings?: LunaChatSettings,
    ): LanguageModelV1;

    /**
     * Creates a chat model for text generation.
     */
    chatModel(
        modelId: LunaChatModelId,
        settings?: LunaChatSettings,
    ): LanguageModelV1;

    completionModel(
        modelId: LunaChatModelId,
        settings?: LunaChatSettings,
    ): LanguageModelV1;
}

function getCommonModelConfig(options: LunaProviderSettings = {}) {
    const baseURL = withoutTrailingSlash(
        options.baseURL ?? process.env.LUNA_BACKEND_URL ?? 'https://luna-backend-gamma.vercel.app/api/'
    );

    const getHeaders = () => ({
        Authorization: `Bearer ${loadApiKey({
            apiKey: options.apiKey,
            environmentVariableName: 'LUNA_BACKEND_API_KEY',
            description: 'Luna API key',
        })}`,
        ...options.headers,
    });

    return {
        provider: 'luna.chat',
        url: ({ path }: { path: string }) => {
            const url = new URL(`${baseURL}${path}`);
            if (options.queryParams) {
                url.search = new URLSearchParams(options.queryParams).toString();
            }
            return url.toString();
        },
        headers: getHeaders,
        fetch: options.fetch,
        defaultObjectGenerationMode: 'tool' as const
    };
}

export function createLuna(
    options: LunaProviderSettings = {}
): LunaProvider {
    const createChatModel = (
        modelId: LunaChatModelId,
        settings: LunaChatSettings = {}
    ) => {
        return new OpenAICompatibleChatLanguageModel(modelId, settings, {
            ...getCommonModelConfig(options),
        });
    };

    const createCompletionModel = (
        modelId: LunaChatModelId,
        settings: LunaChatSettings = {}
    ) => {
        return new OpenAICompatibleCompletionLanguageModel(modelId, settings, {
            ...getCommonModelConfig(options),
        });
    };

    const provider = (
        modelId: LunaChatModelId,
        settings?: LunaChatSettings
    ) => createChatModel(modelId, settings);

    provider.chatModel = createChatModel;
    provider.completionModel = createCompletionModel;

    return provider;
}

export const luna = createLuna();