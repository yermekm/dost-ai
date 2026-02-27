export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { messages, system, model, max_tokens } = req.body;

    if (!messages || !system) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ─── STEP 1: Check if web search is needed ───
    const lastUserMsg = messages[messages.length - 1];
    const lastText = typeof lastUserMsg.content === 'string'
      ? lastUserMsg.content
      : lastUserMsg.content?.find(c => c.type === 'text')?.text || '';

    const needsSearch = shouldSearch(lastText);
    let searchContext = '';

    if (needsSearch) {
      searchContext = await searchLaws(lastText, system);
    }

    // ─── STEP 2: Build enhanced system prompt ───
    const today = new Date().toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    let enhancedSystem = system + `\n\nТекущая дата: ${today}.`;

    if (searchContext) {
      enhancedSystem += `\n\n═══ АКТУАЛЬНАЯ ИНФОРМАЦИЯ ИЗ ИНТЕРНЕТА (${today}) ═══\n${searchContext}\n═══ КОНЕЦ ДАННЫХ ═══\n\nИСПОЛЬЗУЙ эти актуальные данные в своём ответе. Ссылайся на конкретные статьи и указывай дату последней редакции. Если есть ссылки на официальные источники — включай их в ответ через тег <div class="tag law">.`;
    }

    // ─── STEP 3: Call Claude ───
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 1500,
        system: enhancedSystem,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── Decide if web search is needed ───
function shouldSearch(text) {
  if (!text) return false;

  const legalKeywords = [
    // Russian
    'закон', 'статья', 'кодекс', 'права', 'штраф', 'налог', 'трудов',
    'пенсия', 'льгот', 'пособи', 'суд', 'иск', 'жалоб', 'договор',
    'регистрац', 'лицензи', 'гарантия', 'возврат', 'компенсац',
    'выплат', 'увольнен', 'отпуск', 'зарплат', 'МРОТ', 'ТК', 'ГК', 'КоАП',
    // English
    'law', 'legal', 'rights', 'article', 'code', 'fine', 'tax', 'labor',
    'pension', 'benefit', 'court', 'claim', 'contract', 'regulation',
    'minimum wage', 'labor code',
    // Kazakh
    'заң', 'құқық', 'айыппұл',
    // Turkish
    'kanun', 'hukuk', 'haklar', 'ceza', 'sözleşme', 'vergi'
  ];

  const textLower = text.toLowerCase();
  return legalKeywords.some(kw => textLower.includes(kw));
}

// ─── Search current laws via Perplexity ───
async function searchLaws(userQuery, systemPrompt) {
  try {
    // Extract country from system prompt
    const countryMatch = systemPrompt.match(/user(?:.*?)in ([^(]+)\(([A-Z]{2})\)/i);
    const country = countryMatch ? countryMatch[1].trim() : '';
    const year = new Date().getFullYear();

    const searchPrompt = `Найди актуальную юридическую информацию на ${year} год по вопросу: "${userQuery}"
${country ? `Страна: ${country}` : ''}

Предоставь кратко:
1. Применимый закон/статья с точным названием и номером
2. Год последней редакции
3. Ключевые положения по данному вопросу
4. Ссылка на официальный государственный портал

Только актуальные данные ${year} года. Отвечай на том же языке что и вопрос.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://dost-ai.life',
        'X-Title': 'Dost.AI Legal Assistant'
      },
      body: JSON.stringify({
        model: 'perplexity/sonar',
        max_tokens: 800,
        messages: [{ role: 'user', content: searchPrompt }]
      })
    });

    if (!response.ok) {
      console.error('Perplexity error:', response.status);
      return '';
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';

    if (result) {
      const today = new Date().toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
      return `[Веб-поиск: ${today}]\n\n${result}`;
    }

    return '';

  } catch (err) {
    console.error('Search error:', err);
    return ''; // fallback — answer without search if error
  }
}
