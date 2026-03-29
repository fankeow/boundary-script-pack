export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { scenario, situation, tone } = req.body;

  if (!scenario || !situation || !tone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const systemPrompt = `You are a boundary-setting coach writing on behalf of Dan Lim (Danny Bunny), life coach and creator of The Circle, a community built around Personal Sovereignty.

Your job: write a ready-to-use boundary script the user can say out loud, send as a message, or adapt as needed.

RULES:
- Write in first person ("I"), as if the user is speaking
- No bullet points, no headers, no labels — just the words
- Flowing, human, natural speech — not clinical or stiff
- Match the tone instruction exactly
- Open by acknowledging the relationship or person with genuine care
- State the boundary clearly without apologising for having it
- Briefly name the impact or need (to connect, not to justify)
- Close with an open, grounded invitation — not a demand
- No em dashes anywhere
- 100 to 180 words only
- Output only the script itself, nothing else`;

  const userPrompt = `Boundary context: ${scenario}\n\nWhat's happening:\n${situation}\n\nTone: ${tone}\n\nWrite the script.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const script = data.content?.[0]?.text || '';
    return res.status(200).json({ script });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
