import { NextResponse } from 'next/server';

type ChatRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

function getProviderConfig() {
  const openAIApiKey = process.env.OPENAI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;

  if (openAIApiKey) {
    return {
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: openAIApiKey,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    };
  }

  if (groqApiKey) {
    return {
      provider: 'groq',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: groqApiKey,
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    };
  }

  if (openRouterApiKey) {
    return {
      provider: 'openrouter',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: openRouterApiKey,
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    };
  }

  return null;
}

function createFallbackResponse(query: string): string {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return 'I am ready to help you create or edit the canvas. Ask me to add shapes, build a diagram, or summarize a document.';
  }

  if (/flowchart|diagram|mind map|chart/i.test(normalizedQuery)) {
    return `I can create a clear ${normalizedQuery} for your canvas. I can turn it into boxes, arrows, and grouped sections so it is easy to review.`;
  }

  if (/code|component|react/i.test(normalizedQuery)) {
    return `I can generate a clean code block for your ${normalizedQuery}. I will keep the structure simple and useful for the canvas workflow.`;
  }

  if (/blue|rectangle|circle|triangle|shape/i.test(normalizedQuery)) {
    return `I can add the requested shape to the canvas and adjust the design around your ${normalizedQuery} idea.`;
  }

  return `I understand your request: “${normalizedQuery}”. I can help turn it into a canvas element, diagram, or clear visual structure.`;
}

async function getAIResponse(messages: ChatMessage[]) {
  const provider = getProviderConfig();

  if (!provider) {
    return {
      response: createFallbackResponse(messages[messages.length - 1]?.content || ''),
      mode: 'demo',
      sources: [],
    };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${provider.apiKey}`,
  };

  if (provider.provider === 'openrouter') {
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    headers['X-Title'] = 'AI Canvas';
  }

  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.7,
      messages,
      max_tokens: 500,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI provider failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('The AI provider returned an empty response.');
  }

  return {
    response: content.trim(),
    mode: 'live',
    sources: [],
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = typeof body?.message === 'string' ? body.message.trim() : '';
    const mode = body?.mode || 'standard';

    if (!input) {
      return NextResponse.json({ error: 'Please enter a message for the AI assistant.' }, { status: 400 });
    }

    const systemPrompt = `You are AI Canvas Assistant inside a design tool. Help the user create diagrams, shapes, flowcharts, code snippets, or summaries. Keep responses brief, useful, and action-oriented. When the user asks to create something on a canvas, explain what was created in a natural way. Mode: ${mode}.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input },
    ];

    const result = await getAIResponse(messages);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Chat API failed:', error);
    const body = await request.clone().json().catch(() => ({}));
    const fallbackMessage = typeof body?.message === 'string' ? body.message : 'your request';

    return NextResponse.json(
      {
        response: createFallbackResponse(fallbackMessage),
        mode: 'demo',
        sources: [],
      },
      { status: 200 }
    );
  }
}
