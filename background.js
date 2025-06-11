// This script runs in the background and handles long-running tasks and inter-component communication.

chrome.runtime.onInstalled.addListener(() => {
  console.log('Xpressive installed.')
  // Any initial setup, like setting default storage values, can go here.
})

// Function to call Openrouter API
async function callOpenrouter(
  prompt,
  model = 'mistralai/mistral-7b-instruct-v0.2'
) {
  // Default model
  const apiKey = '' // API key will be provided by Canvas runtime
  const apiUrl = 'https://openrouter.ai/api/v1/chat/completions'

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // Optional: You can add HTTP-Referer and X-Title for Openrouter leaderboards
        'HTTP-Referer': 'https://example.com/xpressive', // Replace with your extension's actual URL/identifier
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
    return null // Return null on error
  }
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request.action)

  if (request.action === 'likePosts') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (
        tabs[0] &&
        (tabs[0].url.startsWith('https://twitter.com/') ||
          tabs[0].url.startsWith('https://x.com/'))
      ) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'startLiking' },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                'Error sending message to content script:',
                chrome.runtime.lastError.message
              )
              sendResponse({
                status: 'error',
                message: chrome.runtime.lastError.message,
              })
            } else {
              console.log('Message sent to content script to start liking.')
              sendResponse({ status: 'success' })
            }
          }
        )
      } else {
        sendResponse({
          status: 'error',
          message: 'Not on an X (Twitter) page.',
        })
      }
    })
    return true // Indicate that sendResponse will be called asynchronously
  } else if (request.action === 'analyzeActivity') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (
        tabs[0] &&
        (tabs[0].url.startsWith('https://twitter.com/') ||
          tabs[0].url.startsWith('https://x.com/'))
      ) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'startAnalysis' },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                'Error sending message to content script:',
                chrome.runtime.lastError.message
              )
              sendResponse({
                status: 'error',
                message: chrome.runtime.lastError.message,
              })
            } else {
              console.log('Message sent to content script to start analysis.')
              sendResponse({ status: 'success' })
            }
          }
        )
      } else {
        sendResponse({
          status: 'error',
          message: 'Not on an X (Twitter) page.',
        })
      }
    })
    return true // Indicate that sendResponse will be called asynchronously
  } else if (
    request.action === 'getReplySuggestions' ||
    request.action === 'getPostIdeas'
  ) {
    ;(async () => {
      const prompt = request.prompt
      console.log(
        `Received LLM request for: ${request.action} with prompt: "${prompt}"`
      )

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
          message: 'Failed to get response from Openrouter API.',
        })
      }
    })()
    return true // Indicate that sendResponse will be called asynchronously
  }
})
