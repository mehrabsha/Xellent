chrome.runtime.onInstalled.addListener(() => {
  console.log('Xpressive installed.')
})

async function getApiKey() {
  console.log('00')
  try {
    console.log('0')
    return new Promise((resolve) => {
      chrome.storage.sync.get('apikey', (data) => {
        console.log('Retrieving API key from storage:', data)

        data.apikey ? resolve(data.apikey) : resolve(null)
      })
    })
  } catch (error) {
    console.log(error)
  }
}
async function callOpenrouter(prompt, model = 'openai/gpt-4o-mini') {
  // Default model
  console.log('1')

  const apiKey = await getApiKey()
  const apiUrl = 'https://openrouter.ai/api/v1/chat/completions'

  console.log('apiKey', apiKey)

  if (!apiKey) {
    console.error('API key not found. Please set it in the extension options.')
    return null
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Xpressive',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Openrouter API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    if (
      data.choices &&
      data.choices.length > 0 &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      return data.choices[0].message.content
    } else {
      throw new Error('Invalid response structure from Openrouter API.')
    }
  } catch (error) {
    console.error('Error calling Openrouter API:', error)
    return null
  }
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request.action)
  console.log('2')

  if (
    request.action === 'getReplySuggestions' ||
    request.action === 'getPostIdeas'
  ) {
    console.log('3')
    ;(async () => {
      const prompt = request.prompt
      console.log(
        `Received LLM request for: ${request.action} with prompt: "${prompt}"`
      )

      console.log('4')
      const llmResponse = await callOpenrouter(prompt)

      if (llmResponse) {
        if (request.action === 'getReplySuggestions') {
          sendResponse({ status: 'success', suggestion: llmResponse })
        } else if (request.action === 'getPostIdeas') {
          sendResponse({ status: 'success', idea: llmResponse })
        }
      } else {
        sendResponse({
          status: 'error',
          message: 'FFailed to get response from Openrouter API.',
        })
      }
    })()
    return true
  }
})
