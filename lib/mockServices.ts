import { ChatSource } from '../store/useCanvasStore';

export const mockWebSearch = async (query: string): Promise<{ text: string; sources: ChatSource[] }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        text: `Based on a quick web search for "${query}", here is a summarized overview. AI continues to evolve rapidly, particularly in generative models and edge computing. Companies are focusing on optimizing transformer architectures to reduce latency and resource usage while maintaining high output quality.`,
        sources: [
          {
            title: "The Future of Generative AI",
            source: "Tech Insights",
            url: "https://example.com/ai-future",
            snippet: "An in-depth look at how generative models will scale in the coming decade..."
          },
          {
            title: "2026 AI Enterprise Report",
            source: "Global Analytics",
            url: "https://example.com/ai-report",
            snippet: "Enterprise adoption of AI tools has reached an all-time high, focusing on integrated workflow automation..."
          }
        ]
      });
    }, 1500); // simulate network delay
  });
};

export const mockDocumentAnalysis = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let summary = "";
      
      if (ext === 'pdf') {
        summary = `Extracted from PDF (${file.name}): This document outlines the quarterly financial projections and key marketing strategies for Q3. Key focus areas include expanding digital footprint and optimizing customer retention.`;
      } else if (ext === 'csv') {
        summary = `Parsed CSV Data (${file.name}): Found 342 rows. Top performing categories are Electronics and Home Goods. Revenue shows a 12% MoM increase.`;
      } else {
        summary = `Analyzed Document (${file.name}): Contains general text data detailing standard operational procedures.`;
      }
      
      resolve(summary);
    }, 2000); // simulate parsing delay
  });
};
