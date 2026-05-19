import OpenAI from 'openai'
import 'dotenv/config'

const isMock = !process.env.LLM_API_KEY || process.env.LLM_API_KEY === 'sk-your-key-here'

const client = isMock ? null : new OpenAI({
  baseURL: process.env.LLM_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.LLM_API_KEY,
})

const MODEL = process.env.LLM_MODEL || 'qwen-plus-2025-09-11'

const MOCK_RESPONSES = [
  "I understand you're looking for job opportunities. Let me search for relevant positions based on your preferences.",
  "I've updated your job preferences. I'll use these to find the most relevant opportunities for you.",
  "Here are the latest job matches I found based on your profile. Would you like me to refine the search?",
  "I've saved that job to your shortlist. You can view all saved jobs in the Job Feed panel.",
]

export async function chat(messages, tools = null, stream = false) {
  if (isMock) {
    const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]
    if (stream) return mockStream(response)
    return { content: response, tool_calls: null }
  }

  const params = {
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  }

  if (tools?.length) {
    params.tools = tools
    params.tool_choice = 'auto'
  }

  if (stream) {
    return client.chat.completions.create({ ...params, stream: true })
  }

  try {
    const response = await client.chat.completions.create(params)
    const choice = response.choices[0]
    return {
      content: choice.message.content,
      tool_calls: choice.message.tool_calls || null,
      finish_reason: choice.finish_reason,
    }
  } catch (err) {
    // Retry without tools if model doesn't support function calling
    if (tools?.length && (err.message?.includes('tool') || err.message?.includes('function') || err.status === 400)) {
      console.warn('[llm] Model does not support tools, retrying without tool schemas')
      delete params.tools
      delete params.tool_choice
      const response = await client.chat.completions.create(params)
      const choice = response.choices[0]
      return { content: choice.message.content, tool_calls: null, finish_reason: choice.finish_reason }
    }
    throw err
  }
}

async function* mockStream(text) {
  const words = text.split(' ')
  for (const word of words) {
    yield { choices: [{ delta: { content: word + ' ' } }] }
    await new Promise(r => setTimeout(r, 50))
  }
}

export { isMock, MODEL }
