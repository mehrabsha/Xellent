import {
  REPLY_SUGGESTION_PROMPT,
  IMPROVE_TEXT_PROMPT,
  POST_IDEAS_PROMPT,
} from './prompts.js'

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
  const prompt = REPLY_SUGGESTION_PROMPT

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

function copyToClipboard(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
  showCustomMessage('Suggestion copied to clipboard!')
}

function createSuggestionCard(suggestion, buttonText, handler) {
  const container = document.createElement('div')
  container.style.cssText = `
    margin-bottom: 15px;
    padding: 10px;
    border: 1px solid #2f3336;
    border-radius: 8px;
    background: transparent;
    font-family: 'TwitterChirp';
    display: flex;
    justify-content: space-between;
  `

  const textElement = document.createElement('p')
  textElement.textContent = suggestion.trim()
  textElement.style.cssText = `
    margin: 0 0 10px 0;
    line-height: 1.5;
    color: #fff;
  `

  const button = document.createElement('button')
  button.className = 'copy-suggestion-btn'
  button.textContent = buttonText
  button.style.cssText = `
    background: #fff;
    color: #0f1419;
    font-weight: 700;   
    border: none;
    padding: 6px 12px;
    border-radius: 24px;
    cursor: pointer;
    font-size: 12px;
  `
  button.addEventListener('click', handler)

  container.appendChild(textElement)
  container.appendChild(button)
  return container
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

  const title = document.createElement('p')
  title.className = 'font-semibold'
  title.textContent = type === 'reply' ? 'Suggested Reply:' : 'Suggested Idea:'

  const card = createSuggestionCard(suggestion, 'Copy', () => {
    copyToClipboard(suggestion)
    const tweetReplyButton = tweetElement.querySelector(
      'button[data-testid="reply"]'
    )
    if (tweetReplyButton) {
      tweetReplyButton.click()
      showCustomMessage('Opening reply modal...')
    }
  })

  suggestionArea.innerHTML = ''
  suggestionArea.appendChild(title)
  suggestionArea.appendChild(card)
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

  suggestionArea.innerHTML = ''

  suggestionsArray.forEach((suggestion) => {
    const card = createSuggestionCard(suggestion.trim(), 'Use', () => {
      copyToClipboard(suggestion.trim())
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
    })
    suggestionArea.appendChild(card)
  })
}

function createPopupOverlay() {
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
  return popupOverlay
}

function createPopupContent() {
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
  return popupContent
}

function createCloseButton(onClose) {
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
  closeButton.addEventListener('click', onClose)
  return closeButton
}

function applyTextToTextarea(text) {
  const textarea =
    document.querySelector('[data-testid="tweetTextarea_0"]') ||
    document.querySelector('[role="textbox"][contenteditable="true"]') ||
    document.querySelector('div[data-testid="tweetTextarea_0"]')

  if (textarea) {
    if (textarea.tagName === 'TEXTAREA' || textarea.tagName === 'INPUT') {
      textarea.value = text
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    } else if (textarea.contentEditable === 'true') {
      textarea.focus()
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(textarea)
      selection.removeAllRanges()
      selection.addRange(range)
      document.execCommand('insertText', false, text)
    }
  }
}

function displayImprovedSuggestion(textareaLabel, improvedText) {
  const improvementsArray = Object.values(JSON.parse(improvedText))

  // Remove any existing suggestions
  const existingSuggestions = textareaLabel.parentNode.querySelectorAll(
    '.xpressive-improve-suggestions'
  )
  existingSuggestions.forEach((suggestion) => suggestion.remove())

  // Add suggestions directly below the textarea label
  improvementsArray.forEach((improvement) => {
    const card = createSuggestionCard(improvement.trim(), 'Use', () => {
      applyTextToTextarea(improvement.trim())
      // Remove all suggestions after use
      const allSuggestions = textareaLabel.parentNode.querySelectorAll(
        '.xpressive-improve-suggestions'
      )
      allSuggestions.forEach((suggestion) => suggestion.remove())
      showCustomMessage('Improved text applied!')
    })
    card.className += ' xpressive-improve-suggestions'
    textareaLabel.parentNode.parentNode.insertBefore(
      card,
      textareaLabel.nextSibling
    )
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

  const prompt = POST_IDEAS_PROMPT

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

  const prompt = IMPROVE_TEXT_PROMPT

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
