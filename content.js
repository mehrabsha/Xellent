console.log('Xpressive content script loaded.')

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
      replySuggestBtn.className =
        'xpressive-btn xpressive-btn-purple transition duration-150 ease-in-out'
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
}

const observer = new MutationObserver(injectUI)
observer.observe(document.body, { childList: true, subtree: true })

injectUI()

async function handleReplySuggestion(tweetElement) {
  const tweetText =
    tweetElement.querySelector('div[data-testid="tweetText"]')?.innerText || ''
  tweetElement.style.flexDirection = 'column'

  if (!tweetText) {
    console.warn('Could not find tweet text for reply suggestion.')
    showCustomMessage('Could not get tweet text for suggestion.')
    return
  }

  showCustomMessage('Generating reply suggestion...')
  const prompt = `


Generate 5 different Twitter replies that sound like real people texting. Keep each reply between 5-25 words and avoid overusing punctuation.

## Core Rules
- First understand the tweets real meaning and tone - is it sarcastic educational complaining joking motivational etc
- Match that exact energy and context in your reply
- Find the balance between too formal and too casual - sound natural but not overly chatty
- Minimal punctuation - real people dont pepper texts with commas and periods  
- No exclamation marks hyphens or corporate words like absolutely totally amazing
- Skip questions unless they sound completely natural
- Be specific instead of using this that it

## Reply Styles
Read the original tweet carefully to understand if its:
- **Sarcastic/Snarky**: Match the sarcasm without being mean
- **Educational**: Add value or share related knowledge  
- **Complaining**: Relate to their frustration appropriately
- **Joking**: Play along with the humor naturally
- **Motivational**: Support without being preachy
- **Controversial**: Respond thoughtfully not reactively
- **Personal story**: Share similar experience or relate
- **Asking for help**: Offer genuine useful input

## Natural Balance
- Not too formal like a business email
- Not too casual like texting your best friend  
- Sound like a normal person who understands context
- Match the tweets energy level - dont be overly excited for a calm post
- If someones being sarcastic dont respond with genuine enthusiasm
- If someones sharing knowledge dont just say cool thanks

## Examples

**Tweet**: "Can't believe how quickly the weekend flew by!"
**Replies**: 
- "Monday always shows up uninvited"
- "Weekends are basically a scam at this point"
- "Time moves different on weekends I swear"

**Tweet**: "Just finished my first marathon and I'm still buzzing with excitement!"
**Replies**:
- "26.2 miles is no joke well done"
- "Your legs probably hate you right now"
- "First marathon hits different"

## Output Format
Return exactly 5 replies in this format:
[reply1, reply2, reply3, reply4, reply5]

---

**Original Tweet**: "${tweetText}"
`
  console.log(`Requesting reply suggestion for: "${tweetText}"`)

  chrome.runtime.sendMessage(
    { action: 'getReplySuggestions', prompt: prompt },
    (response) => {
      if (response && response.status === 'success' && response.suggestion) {
        console.log('Reply suggestion:', response.suggestion)
        displayReplySuggestion(tweetElement, response.suggestion, 'reply')
        showCustomMessage('Reply suggestion ready!')
      } else {
        console.error('Failed to get reply suggestion:', response)
        showCustomMessage('Failed to get reply suggestion.')
      }
    }
  )
}

async function getUserTone() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('toneSetting', (data) => {
      resolve(data.toneSetting || 'friendly') // Default to friendly
    })
  })
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
    .addEventListener('click', () => {
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
    })
}

function displayReplySuggestion(tweetElement, suggestions, type) {
  const suggestionsArray = suggestions.replace(/['"\]\[]+/g, '').split(',')
  console.log(suggestionsArray)

  for (let i = 0; i < suggestionsArray.length; i++) {
    let suggestion = suggestionsArray[i].trim()
    let suggestionArea = tweetElement.querySelector(
      `.xpressive-${type}-suggestion`
    )

    if (!suggestionArea) {
      suggestionArea = document.createElement('div')
      suggestionArea.className = `xpressive-${type}-suggestion`
      tweetElement.appendChild(suggestionArea)
    }

    const suggestionContainer = document.createElement('div')

    const suggestionParagraph = document.createElement('p')
    suggestionParagraph.textContent = suggestion

    const copyButton = document.createElement('button')
    copyButton.className = 'copy-suggestion-btn'
    copyButton.textContent = 'Use'

    copyButton.addEventListener('click', () => {
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
    })

    suggestionContainer.appendChild(suggestionParagraph)
    suggestionContainer.appendChild(copyButton)

    suggestionArea.appendChild(suggestionContainer)
  }
}

function showCustomMessage(message, duration = 3000) {
  let messageBox = document.getElementById('xpressive-message-box')
  if (!messageBox) {
    messageBox = document.createElement('div')
    messageBox.id = 'xpressive-message-box'
    messageBox.className = ''
    const newbox = document.body.appendChild(messageBox)
    console.log('Created message box:', newbox)
  }
  messageBox.textContent = message
  messageBox.classList.remove('hidden')
  messageBox.classList.add('opacity-100')

  setTimeout(() => {
    setTimeout(() => {
      messageBox.classList.add('hidden')
    }, 300)
  }, duration)
}

async function getPostIdeas() {
  console.log('Requesting post ideas...')
  showCustomMessage('Generating post ideas...')

  const prompt = `Suggest 3 unique and engaging X post ideas about ${await getUserInterests()}.`

  chrome.runtime.sendMessage(
    { action: 'getPostIdeas', prompt: prompt },
    (response) => {
      if (response && response.status === 'success' && response.idea) {
        console.log('Post ideas:', response.idea)
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

function analyzeActivity() {
  console.log('Starting activity analysis...')
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
  console.log('Activity Analysis Results:')
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
