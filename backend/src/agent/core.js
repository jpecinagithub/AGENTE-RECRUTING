import { chat } from '../llm/client.js'
import { buildMessages } from '../mcp/context-builder.js'
import { executeToolCalls } from '../mcp/tool-router.js'
import { extractAndSaveInferences } from '../mcp/memory-manager.js'
import { TOOL_SCHEMAS } from '../mcp/schemas.js'
import { Messages } from '../db/models.js'

export async function runAgent(userId, conversationId, userMessage, onChunk = null) {
  // Save user message
  await Messages.create(conversationId, userId, 'user', userMessage)

  // Build full context
  const messages = await buildMessages(userId, conversationId, userMessage)

  // First LLM call
  const response = await chat(messages, TOOL_SCHEMAS)

  let finalContent = response.content || ''
  let toolResults = []

  // Execute tool calls if any
  if (response.tool_calls?.length) {
    toolResults = await executeToolCalls(response.tool_calls, userId)

    // Build tool result messages for follow-up call
    const toolMessages = [
      { role: 'assistant', content: response.content || '', tool_calls: response.tool_calls },
      ...toolResults.map(tr => ({
        role: 'tool',
        tool_call_id: tr.call_id,
        content: JSON.stringify(tr.result || tr.error),
      })),
    ]

    // Follow-up LLM call with tool results
    const followUp = await chat([...messages, ...toolMessages])
    finalContent = followUp.content || ''
  }

  // Extract inferences for memory
  await extractAndSaveInferences(userId, userMessage, finalContent)

  // Save assistant response
  const metadata = toolResults.length ? { tools: toolResults.map(t => t.tool), results: toolResults } : null
  await Messages.create(conversationId, userId, 'assistant', finalContent, metadata)

  return {
    content: finalContent,
    tools_executed: toolResults.map(t => ({ tool: t.tool, success: !t.error })),
    job_results: toolResults.find(t => t.tool === 'search_jobs')?.result?.jobs || null,
  }
}

export async function runAgentStream(userId, conversationId, userMessage, ws) {
  await Messages.create(conversationId, userId, 'user', userMessage)
  const messages = await buildMessages(userId, conversationId, userMessage)

  ws.send(JSON.stringify({ type: 'start' }))

  let fullContent = ''

  try {
    const stream = await chat(messages, TOOL_SCHEMAS, true)

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) {
        fullContent += delta
        ws.send(JSON.stringify({ type: 'chunk', content: delta }))
      }
    }

    await Messages.create(conversationId, userId, 'assistant', fullContent)
    ws.send(JSON.stringify({ type: 'done', content: fullContent }))
  } catch (err) {
    ws.send(JSON.stringify({ type: 'error', message: err.message }))
  }
}
