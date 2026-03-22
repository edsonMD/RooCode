const API_BASE_URL = 'https://api.piramyd.cloud/v1'

/**
 * Busca a lista de modelos disponíveis da API.
 */
export async function fetchModels(apiKey) {
  if (!apiKey) {
    throw new Error('API Key não configurada.')
  }

  const response = await fetch(`${API_BASE_URL}/models`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    let errorMsg = `Erro ${response.status}: `
    try {
      const errorData = await response.json()
      errorMsg += errorData.error?.message || errorData.message || response.statusText
    } catch {
      errorMsg += response.statusText
    }
    throw new Error(errorMsg)
  }

  const data = await response.json()
  // API OpenAI-compatible returns { data: [...] }
  return data.data || data || []
}

/**
 * Categoriza um modelo pelo nome para apresentação na UI.
 */
export function categorizeModel(modelId) {
  const id = modelId.toLowerCase()

  if (id.includes('gpt-4o')) return { provider: 'OpenAI', icon: '🟢', tier: 'premium', family: 'GPT-4o' }
  if (id.includes('gpt-4-turbo')) return { provider: 'OpenAI', icon: '🟢', tier: 'premium', family: 'GPT-4 Turbo' }
  if (id.includes('gpt-4')) return { provider: 'OpenAI', icon: '🟢', tier: 'premium', family: 'GPT-4' }
  if (id.includes('gpt-3.5')) return { provider: 'OpenAI', icon: '🟢', tier: 'standard', family: 'GPT-3.5' }
  if (id.includes('o1') || id.includes('o3') || id.includes('o4')) return { provider: 'OpenAI', icon: '🟢', tier: 'premium', family: 'o-series' }

  if (id.includes('claude-3.5') || id.includes('claude-3-5')) return { provider: 'Anthropic', icon: '🟠', tier: 'premium', family: 'Claude 3.5' }
  if (id.includes('claude-3') || id.includes('claude-4')) return { provider: 'Anthropic', icon: '🟠', tier: 'premium', family: 'Claude' }
  if (id.includes('claude')) return { provider: 'Anthropic', icon: '🟠', tier: 'standard', family: 'Claude' }

  if (id.includes('gemini-2') || id.includes('gemini-1.5-pro')) return { provider: 'Google', icon: '🔵', tier: 'premium', family: 'Gemini' }
  if (id.includes('gemini')) return { provider: 'Google', icon: '🔵', tier: 'standard', family: 'Gemini' }

  if (id.includes('llama-3.3') || id.includes('llama-3.1-405') || id.includes('llama-3.1-70')) return { provider: 'Meta', icon: '🟣', tier: 'premium', family: 'Llama' }
  if (id.includes('llama')) return { provider: 'Meta', icon: '🟣', tier: 'standard', family: 'Llama' }

  if (id.includes('mixtral') || id.includes('mistral-large') || id.includes('mistral-medium')) return { provider: 'Mistral', icon: '🔴', tier: 'premium', family: 'Mistral' }
  if (id.includes('mistral')) return { provider: 'Mistral', icon: '🔴', tier: 'standard', family: 'Mistral' }

  if (id.includes('deepseek')) return { provider: 'DeepSeek', icon: '🟤', tier: 'standard', family: 'DeepSeek' }
  if (id.includes('qwen')) return { provider: 'Alibaba', icon: '🟡', tier: 'standard', family: 'Qwen' }
  if (id.includes('command')) return { provider: 'Cohere', icon: '⚪', tier: 'standard', family: 'Command' }

  if (id.includes('dall-e') || id.includes('stable-diffusion') || id.includes('midjourney')) return { provider: 'Image', icon: '🎨', tier: 'image', family: 'Image Gen' }

  if (id.includes('whisper') || id.includes('tts')) return { provider: 'Audio', icon: '🎵', tier: 'audio', family: 'Audio' }

  if (id.includes('text-embedding') || id.includes('embedding')) return { provider: 'Embedding', icon: '📐', tier: 'utility', family: 'Embedding' }

  return { provider: 'Outro', icon: '⚙️', tier: 'standard', family: 'Outro' }
}

/**
 * Converte um ficheiro em base64.
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Verifica se um ficheiro é uma imagem.
 */
export function isImageFile(file) {
  return file.type.startsWith('image/')
}

/**
 * Formata o tamanho de um ficheiro para exibição.
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/**
 * Envia uma requisição de chat completions com streaming.
 * Suporta mensagens com texto, imagens e ficheiros.
 * A API Key é lida diretamente do localStorage e enviada apenas
 * para a API do Piramyd Cloud — nunca para outro destino.
 */
export async function sendChatRequest({ messages, model, temperature, maxTokens, systemPrompt, apiKey, onChunk, onDone, onError, signal }) {
  if (!apiKey) {
    onError?.('API Key não configurada. Vá em Configurações para adicioná-la.')
    return
  }

  // Prepend system message if exists
  const fullMessages = []
  if (systemPrompt && systemPrompt.trim()) {
    fullMessages.push({ role: 'system', content: systemPrompt.trim() })
  }

  // Build messages with support for multimodal content
  for (const m of messages) {
    if (m.role === 'error') continue

    if (m.attachments && m.attachments.length > 0) {
      // Multimodal message with attachments
      const contentParts = []

      // Add text if present
      if (m.content) {
        contentParts.push({ type: 'text', text: m.content })
      }

      // Add image attachments as image_url
      for (const att of m.attachments) {
        if (att.type === 'image') {
          contentParts.push({
            type: 'image_url',
            image_url: { url: att.data }
          })
        } else {
          // For non-image files, include as text description
          contentParts.push({
            type: 'text',
            text: `[Ficheiro anexado: ${att.name} (${att.size})]${att.textContent ? '\n\nConteúdo:\n' + att.textContent : ''}`
          })
        }
      }

      fullMessages.push({ role: m.role, content: contentParts })
    } else {
      fullMessages.push({ role: m.role, content: m.content })
    }
  }

  const body = {
    model,
    messages: fullMessages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    })

    if (!response.ok) {
      let errorMsg = `Erro ${response.status}: `
      try {
        const errorData = await response.json()
        errorMsg += errorData.error?.message || errorData.message || response.statusText
      } catch {
        errorMsg += response.statusText
      }
      onError?.(errorMsg)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      onError?.('Streaming não suportado neste navegador.')
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6)
        if (data === '[DONE]') {
          onDone?.()
          return
        }

        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) {
            onChunk?.(delta)
          }

          // Check if finished
          const finishReason = parsed.choices?.[0]?.finish_reason
          if (finishReason) {
            onDone?.()
            return
          }
        } catch {
          // Ignore JSON parse errors for partial data
        }
      }
    }

    onDone?.()
  } catch (err) {
    if (err.name === 'AbortError') {
      onDone?.()
      return
    }
    onError?.(err.message || 'Erro desconhecido ao conectar com a API.')
  }
}
