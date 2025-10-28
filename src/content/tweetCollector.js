let isCollecting = false
let collectionInterval = null

function startTweetCollection() {
  if (isCollecting) return

  isCollecting = true
  showCustomMessage('Starting tweet collection...', false, 2000)

  collectionInterval = setInterval(() => {
    if (!isCollecting) return

    // Get tweets currently visible on screen
    const tweets = document.querySelectorAll('article[data-testid="tweet"]')
    const visibleTweets = Array.from(tweets).filter((tweet) => {
      const rect = tweet.getBoundingClientRect()
      return rect.top >= 0 && rect.bottom <= window.innerHeight
    })

    visibleTweets.forEach((tweet) => {
      const tweetText =
        tweet.querySelector('div[data-testid="tweetText"]')?.innerText || ''
      const userName =
        tweet.querySelector('div[data-testid="User-Name"]')?.innerText || ''
      const userHandle =
        tweet.querySelector('span[role="link"]')?.innerText || ''

      if (tweetText && !tweet.dataset.collected) {
        tweet.dataset.collected = 'true'
        console.log('Collected Tweet:', {
          user: userName,
          handle: userHandle,
          text: tweetText,
        })
      }
    })

    // Scroll down
    window.scrollBy(0, window.innerHeight * 0.8)
  }, 2000) // Collect every 2 seconds
}

function stopTweetCollection() {
  if (!isCollecting) return

  isCollecting = false
  if (collectionInterval) {
    clearInterval(collectionInterval)
    collectionInterval = null
  }
  showCustomMessage('Tweet collection stopped.', false, 2000)
}

function getCollectorState() {
  return { isCollecting: isCollecting }
}

// Message listener for collector commands
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startCollector') {
    startTweetCollection()
    sendResponse({ status: 'started' })
  } else if (request.action === 'stopCollector') {
    stopTweetCollection()
    sendResponse({ status: 'stopped' })
  } else if (request.action === 'getCollectorState') {
    sendResponse(getCollectorState())
  }
})
