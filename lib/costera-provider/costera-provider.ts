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
import { CosteraChatModelId, CosteraChatSettings } from './costera-chat-settings';

export interface CosteraProviderSettings {
    /**
     * Costera API key.
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
    /**
     * Debug flag.
     */
    debug?: boolean;
}

export interface CosteraProvider {
    /**
     * Creates a chat model for text generation.
     */
    (
        modelId: CosteraChatModelId,
        settings?: CosteraChatSettings,
    ): LanguageModelV1;

    /**
     * Creates a chat model for text generation.
     */
    chatModel(
        modelId: CosteraChatModelId,
        settings?: CosteraChatSettings,
    ): LanguageModelV1;

    completionModel(
        modelId: CosteraChatModelId,
        settings?: CosteraChatSettings,
    ): LanguageModelV1;
}

function getCommonModelConfig(options: CosteraProviderSettings = {}) {
    const baseURL = withoutTrailingSlash(
        options.baseURL ?? process.env.COSTERA_BACKEND_URL ?? 'https://luna-backend-gamma.vercel.app/api/'
    );

    const getHeaders = () => ({
        Authorization: `Bearer ${loadApiKey({
            apiKey: options.apiKey,
            environmentVariableName: 'COSTERA_BACKEND_API_KEY',
            description: 'Costera API key',
        })}`,
        ...options.headers,
    });

    return {
        provider: 'costera.chat',
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

export function createCostera(
    options: CosteraProviderSettings = {}
): CosteraProvider {
    const createChatModel = (
        modelId: CosteraChatModelId,
        settings: CosteraChatSettings = { model: modelId }
    ) => {
        return new OpenAICompatibleChatLanguageModel(modelId, settings, {
            ...getCommonModelConfig(options),
        });
    };

    const createCompletionModel = (
        modelId: CosteraChatModelId,
        settings: CosteraChatSettings = { model: modelId }
    ) => {
        return new OpenAICompatibleCompletionLanguageModel(modelId, settings, {
            ...getCommonModelConfig(options),
        });
    };

    const provider = (
        modelId: CosteraChatModelId,
        settings?: CosteraChatSettings
    ) => createChatModel(modelId, settings);

    provider.chatModel = createChatModel;
    provider.completionModel = createCompletionModel;

    return provider;
}

export const costera = createCostera();