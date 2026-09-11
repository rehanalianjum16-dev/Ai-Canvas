import { NextResponse } from 'next/server';
import { detectUserLanguage } from '../../../lib/mockServices';

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

Global language understanding:
- Detect the user's language automatically from the message text and continue in that language whenever possible.
- Support major world languages including English, Hindi, Urdu, Arabic, Spanish, French, Portuguese, German, Italian, Japanese, Korean, Chinese, Russian, and more.
- If the user writes in any non-English language, answer naturally in that language instead of defaulting to English.
- Even when the user uses mixed-language prompts, understand the intent and respond clearly in the most likely language.
- Keep the response natural, not robotic, and preserve simple, action-focused wording.

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
- Keep commands, labels, and explanations easy to understand across languages

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
  const language = detectUserLanguage(normalizedQuery);

  if (!normalizedQuery) {
    if (language === 'hi') return 'मैं तैयार हूँ! आप मुझे_shapes, diagram, code या document analysis बनाने के लिए कह सकते हैं। आप क्या बनाना चाहते हैं?';
    if (language === 'ur') return 'میں تیار ہوں! آپ مجھ سے shapes، diagrams، code یا document analysis بنانے کے لیے کہ سکتے ہیں۔ آپ کیا بنانا چاہتے ہیں؟';
    if (language === 'es') return 'Estoy listo para ayudarte. Puedes pedirme crear formas, diagramas, código o analizar documentos. ¿Qué quieres crear?';
    if (language === 'fr') return 'Je suis prêt à aider. Vous pouvez me demander de créer des formes, des diagrammes, du code ou d’analyser des documents. Que souhaitez-vous créer ?';
    if (language === 'ar') return 'أنا جاهز للمساعدة! يمكنك أن تطلب مني إنشاء أشكال أو مخططات أو أكواد أو تحليل مستندات. ماذا تريد أن تنشئ؟';
    return 'I\'m ready to help! You can ask me to create shapes, build diagrams, generate code, or analyze documents. What would you like to create?';
  }

  if (/flowchart|diagram|mind map|chart|organizational|hierarchy/i.test(normalizedQuery)) {
    const topic = normalizedQuery.match(/\b\w+\b/)?.[0] || 'diagram';
    if (language === 'hi') return `मैं आपके लिए ${topic} बनाने में मदद करूँगा। मैं नोड्स जोड़ सकता हूँ, लाइनों से जोड़ सकता हूँ और संरचना को साफ़ और प्रोफेशनल बना सकता हूँ।`;
    if (language === 'ur') return `میں آپ کے لیے ${topic} بنانے میں مدد کرتا ہوں۔ میں نوڈز شامل کر سکتا ہوں، لائنوں سے جوڑ سکتا ہوں، اور ڈیزائن کو واضح اور پیشہ ورانہ بنا سکتا ہوں۔`;
    if (language === 'es') return `Te ayudaré a crear un ${topic}. Puedo añadir nodos, conectarlos y organizar la estructura para que quede clara y profesional.`;
    if (language === 'fr') return `Je vais vous aider à créer un ${topic}. Je peux ajouter des nœuds, les relier et organiser la structure pour qu’elle soit claire et professionnelle.`;
    if (language === 'ar') return `سأساعدك في إنشاء ${topic}. يمكنني إضافة العقد وربطها وتنظيم البنية لجعلها واضحة واحترافية.`;
    return `I'll help you create a ${topic}. I can add nodes, connect them with lines, and organize the structure to make it clear and professional.`;
  }

  if (/code|component|function|class|react|typescript/i.test(normalizedQuery)) {
    const topic = normalizedQuery.match(/\w+/)?.[0] || 'code';
    if (language === 'hi') return `मैं आपके ${topic} के लिए एक साफ़ कोड ब्लॉक बनाऊँगा। इसे कैनवास पर कोड तत्व के रूप में जोड़ दिया जाएगा।`;
    if (language === 'ur') return `میں آپ کے ${topic} کے لیے ایک صاف کوڈ بلاک بناؤں گا۔ اسے کینوس پر کوڈ عنصر کے طور پر شامل کر دیا جائے گا۔`;
    if (language === 'es') return `Generaré un bloque de código limpio para tu ${topic}. Lo verás añadido al lienzo como un elemento de código.`;
    if (language === 'fr') return `Je vais générer un bloc de code propre pour votre ${topic}. Vous le verrez ajouté au canevas comme élément de code.`;
    if (language === 'ar') return `سأنشئ كتلة كود نظيفة لـ ${topic}. ستظهر على اللوحة كعنصر كود.`;
    return `I'll generate a clean code block for your ${topic}. You'll see it added to the canvas as a code element.`;
  }

  if (/circle|rectangle|triangle|shape|box/i.test(normalizedQuery)) {
    if (language === 'hi') return 'मैं आपके लिए आवश्यक आकृति को कैनवास पर जोड़ दूँगा और उसे सही 스타일 में तैयार कर दूँगा।';
    if (language === 'ur') return 'میں آپ کے لیے مطلوبہ شکل کو کینوس پر شامل کر دوں گا اور اسے مناسب انداز میں اسٹائل کروں گا۔';
    if (language === 'es') return 'Añadiré la forma solicitada al lienzo y la ajustaré con el estilo adecuado.';
    if (language === 'fr') return 'J’ajouterai la forme demandée au canevas et la styliserai correctement.';
    if (language === 'ar') return 'سأضيف الشكل المطلوب إلى اللوحة وأضبطه بالنمط المناسب.';
    return 'I\'ll add the requested shape to your canvas and style it appropriately for your design.';
  }

  if (/color|style|design|format/i.test(normalizedQuery)) {
    if (language === 'hi') return 'मैं कैनवास के तत्वों की स्टाइलिंग और रूपरेखा को आपके विचार के अनुसार समायोजित कर सकता हूँ।';
    if (language === 'ur') return 'میں کینوس کے عناصر کی اسٹائلنگ اور ظاہری شکل کو آپ کے خیال کے مطابق ایڈجسٹ کر سکتا ہوں۔';
    if (language === 'es') return 'Puedo ayudar a ajustar el estilo y la apariencia de los elementos del lienzo para que coincidan con tu visión.';
    if (language === 'fr') return 'Je peux aider à ajuster le style et l’apparence des éléments du canevas pour correspondre à votre vision.';
    if (language === 'ar') return 'يمكنني المساعدة في ضبط تصميم ومظهر عناصر اللوحة وفقًا لفكرتك.';
    return 'I can help adjust the styling and appearance of your canvas elements to match your vision.';
  }

  if (language === 'hi') return `मुझे लगता है आप "${normalizedQuery}" का मतलब समझ रहे हैं। मैं आपके लिए इसे कैनवास तत्वों में बनाकर या बदलकर पूरा करूँगा। आप क्या जोड़ना या बदलना चाहते हैं?`;
  if (language === 'ur') return `میں سمجھتا ہوں کہ آپ کا مطلب "${normalizedQuery}" ہے۔ میں آپ کے لیے اسے کینوس عناصر میں بنا یا تبدیل کر کے دکھاؤں گا۔ آپ کیا شامل یا تبدیل کرنا چاہتے ہیں؟`;
  if (language === 'es') return `Entiendo que quieres "${normalizedQuery}". Te ayudaré a crear o modificar elementos del lienzo para lograrlo. ¿Qué te gustaría añadir o cambiar?`;
  if (language === 'fr') return `Je comprends que vous voulez "${normalizedQuery}". Je vais vous aider à créer ou modifier des éléments du canevas pour y parvenir. Que voulez-vous ajouter ou modifier ?`;
  if (language === 'ar') return `أفهم أنك تريد "${normalizedQuery}". سأساعدك في إنشاء أو تعديل عناصر اللوحة لتحقيق ذلك. ماذا تريد أن تضيف أو تغير؟`;

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
