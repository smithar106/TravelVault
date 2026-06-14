const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chat(messages: DeepSeekMessage[]): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${body}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices[0].message.content;
}

export async function parseBookingEmail(emailText: string): Promise<Record<string, unknown>> {
  const systemPrompt = `Extract booking details from this email. Return only valid JSON (no markdown, no backticks):
{
  "booking_type": "flight|hotel|car|activity|other",
  "provider_name": "string",
  "confirmation_number": "string or null",
  "starts_at": "ISO8601 string",
  "ends_at": "ISO8601 string",
  "origin_city": "string or null (flights only)",
  "destination_city": "string",
  "destination_country": "string",
  "location_address": "string or null"
}`;

  const result = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: emailText },
  ]);

  const jsonStr = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
}

export async function generateDestinationGuide(
  city: string,
  country: string,
  dates: string,
  travelerProfile: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const systemPrompt = `You are a local expert travel guide. Generate a guide for ${city}, ${country}, ${dates}.
Traveler profile: ${JSON.stringify(travelerProfile)}.
Return only valid JSON (no markdown, no backticks):
{
  "restaurants": [{"name": "string", "cuisine": "string", "price_range": "$|$$|$$$", "why_worth_it": "string"}],
  "hidden_gems": [{"name": "string", "description": "string"}],
  "avoid": [{"thing": "string", "reason": "string"}],
  "safety": "string",
  "packing_list": [{"item": "string", "category": "clothing|electronics|toiletries|documents|other", "reason": "string"}],
  "currency": "string",
  "tipping": "string",
  "transit": "string",
  "plug_adapter": "string",
  "language_tips": "string",
  "weather_summary": "string"
}`;

  const result = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Generate a travel guide for ${city}, ${country}` },
  ]);

  const jsonStr = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
}

export async function generateTravelPersonality(profile: Record<string, unknown>): Promise<string> {
  const result = await chat([
    {
      role: 'system',
      content: `You are a travel personality expert. Based on this traveler's profile, write a 2-3 sentence paragraph describing their travel personality in an engaging, insightful way. Just return the paragraph text, no JSON. Profile: ${JSON.stringify(profile)}`,
    },
  ]);
  return result.trim();
}

export async function generateNearbySuggestions(
  city: string,
  neighborhood: string,
  timeOfDay: string,
  profileTags: string[]
): Promise<Record<string, unknown>> {
  const systemPrompt = `Act as a local guide. Suggest what to do right now in ${neighborhood}, ${city} (time: ${timeOfDay}) for a traveler with style tags: ${profileTags.join(', ')}.
Return only valid JSON:
{
  "suggestions": [{"name": "string", "description": "string", "why_now": "string", "category": "food|drink|sightseeing|shopping|activity"}],
  "weather_note": "string"
}`;

  const result = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `What should I do now in ${neighborhood}, ${city}?` },
  ]);

  const jsonStr = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
}
