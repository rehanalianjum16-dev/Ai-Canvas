import { ChatSource } from '../store/useCanvasStore';

const translations: Record<string, Record<string, string>> = {
  hi: {
    "I've created a basic e-commerce flowchart for you.": 'मैंने आपके लिए एक बेसिक ई-कॉमर्स फ्लोचार्ट बना दिया है।',
    "I generated a React component code block for you.": 'मैंने आपके लिए React कंपोनेंट का कोड ब्लॉक बना दिया है।',
    "I've created a School Management ER diagram.": 'मैंने आपके लिए स्कूल मैनेजमेंट ER डायग्राम बना दिया है।',
    'Created a mind map on the canvas.': 'कैनवास पर माइंड मैप बना दिया गया है।',
  },
  ur: {
    "I've created a basic e-commerce flowchart for you.": 'میں نے آپ کے لیے ایک بنیادی ای کامرس فلو چارٹ بنا دیا ہے۔',
    "I generated a React component code block for you.": 'میں نے آپ کے لیے React component کا کوڈ بلاک بنا دیا ہے۔',
    "I've created a School Management ER diagram.": 'میں نے آپ کے لیے اسکول مینجمنٹ ER ڈایاگرام بنا دیا ہے۔',
    'Created a mind map on the canvas.': 'کینوس پر مائنڈ میپ بنا دیا گیا ہے۔',
  },
  es: {
    "I've created a basic e-commerce flowchart for you.": 'He creado un diagrama de flujo básico de comercio electrónico para ti.',
    "I generated a React component code block for you.": 'He generado un bloque de código de componente React para ti.',
    'Created a mind map on the canvas.': 'He creado un mapa mental en el lienzo.',
  },
  fr: {
    "I've created a basic e-commerce flowchart for you.": "J'ai créé un organigramme e-commerce de base pour vous.",
    "I generated a React component code block for you.": "J'ai généré un bloc de code de composant React pour vous.",
    'Created a mind map on the canvas.': "J'ai créé une carte mentale sur le canevas.",
  },
};

const detectResponseLanguage = (query: string): string => {
  if (/[\u0600-\u06ff]/.test(query)) return /[\u0679\u0686\u0698\u06af]/.test(query) ? 'ur' : 'ar';
  if (/[\u0900-\u097f]/.test(query)) return 'hi';
  const lowerQuery = query.toLowerCase();
  if (/\b(jis|mrzi|mujhe|aap|apko|mein|mn|kry|karo|karen|den|do|chahiye|bana|bna)\b/.test(lowerQuery)) return 'ur';
  if (/\b(que|qué|como|cómo|para|por favor|quiero|crear)\b/.test(lowerQuery)) return 'es';
  if (/\b(comment|pour|avec|bonjour|créer|créez)\b/.test(lowerQuery)) return 'fr';
  return 'en';
};

export const localizeChatResponse = (query: string, response: string): string => {
  const language = detectResponseLanguage(query);
  const translated = translations[language]?.[response];
  if (translated) return translated;

  if (language === 'ur') {
    if (/^Added a rectangle named /.test(response)) return response.replace(/^Added a rectangle named /, 'میں نے یہ مستطیل شامل کیا: ');
    if (response === 'Moved the object to the right.') return 'آبجیکٹ کو دائیں طرف منتقل کر دیا گیا ہے۔';
    if (response === "Changed the selected object's color to blue.") return 'منتخب آبجیکٹ کا رنگ نیلا کر دیا گیا ہے۔';
    if (response === 'Deleted the selected object.') return 'منتخب آبجیکٹ حذف کر دیا گیا ہے۔';
    if (response.includes("didn't understand that command")) return 'معذرت، میں یہ کمانڈ سمجھ نہیں سکا۔ شکل شامل کرنے، کوڈ بنانے یا ڈایاگرام تیار کرنے کو کہیں۔';
  }

  return response;
};

export const mockWebSearch = async (query: string): Promise<{ text: string; sources: ChatSource[] }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const normalizedQuery = query.trim().replace(/\s+/g, ' ');
      const encodedQuery = encodeURIComponent(normalizedQuery);
      const queryLabel = normalizedQuery || 'your topic';
      const language = detectResponseLanguage(normalizedQuery);
      const searchText = language === 'hi'
        ? `"${queryLabel}" के लिए कुछ शुरुआती स्रोत मिले हैं। डेमो सर्च लाइव तथ्यों की पुष्टि नहीं कर सकता, इसलिए नवीनतम जानकारी के लिए लिंक जांचें।`
        : language === 'ur'
          ? `"${queryLabel}" کے لیے کچھ ابتدائی ذرائع ملے ہیں۔ ڈیمو سرچ تازہ معلومات کی تصدیق نہیں کر سکتی، اس لیے لنکس ضرور دیکھیں۔`
          : language === 'es'
            ? `Encontré algunos puntos de partida para "${queryLabel}". La búsqueda de demostración no verifica datos actuales, así que revisa los enlaces para confirmar la información.`
            : language === 'fr'
              ? `J'ai trouvé quelques points de départ pour "${queryLabel}". La recherche de démonstration ne vérifie pas les faits en direct, vérifiez donc les liens pour les détails récents.`
              : `I found a few starting points for "${queryLabel}". The demo search cannot verify live facts, so use the linked results to check the latest details.`;
      resolve({
        text: searchText,
        sources: [
          {
            title: `Google results for ${queryLabel}`,
            source: "Google",
            url: `https://www.google.com/search?q=${encodedQuery}`,
            snippet: `Search current articles, documentation, and discussions about ${queryLabel}.`
          },
          {
            title: `Wikipedia search for ${queryLabel}`,
            source: "Wikipedia",
            url: `https://en.wikipedia.org/w/index.php?search=${encodedQuery}`,
            snippet: `Look for an introductory overview and related concepts connected to ${queryLabel}.`
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
