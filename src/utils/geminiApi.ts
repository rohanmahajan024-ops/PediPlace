const API_KEY = 'AIzaSyCdx2jl6h2aG35hSnYodvnEx99LoFxrLlo';

export async function generateGeminiResponse(prompt: string, context: string = ''): Promise<string> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Context: ${context}\n\nPrompt: ${prompt}`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate response');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response at this time.';
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    return 'Sorry, I could not generate a response at this time.';
  }
}