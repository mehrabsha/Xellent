// This script runs in the context of the X (Twitter) page.
console.log('Xpressive content script loaded.')

// Function to inject UI elements (e.g., buttons) into the X page
function injectUI() {
  // Example: Add a button next to each tweet
  // This is a simplified example and would need robust selectors for X's dynamic DOM
  const tweets = document.querySelectorAll('article[data-testid="tweet"]') // Adjust selector as needed

  tweets.forEach((tweet) => {
    if (!tweet.querySelector('.xpressive-button-container')) {
      // Prevent multiple injections
      const buttonContainer = document.createElement('div')
      buttonContainer.className =
        'xpressive-button-container flex items-center space-x-2 mt-2'

      const replySuggestBtn = document.createElement('button')
      replySuggestBtn.textContent = 'Suggest Reply'
      replySuggestBtn.className =
        'xpressive-btn bg-purple-500 text-white text-xs px-2 py-1 rounded-full hover:bg-purple-600 transition duration-150 ease-in-out'
      replySuggestBtn.addEventListener('click', () =>
        handleReplySuggestion(tweet)
      )

      const followSuggestBtn = document.createElement('button')
      followSuggestBtn.textContent = 'Mark for Follow'
      followSuggestBtn.className =
        'xpressive-btn bg-yellow-500 text-white text-xs px-2 py-1 rounded-full hover:bg-yellow-600 transition duration-150 ease-in-out'
      followSuggestBtn.addEventListener('click', () =>
        handleMarkForFollow(tweet)
      )

      buttonContainer.appendChild(replySuggestBtn)
      buttonContainer.appendChild(followSuggestBtn)

      // Find a suitable place to insert the buttons
      // This will likely require careful inspection of X's DOM structure
      const tweetActionsBar = tweet.querySelector('div[role="group"]') // Example selector for the actions bar (like, retweet, etc.)
      if (tweetActionsBar) {
        tweetActionsBar.parentNode.insertBefore(
          buttonContainer,
          tweetActionsBar.nextSibling
        )
      } else {
        tweet.appendChild(buttonContainer) // Fallback
      }
    }
  })
}

// Observe DOM changes to inject buttons on new tweets (X is a Single Page Application)
const observer = new MutationObserver(injectUI)
observer.observe(document.body, { childList: true, subtree: true })

// Initial injection
injectUI()

// Function to handle "Like Posts from List" action
async function startLikingPosts() {
  console.log('Starting to like posts...')
  // Retrieve post list and settings from storage (background script would typically fetch this)
  // For demonstration, let's assume a dummy list
  const dummyPosts = [
    { id: '123', text: 'Excited about new AI advancements!' },
    { id: '456', text: 'Great thread on web development tips.' },
  ]

  for (const post of dummyPosts) {
    // Find the actual post element on the page by its content or data attribute
    const postElement = document.querySelector(
      `article[data-testid="tweet"] [aria-label*="${post.text.substring(
        0,
        20
      )}"]`
    ) // Highly simplified
    if (postElement) {
      console.log(`Checking if post "${post.text}" is related...`)
      // Implement your "related to account based on settings" logic here.
      // This might involve calling an LLM via the background script.
      const isRelated = true // Placeholder for actual logic

      if (isRelated) {
        // Find and click the like button
        const likeButton = postElement.querySelector(
          'button[data-testid="like"]'
        ) // Adjust selector
        if (
          likeButton &&
          !likeButton.getAttribute('aria-label').includes('Unlike')
        ) {
          // Check if already liked
          likeButton.click()
          console.log(`Liked post: "${post.text}"`)
        } else {
          console.log(
            `Post already liked or like button not found for: "${post.text}"`
          )
        }
      } else {
        console.log(`Post not related, skipping: "${post.text}"`)
      }
    } else {
      console.log(`Post element not found for: "${post.text}"`)
    }
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate delay
  }
  console.log('Finished liking posts.')
}

// Function to handle "Reply Suggestions"
async function handleReplySuggestion(tweetElement) {
  const tweetText =
    tweetElement.querySelector('div[data-testid="tweetText"]')?.innerText || ''
  if (!tweetText) {
    console.warn('Could not find tweet text for reply suggestion.')
    return
  }

  // You would send the tweetText and user's tone/settings to the background script
  // which then calls the LLM.
  const prompt = `Suggest a reply for the following X post, considering a ${await getUserTone()} tone: "${tweetText}"`
  console.log(`Requesting reply suggestion for: "${tweetText}"`)

  // Send message to background script for LLM call
  chrome.runtime.sendMessage(
    { action: 'getReplySuggestions', prompt: prompt },
    (response) => {
      if (response && response.status === 'success' && response.suggestion) {
        console.log('Reply suggestion:', response.suggestion)
        // Display the suggestion to the user, perhaps in a modal or a text area near the reply button
        displaySuggestion(tweetElement, response.suggestion, 'reply')
      } else {
        console.error('Failed to get reply suggestion:', response)
      }
    }
  )
}

// Placeholder for getting user tone from settings
async function getUserTone() {
  // In a real app, this would fetch from chrome.storage
  return new Promise((resolve) => {
    chrome.storage.sync.get('toneSetting', (data) => {
      resolve(data.toneSetting || 'friendly') // Default to friendly
    })
  })
}

// Function to display suggestion (placeholder)
function displaySuggestion(tweetElement, suggestion, type) {
  let suggestionArea = tweetElement.querySelector(
    `.xpressive-${type}-suggestion`
  )
  if (!suggestionArea) {
    suggestionArea = document.createElement('div')
    suggestionArea.className = `xpressive-${type}-suggestion bg-blue-50 border border-blue-200 text-blue-800 text-sm p-3 rounded-md mt-2`
    tweetElement.appendChild(suggestionArea)
  }
  suggestionArea.innerHTML = `<p class="font-semibold">${
    type === 'reply' ? 'Suggested Reply:' : 'Suggested Idea:'
  }</p><p>${suggestion}</p>
                                <button class="copy-suggestion-btn bg-blue-200 text-blue-800 px-2 py-1 rounded-md text-xs mt-2 hover:bg-blue-300">Copy</button>`
  suggestionArea
    .querySelector('.copy-suggestion-btn')
    .addEventListener('click', () => {
      document.execCommand('copy') // For clipboard
      const textarea = document.createElement('textarea')
      textarea.value = suggestion
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      // Using a custom modal instead of alert for better UX
      showCustomMessage('Suggestion copied to clipboard!')
    })
}

// Custom message box function (instead of alert)
function showCustomMessage(message, duration = 3000) {
  let messageBox = document.getElementById('xpressive-message-box')
  if (!messageBox) {
    messageBox = document.createElement('div')
    messageBox.id = 'xpressive-message-box'
    messageBox.className =
      'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg z-50 opacity-0 transition-opacity duration-300'
    document.body.appendChild(messageBox)
  }
  messageBox.textContent = message
  messageBox.classList.remove('hidden')
  messageBox.classList.add('opacity-100')

  setTimeout(() => {
    messageBox.classList.remove('opacity-100')
    messageBox.classList.add('opacity-0')
    setTimeout(() => {
      messageBox.classList.add('hidden')
    }, 300) // Wait for fade-out transition
  }, duration)
}

// Function to handle "Mark related accounts for follow"
function handleMarkForFollow(tweetElement) {
  console.log('Marking account for follow (feature logic to be implemented).')
  // Extract account information from tweetElement
  const username = tweetElement.querySelector('a[role="link"] span')?.innerText // Adjust selector
  if (username) {
    console.log(`Account "${username}" marked for potential follow.`)
    // Store this account in chrome.storage or send to background script for processing
    // based on your "related accounts" settings.
    chrome.storage.local.get({ markedAccounts: [] }, (result) => {
      const markedAccounts = result.markedAccounts
      if (!markedAccounts.includes(username)) {
        markedAccounts.push(username)
        chrome.storage.local.set({ markedAccounts: markedAccounts }, () => {
          console.log(`"${username}" added to marked accounts.`)
          // Provide visual feedback
          const followBtn = tweetElement.querySelector(
            '.xpressive-btn.bg-yellow-500'
          )
          if (followBtn) {
            followBtn.textContent = 'Marked!'
            followBtn.classList.remove('bg-yellow-500')
            followBtn.classList.add('bg-gray-500')
            followBtn.disabled = true
          }
          showCustomMessage(`Account @${username} marked for follow!`)
        })
      } else {
        console.log(`"${username}" already marked.`)
        showCustomMessage(`Account @${username} is already marked.`)
      }
    })
  }
}

// Function to handle "Suggest ideas for writing new posts"
async function getPostIdeas() {
  console.log('Requesting post ideas...')
  // You would send user's interests/settings to the background script
  // which then calls the LLM.
  const prompt = `Suggest 3 unique and engaging X post ideas about ${await getUserInterests()}.`

  // Send message to background script for LLM call
  chrome.runtime.sendMessage(
    { action: 'getPostIdeas', prompt: prompt },
    (response) => {
      if (response && response.status === 'success' && response.idea) {
        console.log('Post ideas:', response.idea)
        // Display the ideas to the user (e.g., in a popup or a dedicated section)
        // For now, let's just log it. A dedicated UI would be better.
        displaySuggestion(document.body, response.idea, 'post') // Attach to body for now
      } else {
        console.error('Failed to get post ideas:', response)
      }
    }
  )
}

// Placeholder for getting user interests from settings
async function getUserInterests() {
  // In a real app, this would fetch from chrome.storage
  return new Promise((resolve) => {
    chrome.storage.sync.get('interestsSetting', (data) => {
      resolve(data.interestsSetting || 'technology and social media') // Default interests
    })
  })
}

// Function to handle "Analyze activity"
function analyzeActivity() {
  console.log('Starting activity analysis...')
  // This feature would require extensive DOM parsing to categorize tweets,
  // count engagements, etc. It's complex and would depend on the exact
  // structure of X's feed and post elements.
  // Example: Count different types of posts or topics
  const feedPosts = document.querySelectorAll('article[data-testid="tweet"]')
  const categories = {}
  feedPosts.forEach((post) => {
    const text =
      post.querySelector('div[data-testid="tweetText"]')?.innerText || ''
    // Very basic categorization based on keywords
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

  // Send results back to popup or options page for display
  chrome.runtime.sendMessage({
    action: 'analysisResults',
    data: categories,
    total: total,
  })
}

// Listen for messages from the background script (e.g., triggered by popup)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startLiking') {
    startLikingPosts()
    sendResponse({ status: 'success', message: 'Liking initiated.' })
  } else if (request.action === 'startAnalysis') {
    analyzeActivity()
    sendResponse({ status: 'success', message: 'Analysis initiated.' })
  }
  return true // Keep the message channel open for asynchronous responses
})
