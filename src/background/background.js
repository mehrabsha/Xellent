chrome.runtime.onInstalled.addListener(() => {
  console.log('Xpert installed.')
})

async function getApiKey() {
  try {
    return new Promise((resolve) => {
      chrome.storage.sync.get('apikey', (data) => {
        data.apikey ? resolve(data.apikey) : resolve(null)
      })
    })
  } catch (error) {
    console.error('Error retrieving API key:', error)
  }
}

async function getModelName() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('modelName', (data) => {
      resolve(data.modelName || 'openai/gpt-4o-mini')
    })
  })
}

async function getReplyLength() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('replyLength', (data) => {
      resolve(data.replyLength !== undefined ? data.replyLength : 50)
    })
  })
}
async function callOpenrouter(prompt, model, tools = null) {
  const apiKey = await getApiKey()
  const apiUrl = 'https://openrouter.ai/api/v1/chat/completions'

  if (!apiKey) {
    console.error('API key not found. Please set it in the extension options.')
    return null
  }

  const requestBody = {
    model: model,
    messages: [{ role: 'user', content: prompt }],
  }

  if (tools) {
    requestBody.tools = tools
    requestBody.tool_choice = 'auto'
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Xpert',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Openrouter API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const message = data.choices?.[0]?.message

    if (!message) {
      throw new Error('Invalid response structure from Openrouter API.')
    }

    // Handle tool calls
    if (message.tool_calls) {
      return { tool_calls: message.tool_calls, content: message.content }
    }

    // Handle regular content
    if (message.content) {
      return message.content
    } else {
      throw new Error('No content or tool calls in response.')
    }
  } catch (error) {
    console.error('Error calling Openrouter API:', error)
    return null
  }
}

// Define tools
const tools = [
  {
    type: 'function',
    function: {
      name: 'provide_reply_suggestions',
      description:
        'Provide 5 different reply suggestions based on the given parameters and tweet text',
      parameters: {
        type: 'object',
        properties: {
          reply1: {
            type: 'string',
            description: 'First reply suggestion',
          },
          reply2: {
            type: 'string',
            description: 'Second reply suggestion',
          },
          reply3: {
            type: 'string',
            description: 'Third reply suggestion',
          },
          reply4: {
            type: 'string',
            description: 'Fourth reply suggestion',
          },
          reply5: {
            type: 'string',
            description: 'Fifth reply suggestion',
          },
        },
        required: ['reply1', 'reply2', 'reply3', 'reply4', 'reply5'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'provide_text_improvements',
      description: 'Provide 5 different improved versions of the given text',
      parameters: {
        type: 'object',
        properties: {
          improvement1: {
            type: 'string',
            description: 'First text improvement suggestion',
          },
          improvement2: {
            type: 'string',
            description: 'Second text improvement suggestion',
          },
          improvement3: {
            type: 'string',
            description: 'Third text improvement suggestion',
          },
          improvement4: {
            type: 'string',
            description: 'Fourth text improvement suggestion',
          },
          improvement5: {
            type: 'string',
            description: 'Fifth text improvement suggestion',
          },
        },
        required: [
          'improvement1',
          'improvement2',
          'improvement3',
          'improvement4',
          'improvement5',
        ],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'select_best_tweet_and_reply',
      description:
        'Select the best tweet from a pack of 5 tweets and provide a suggested reply',
      parameters: {
        type: 'object',
        properties: {
          selectedTweetIndex: {
            type: 'integer',
            description: 'Index of the selected tweet (0-4)',
            minimum: 0,
            maximum: 4,
          },
          replySuggestion: {
            type: 'string',
            description: 'Suggested reply text for the selected tweet',
          },
          reasoning: {
            type: 'string',
            description:
              'Brief explanation of why this tweet was selected and the reply approach',
          },
        },
        required: ['selectedTweetIndex', 'replySuggestion', 'reasoning'],
      },
    },
  },
]

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (
    request.action === 'startCollector' ||
    request.action === 'stopCollector'
  ) {
    // Relay message to active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              'Error sending message to content script:',
              chrome.runtime.lastError
            )
          }
        })
      }
    })
    sendResponse({ status: 'ok' })
    return true
  }

  if (
    request.action === 'getReplySuggestions' ||
    request.action === 'getPostIdeas' ||
    request.action === 'improveText' ||
    request.action === 'processTweetPack'
  ) {
    ;(async () => {
      const modelName = await getModelName()
      const replyLength = await getReplyLength()

      let prompt,
        enhancedPrompt,
        useTools = false

      if (request.action === 'processTweetPack') {
        console.log('Received tweet pack:', request.tweets)
        // Import the prompt function
        const { SELECT_BEST_TWEET_PROMPT } = await import(
          chrome.runtime.getURL('src/content/prompts.js')
        )
        prompt = SELECT_BEST_TWEET_PROMPT(request.tweets)
        enhancedPrompt =
          prompt +
          ' Use the select_best_tweet_and_reply tool to provide your selection and reply suggestion.'
        console.log('Enhanced prompt:', enhancedPrompt)
        useTools = true
      } else {
        prompt = request.prompt
        enhancedPrompt = prompt

        if (request.action === 'getReplySuggestions') {
          enhancedPrompt += ` Keep each reply under ${replyLength} words (from one to ${replyLength}). Use the provide_reply_suggestions tool to return the suggestions.`
          useTools = true
        } else if (request.action === 'improveText') {
          enhancedPrompt += ` Use the provide_text_improvements tool to return 5 different improved versions of the text.`
          useTools = true
        }
      }

      const llmResponse = await callOpenrouter(
        enhancedPrompt,
        modelName,
        useTools ? tools : null
      )

      if (llmResponse) {
        if (request.action === 'processTweetPack') {
          console.log('LLM Response:', llmResponse)
          if (llmResponse.tool_calls) {
            const toolCall = llmResponse.tool_calls[0]
            console.log('Tool call:', toolCall)
            if (
              toolCall &&
              toolCall.function.name === 'select_best_tweet_and_reply'
            ) {
              const result = JSON.parse(toolCall.function.arguments)
              console.log('Parsed result:', result)
              // Send the selected tweet and reply back to content script
              chrome.tabs.query(
                { active: true, currentWindow: true },
                (tabs) => {
                  if (tabs[0]) {
                    console.log('Sending tweetSelected message to content script')
                    chrome.tabs.sendMessage(tabs[0].id, {
                      action: 'tweetSelected',
                      selectedTweet: request.tweets[result.selectedTweetIndex],
                      replySuggestion: result.replySuggestion,
                      reasoning: result.reasoning,
                    })
                  }
                }
              )
              sendResponse({ status: 'success' })
            } else {
              console.error('Invalid tool call response')
              sendResponse({
                status: 'error',
                message: 'Invalid tool call response.',
              })
            }
          } else {
            console.error('No tool calls in response')
            sendResponse({
              status: 'error',
              message: 'No tool calls in response.',
            })
          }
        } else if (request.action === 'getReplySuggestions') {
          if (llmResponse.tool_calls) {
            // Parse tool calls for structured suggestions
            const toolCall = llmResponse.tool_calls[0]
            if (
              toolCall &&
              toolCall.function.name === 'provide_reply_suggestions'
            ) {
              const suggestions = JSON.parse(toolCall.function.arguments)
              sendResponse({
                status: 'success',
                suggestion: JSON.stringify(suggestions),
              })
            } else {
              sendResponse({
                status: 'error',
                message: 'Invalid tool call response.',
              })
            }
          } else {
            // Fallback to direct content if no tool calls
            sendResponse({ status: 'success', suggestion: llmResponse })
          }
        } else if (request.action === 'getPostIdeas') {
          sendResponse({ status: 'success', idea: llmResponse })
        } else if (request.action === 'improveText') {
          if (llmResponse.tool_calls) {
            // Parse tool calls for structured improvements
            const toolCall = llmResponse.tool_calls[0]
            if (
              toolCall &&
              toolCall.function.name === 'provide_text_improvements'
            ) {
              const improvements = JSON.parse(toolCall.function.arguments)
              sendResponse({
                status: 'success',
                improvedText: JSON.stringify(improvements),
              })
            } else {
              sendResponse({
                status: 'error',
                message: 'Invalid tool call response.',
              })
            }
          } else {
            // Fallback to direct content if no tool calls
            sendResponse({
              status: 'success',
              improvedText: llmResponse.trim(),
            })
          }
        }
      } else {
        sendResponse({
          status: 'error',
          message: 'Failed to get response from Openrouter API.',
        })
      }
    })()
    return true
  }
})
