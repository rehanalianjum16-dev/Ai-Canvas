import { NextResponse } from 'next/server';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
}

const createDemoResults = (query: string): SearchResult[] => {
  const encodedQuery = encodeURIComponent(query);
  return [
    {
      title: `Demo search result for “${query}”`,
      url: `https://www.google.com/search?q=${encodedQuery}`,
      snippet: 'Demo mode is active. Add TAVILY_API_KEY on the server to retrieve live web results and current information.',
      source: 'Demo search',
    },
    {
      title: `${query} - Wikipedia search`,
      url: `https://en.wikipedia.org/w/index.php?search=${encodedQuery}`,
      snippet: 'Open this search to explore background information related to the requested topic.',
      source: 'Wikipedia',
    },
  ];
};

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  try {
    const query = typeof body?.query === 'string' ? body.query.trim() : '';

    if (!query) {
      return NextResponse.json({ error: 'Please enter a search topic.' }, { status: 400 });
    }
    if (query.length > 500) {
      return NextResponse.json({ error: 'Search topics must be 500 characters or fewer.' }, { status: 400 });
    }

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      const results = createDemoResults(query);
      return NextResponse.json({
        mode: 'demo',
        answer: `Demo web search results for “${query}”. Add TAVILY_API_KEY to enable live internet research.`,
        results,
      });
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        topic: 'general',
        max_results: 6,
        include_answer: true,
        include_raw_content: false,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'The web search provider returned an error.' }, { status: 502 });
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      return NextResponse.json({ error: 'The web search provider returned an invalid response.' }, { status: 502 });
    }
    const results: SearchResult[] = (Array.isArray(data.results) ? data.results : [])
      .filter((result: TavilyResult) => {
        if (typeof result?.title !== 'string' || typeof result.url !== 'string') return false;
        try {
          const url = new URL(result.url);
          return url.protocol === 'https:' || url.protocol === 'http:';
        } catch {
          return false;
        }
      })
      .map((result: TavilyResult) => {
        const url = new URL(result.url as string);
        return {
          title: result.title as string,
          url: url.toString(),
          snippet: typeof result.content === 'string' ? result.content : 'No preview available.',
          source: url.hostname.replace(/^www\./, ''),
        };
      });

    return NextResponse.json({
      mode: 'live',
      answer: typeof data.answer === 'string' ? data.answer : `Here are the latest results for “${query}”.`,
      results,
    });
  } catch (error) {
    console.error('Web search failed:', error);
    return NextResponse.json({ error: 'Unable to search the web right now. Please try again.' }, { status: 500 });
  }
}
