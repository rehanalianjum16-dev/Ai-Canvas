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

function buildSystemPrompt(mode: 'standard' | 'web' | 'document'): string {
  const basePrompt = `You are an expert AI Canvas Assistant, a specialized design and diagramming AI integrated into a visual canvas tool.

Your primary purpose is to:
1. Help users create and manage diagrams, flowcharts, mind maps, and visual designs
2. Generate structured canvas commands and layouts
3. Provide concise, actionable guidance for canvas operations
4. Suggest design improvements and canvas organization strategies

Canvas Capabilities You Can Assist With:
- Creating shapes (rectangles, circles, triangles) with custom labels
- Building flowcharts, ERDs, mind maps, org charts
- Generating code snippets and documentation
- Analyzing documents and generating visual summaries
- Web research and visual presentation of findings

Communication Style:
- Be concise and direct (2-3 sentences max unless detailed explanation needed)
- Use action-oriented language ("I've created...", "I've added...")
- Proactively suggest next steps or related canvas operations
- When users request canvas modifications, confirm what was done

Mode-Specific Guidance:`;

  if (mode === 'web') {
    return basePrompt + `
- You have access to current web information
- Prioritize sourced, up-to-date data
- Organize web findings into visual formats when appropriate
- Cite sources naturally in your response`;
  }

  if (mode === 'document') {
    return basePrompt + `
- You're analyzing an uploaded document
- Extract key concepts, entities, and relationships
- Suggest visual representations (diagrams, charts, summaries)
- Provide structured insights the user can visualize on canvas`;
  }

  return basePrompt + `
- Focus on core canvas operations and design assistance
- Use fallback suggestions for unsupported features
- Maintain context from previous interactions when available`;
}

function createFallbackResponse(query: string): string {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return 'I\'m ready to help! You can ask me to create shapes, build diagrams, generate code, or analyze documents. What would you like to create?';
  }

  if (/flowchart|diagram|mind map|chart|organizational|hierarchy/i.test(normalizedQuery)) {
    return `I'll help you create a ${normalizedQuery.match(/\b\w+\b/)?.[0] || 'diagram'}. I can add nodes, connect them with lines, and organize the structure to make it clear and professional.`;
  }

  if (/code|component|function|class|react|typescript/i.test(normalizedQuery)) {
    return `I'll generate a clean code block for your ${normalizedQuery.match(/\w+/)?.[0] || 'code'}. You'll see it added to the canvas as a code element.`;
  }

  if (/circle|rectangle|triangle|shape|box/i.test(normalizedQuery)) {
    return `I'll add the requested shape to your canvas and style it appropriately for your design.`;
  }

  if (/color|style|design|format/i.test(normalizedQuery)) {
    return `I can help adjust the styling and appearance of your canvas elements to match your vision.`;
  }

  return `I understand you want to "${normalizedQuery}". I'll help you create or modify canvas elements to achieve this. What specifically would you like me to add or change?`;
}

async function streamAIResponse(
  messages: ChatMessage[],
  mode: 'standard' | 'web' | 'document'
): Promise<{
  response: string;
  mode: string;
  sources: [];
}> {
  const provider = getProviderConfig();

  if (!provider) {
    const fallback = createFallbackResponse(messages[messages.length - 1]?.content || '');
    return { response: fallback, mode: 'demo', sources: [] };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${provider.apiKey}`,
  };

  if (provider.provider === 'openrouter') {
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    headers['X-Title'] = 'AI Canvas';
  }

  try {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.7,
        top_p: 0.9,
        messages,
        max_tokens: 500,
        stream: true,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI provider error: ${response.status} - ${errorText}`);
      throw new Error(`AI provider failed: ${response.status}`);
    }

    let fullContent = '';
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Unable to read response stream');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
            }
          } catch {
            // Skip parse errors for malformed JSON
          }
        }
      }
    }

    if (!fullContent.trim()) {
      throw new Error('Empty response from AI provider');
    }

    return {
      response: fullContent.trim(),
      mode: 'live',
      sources: [],
    };
  } catch (error) {
    console.error('Streaming failed:', error);
    const fallback = createFallbackResponse(messages[messages.length - 1]?.content || '');
    return { response: fallback, mode: 'demo', sources: [] };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = typeof body?.message === 'string' ? body.message.trim() : '';
    const mode = (body?.mode || 'standard') as 'standard' | 'web' | 'document';
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!input) {
      return NextResponse.json(
        { error: 'Please enter a message for the AI assistant.' },
        { status: 400 }
      );
    }

    // Build message array with conversation history
    const messages: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt(mode) },
      ...history.filter(
        (msg: any) => msg.role === 'user' || msg.role === 'assistant'
      ),
      { role: 'user', content: input },
    ];

    // Limit context to last 10 messages + system prompt to avoid token bloat
    if (messages.length > 11) {
      const systemMsg = messages[0];
      messages.splice(1, messages.length - 11);
      messages.unshift(systemMsg);
    }

    const result = await streamAIResponse(messages, mode);
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
