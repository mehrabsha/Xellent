function injectUI() {
  const tweets = document.querySelectorAll('article[data-testid="tweet"]')

  tweets.forEach((tweet) => {
    if (!tweet.dataset.xEnhancerProcessed) {
      tweet.dataset.xEnhancerProcessed = 'true'

      const buttonContainer = document.createElement('div')
      buttonContainer.className =
        'xpressive-button-container flex items-center space-x-2 mt-2'

      const replySuggestBtn = document.createElement('button')
      replySuggestBtn.textContent = 'Suggest Reply'
      replySuggestBtn.className = 'xpressive-btn xpressive-btn-reply'
      replySuggestBtn.addEventListener('click', () =>
        handleReplySuggestion(tweet)
      )

      buttonContainer.appendChild(replySuggestBtn)

      const tweetActionsBar = tweet.querySelector('div[role="group"]')
      if (tweetActionsBar) {
        tweetActionsBar.parentNode.insertBefore(
          buttonContainer,
          tweetActionsBar.nextSibling
        )
      } else {
        tweet.appendChild(buttonContainer)
      }
    }
  })

  // Add improve button to tweet textarea label
  const textareaLabel = document.querySelector(
    '[data-testid="tweetTextarea_0_label"]'
  )
  if (textareaLabel && !textareaLabel.dataset.improveProcessed) {
    textareaLabel.dataset.improveProcessed = 'true'

    const improveBtn = document.createElement('button')
    improveBtn.textContent = 'improve'
    improveBtn.className = 'xpressive-btn xpressive-btn-improve'
    improveBtn.addEventListener('click', () => handleImproveText(textareaLabel))

    textareaLabel.appendChild(improveBtn)
  }
}

const observer = new MutationObserver(injectUI)
observer.observe(document.body, { childList: true, subtree: true })

injectUI()

async function handleReplySuggestion(tweetElement) {
  const tweetText =
    tweetElement.querySelector('div[data-testid="tweetText"]')?.innerText || ''
  tweetElement.style.flexDirection = 'column'
  const toneParams = await getToneParams()

  if (!tweetText) {
    console.warn('Could not find tweet text for reply suggestion.')
    showCustomMessage('Could not get tweet text for suggestion.')
    return
  }

  // Disable button and show loading state
  const btn = tweetElement.querySelector('.xpressive-btn-reply')
  if (btn) {
    btn.disabled = true
    btn.innerHTML =
      '<div class="loading-spinner" style="width: 12px; height: 12px; border: 1px solid #536471; border-top: 1px solid #1d9bf0; position: inline-block;"></div> Generating...'
  }

  showCustomMessage('Generating reply suggestion...', true)
  const prompt = `

Generate 5 different Twitter replies that sound like real people texting, with customizable style parameters for precise control over tone and approach.

## Parameters (Scale 1-10)

**Formality Level** (1-10):
- 1-3: Very casual, internet slang, abbreviations (ur, rn, ngl)
- 4-6: Natural conversational tone, balanced formality
- 7-10: More polished, complete sentences, professional language

**Sass/Attitude Level** (1-10):
- 1-3: Supportive, gentle, encouraging responses
- 4-6: Balanced, natural reactions with mild edge when appropriate
- 7-10: Sharp, witty, sarcastic, potentially confrontational

**Engagement Style** (1-10):
- 1-3: Brief acknowledgments, minimal investment
- 4-6: Standard engagement, some personal input
- 7-10: Highly engaged, detailed responses, personal anecdotes

**Humor Level** (1-10):
- 1-3: Serious, straightforward, minimal jokes
- 4-6: Light humor when contextually appropriate
- 7-10: Comedy-focused, witty observations, meme references

**Relatability Factor** (1-10):
- 1-3: Distant, observational responses
- 4-6: Some shared experiences, moderate connection
- 7-10: Highly relatable, "same energy," shared struggles

## Core Rules
- First understand the tweet's real meaning and tone - is it sarcastic, educational, complaining, joking, motivational etc
- Match that exact energy and context in your reply, modified by parameter settings
- Find the balance between too formal and too casual based on Formality Level
- Minimal punctuation - real people don't pepper texts with commas and periods
- Adjust exclamation marks and corporate language based on Formality Level
- Question usage depends on Engagement Style level
- Be specific instead of using "this," "that," "it"

## Reply Styles (Adjusted by Parameters)
Read the original tweet carefully to understand if it's:
- **Sarcastic/Snarky**: Match sarcasm level to Sass parameter
- **Educational**: Engagement level determines depth of response
- **Complaining**: Relatability factor influences how much you relate
- **Joking**: Humor level determines how much you play along
- **Motivational**: Formality and Sass levels affect supportiveness style
- **Controversial**: All parameters influence response approach
- **Personal story**: Relatability and Engagement determine connection level
- **Asking for help**: Engagement and Formality shape helpfulness style

## Natural Balance Guidelines
- Formality 1-3: Text speak, fragments, very casual
- Formality 4-6: Natural conversation, standard grammar
- Formality 7-10: Complete sentences, proper punctuation

- Sass 1-3: Kind, supportive, gentle
- Sass 4-6: Balanced reactions, appropriate edge
- Sass 7-10: Sharp wit, sarcasm, confrontational when warranted

- Engagement 1-3: "ok," "nice," "cool"
- Engagement 4-6: Standard responses with some input
- Engagement 7-10: Detailed thoughts, questions, personal shares

## Parameter Examples

**High Formality (8), Low Sass (2), Medium Engagement (5)**
Tweet: "Traffic is insane today"
Reply: "I completely understand that frustration. Hope it clears up soon for you."

**Low Formality (3), High Sass (8), High Engagement (7)**
Tweet: "Traffic is insane today"
Reply: "lmao traffic said nah ur not getting anywhere today huh"

**Medium Everything (5,5,5)**
Tweet: "Traffic is insane today"
Reply: "Always happens at the worst times too"

---

**Usage Instructions**:
1. Set your desired parameters (1-10 for each)
2. Provide the original tweet
3. Generator will create 5 replies matching your parameter settings
4. Default parameters if not specified: Formality: 5, Sass: 4, Engagement: 5, Humor: 5, Relatability: 6

**Original Tweet**: "${tweetText}"
**Parameters**: Formality: ${toneParams.formality}, Sass: ${toneParams.sass}, Engagement: ${toneParams.engagement}, Humor: ${toneParams.humor}, Relatability: ${toneParams.relatability}

`

  chrome.runtime.sendMessage(
    { action: 'getReplySuggestions', prompt: prompt },
    (response) => {
      // Re-enable button and restore original text
      const btn = tweetElement.querySelector('.xpressive-btn-reply')
      if (btn) {
        btn.disabled = false
        btn.textContent = 'Suggest Reply'
      }

      if (response && response.status === 'success' && response.suggestion) {
        displayReplySuggestion(tweetElement, response.suggestion, 'reply')
        showCustomMessage('Reply suggestion ready!')
      } else {
        console.error('Failed to get reply suggestion:', response)
        showCustomMessage('Failed to get reply suggestion.')
      }
    }
  )
}

async function getToneParams() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('toneParams', (data) => {
      resolve(data.toneParams)
    })
  })
}

function createCopyHandler(suggestion, tweetElement) {
  return () => {
    const textarea = document.createElement('textarea')
    textarea.value = suggestion
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    showCustomMessage('Suggestion copied to clipboard!')

    const tweetReplyButton = tweetElement.querySelector(
      'button[data-testid="reply"]'
    )

    if (tweetReplyButton) {
      tweetReplyButton.click()
      showCustomMessage('Opening reply modal...')
    }
  }
}

function displaySuggestion(tweetElement, suggestion, type) {
  let suggestionArea = tweetElement.querySelector(
    `.xpressive-${type}-suggestion`
  )
  if (!suggestionArea) {
    suggestionArea = document.createElement('div')
    suggestionArea.className = `xpressive-${type}-suggestion`
    tweetElement.appendChild(suggestionArea)
  }
  suggestionArea.innerHTML = `<p class="font-semibold">${
    type === 'reply' ? 'Suggested Reply:' : 'Suggested Idea:'
  }</p><p>${suggestion}</p>
                                <button class="copy-suggestion-btn">Copy</button>`
  suggestionArea
    .querySelector('.copy-suggestion-btn')
    .addEventListener('click', createCopyHandler(suggestion, tweetElement))
}

function createUseHandler(suggestion, tweetElement) {
  return () => {
    const textarea = document.createElement('textarea')
    textarea.value = suggestion
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    showCustomMessage('Suggestion copied to clipboard!')

    const tweetReplyButton = tweetElement.querySelector(
      'button[data-testid="reply"]'
    )
    const tweetLikeButton = tweetElement.querySelector(
      'button[data-testid="like"]'
    )
    if (tweetReplyButton && tweetLikeButton) {
      tweetLikeButton.click()
      tweetReplyButton.click()
      showCustomMessage('Opening reply modal...')
    }
  }
}

function displayReplySuggestion(tweetElement, suggestions, type) {
  const suggestionsArray = Object.values(JSON.parse(suggestions))
  let suggestionArea = tweetElement.querySelector(
    `.xpressive-${type}-suggestion`
  )

  if (!suggestionArea) {
    suggestionArea = document.createElement('div')
    suggestionArea.className = `xpressive-${type}-suggestion`
    tweetElement.appendChild(suggestionArea)
  }

  suggestionsArray.forEach((suggestion) => {
    const suggestionContainer = document.createElement('div')
    const suggestionParagraph = document.createElement('p')
    suggestionParagraph.textContent = suggestion.trim()

    const copyButton = document.createElement('button')
    copyButton.className = 'copy-suggestion-btn'
    copyButton.textContent = 'Use'

    copyButton.addEventListener(
      'click',
      createUseHandler(suggestion.trim(), tweetElement)
    )

    suggestionContainer.appendChild(suggestionParagraph)
    suggestionContainer.appendChild(copyButton)
    suggestionArea.appendChild(suggestionContainer)
  })
}

function displayImprovedSuggestion(textareaLabel, improvedText) {
  const improvementsArray = Object.values(JSON.parse(improvedText))

  // Create popup overlay
  const popupOverlay = document.createElement('div')
  popupOverlay.className = 'xpressive-popup-overlay'
  popupOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `

  // Create popup content
  const popupContent = document.createElement('div')
  popupContent.className = 'xpressive-popup-content'
  popupContent.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `

  // Close button
  const closeButton = document.createElement('button')
  closeButton.textContent = '×'
  closeButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
  `
  closeButton.addEventListener('click', () => {
    document.body.removeChild(popupOverlay)
  })

  // Title
  const title = document.createElement('h3')
  title.textContent = 'Improved Text Suggestions'
  title.style.cssText = `
    margin: 0 0 15px 0;
    color: #333;
  `

  // Create container for suggestions
  const suggestionsContainer = document.createElement('div')
  suggestionsContainer.style.cssText = `
    margin-bottom: 20px;
  `

  improvementsArray.forEach((improvement, index) => {
    const suggestionDiv = document.createElement('div')
    suggestionDiv.style.cssText = `
      margin-bottom: 15px;
      padding: 10px;
      border: 1px solid #e1e8ed;
      border-radius: 4px;
      background: #f7f9fa;
    `

    const suggestionText = document.createElement('p')
    suggestionText.textContent = improvement.trim()
    suggestionText.style.cssText = `
      margin: 0 0 10px 0;
      line-height: 1.5;
      color: #555;
    `

    const copyButton = document.createElement('button')
    copyButton.className = 'copy-suggestion-btn'
    copyButton.textContent = 'Copy'
    copyButton.style.cssText = `
      background: #1d9bf0;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `

    copyButton.addEventListener('click', () => {
      // Find the actual textarea/input and update its value
      const textarea =
        document.querySelector('[data-testid="tweetTextarea_0"]') ||
        document.querySelector('[role="textbox"][contenteditable="true"]') ||
        document.querySelector('div[data-testid="tweetTextarea_0"]')

      if (textarea) {
        if (textarea.tagName === 'TEXTAREA' || textarea.tagName === 'INPUT') {
          textarea.value = improvement.trim()
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
        } else if (textarea.contentEditable === 'true') {
          textarea.focus()
          const selection = window.getSelection()
          const range = document.createRange()
          range.selectNodeContents(textarea)
          selection.removeAllRanges()
          selection.addRange(range)
          document.execCommand('insertText', false, improvement.trim())
        }
      }

      document.body.removeChild(popupOverlay)
      showCustomMessage('Improved text applied!')
    })

    suggestionDiv.appendChild(suggestionText)
    suggestionDiv.appendChild(copyButton)
    suggestionsContainer.appendChild(suggestionDiv)
  })

  // Cancel button
  const cancelButton = document.createElement('button')
  cancelButton.textContent = 'Cancel'
  cancelButton.style.cssText = `
    background: #ccc;
    color: #333;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
  `
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(popupOverlay)
  })

  // Assemble popup
  popupContent.appendChild(closeButton)
  popupContent.appendChild(title)
  popupContent.appendChild(suggestionsContainer)
  popupContent.appendChild(cancelButton)
  popupOverlay.appendChild(popupContent)

  // Add to body
  document.body.appendChild(popupOverlay)

  // Close on overlay click
  popupOverlay.addEventListener('click', (e) => {
    if (e.target === popupOverlay) {
      document.body.removeChild(popupOverlay)
    }
  })
}

function showCustomMessage(message, isLoading = false, duration = 3000) {
  let messageBox = document.getElementById('xpressive-message-box')
  if (!messageBox) {
    messageBox = document.createElement('div')
    messageBox.id = 'xpressive-message-box'
    messageBox.className = ''
    document.body.appendChild(messageBox)
  }

  if (isLoading) {
    messageBox.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <span>${message}</span>
      </div>
    `
  } else {
    messageBox.textContent = message
  }

  messageBox.classList.remove('hidden')
  messageBox.classList.add('opacity-100')

  if (!isLoading) {
    setTimeout(() => {
      setTimeout(() => {
        messageBox.classList.add('hidden')
      }, 300)
    }, duration)
  }
}

async function getPostIdeas() {
  showCustomMessage('Generating post ideas...', true)

  const prompt = `Suggest 3 unique and engaging X post ideas about ${await getUserInterests()}.`

  chrome.runtime.sendMessage(
    { action: 'getPostIdeas', prompt: prompt },
    (response) => {
      if (response && response.status === 'success' && response.idea) {
        displaySuggestion(document.body, response.idea, 'post')
        showCustomMessage('Post ideas ready!')
      } else {
        console.error('Failed to get post ideas:', response)
        showCustomMessage('Failed to get post ideas.')
      }
    }
  )
}

async function getUserInterests() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('interestsSetting', (data) => {
      resolve(data.interestsSetting || 'technology and social media')
    })
  })
}

async function handleImproveText(textareaLabel) {
  const textSpan = textareaLabel.querySelector('span[data-text="true"]')
  if (!textSpan) {
    showCustomMessage('Could not find text to improve.')
    return
  }

  const originalText = textSpan.textContent || ''
  if (!originalText.trim()) {
    showCustomMessage('No text to improve.')
    return
  }

  showCustomMessage('Improving text...', true)

  const prompt = `Improve the following text to make it more engaging, clear, and professional while keeping its original meaning and intent. Make it concise but impactful. Provide 5 different improved versions.

Original text: "${originalText}"`

  chrome.runtime.sendMessage(
    { action: 'improveText', prompt: prompt },
    (response) => {
      if (response && response.status === 'success' && response.improvedText) {
        displayImprovedSuggestion(textareaLabel, response.improvedText)
        showCustomMessage('Text improved!')
      } else {
        console.error('Failed to improve text:', response)
        showCustomMessage('Failed to improve text.')
      }
    }
  )
}

function analyzeActivity() {
  showCustomMessage('Analyzing activity...')
  const feedPosts = document.querySelectorAll('article[data-testid="tweet"]')
  const categories = {}
  feedPosts.forEach((post) => {
    const text =
      post.querySelector('div[data-testid="tweetText"]')?.innerText || ''
    if (text.toLowerCase().includes('ai')) {
      categories['AI'] = (categories['AI'] || 0) + 1
    } else if (
      text.toLowerCase().includes('webdev') ||
      text.toLowerCase().includes('javascript')
    ) {
      categories['Web Development'] = (categories['Web Development'] || 0) + 1
    } else {
      categories['Other'] = (categories['Other'] || 0) + 1
    }
  })

  let total = Object.values(categories).reduce((sum, count) => sum + count, 0)
  for (const category in categories) {
    const percentage = ((categories[category] / total) * 100).toFixed(2)
    console.log(`${category}: ${categories[category]} posts (${percentage}%)`)
  }

  chrome.runtime.sendMessage({
    action: 'analysisResults',
    data: categories,
    total: total,
  })
  showCustomMessage(
    'Activity analysis complete! Check console or dedicated UI.'
  )
}
