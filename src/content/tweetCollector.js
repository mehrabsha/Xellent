let isCollecting = false
let collectionInterval = null
let tweetBuffer = []

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

      // Check for media (images or videos) and if is img the alt should not be empty
      const hasMedia =
        tweet.querySelector('img[alt]:not([alt=""]), video') !== null

      console.log('Tweet found:', {
        text: tweetText.substring(0, 50),
        hasMedia,
        collected: tweet.dataset.collected,
      })

      if (tweetText && !tweet.dataset.collected && !hasMedia) {
        tweet.dataset.collected = 'true'

        // Extract tweet ID from URL
        const tweetLink = tweet.querySelector('a[href*="/status/"]')
        const tweetId = tweetLink ? tweetLink.href.split('/status/')[1] : null
        console.log('Collected tweet:', {
          tweetId,
          user: userName,
          text: tweetText.substring(0, 50),
        })

        if (tweetId) {
          tweetBuffer.push({
            user: userName,
            handle: userHandle,
            text: tweetText,
            tweetId: tweetId,
          })

          console.log('Buffer length:', tweetBuffer.length)

          if (tweetBuffer.length >= 5) {
            console.log('Sending tweet pack to background:', tweetBuffer)
            // Send buffer to background for processing
            chrome.runtime.sendMessage(
              {
                action: 'processTweetPack',
                tweets: tweetBuffer,
              },
              (response) => {
                if (chrome.runtime.lastError) {
                  console.error(
                    'Error sending message to background:',
                    chrome.runtime.lastError
                  )
                } else {
                  console.log('Message sent successfully, response:', response)
                }
              }
            )
            tweetBuffer = [] // Reset buffer
          }
        }
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
  } else if (request.action === 'tweetSelected') {
    console.log('Received tweetSelected:', request)
    // Handle the selected tweet and reply suggestion
    const { selectedTweet, replySuggestion } = request
    console.log('Selected tweet:', selectedTweet, 'Reply:', replySuggestion)

    // Find the tweet element by tweetId
    const tweetElement = document.querySelector(
      `a[href*="/status/${selectedTweet.tweetId}"]`
    )
    console.log('Tweet element found:', tweetElement)
    if (tweetElement) {
      const tweetArticle = tweetElement.closest('article[data-testid="tweet"]')
      console.log('Tweet article found:', tweetArticle)
      if (tweetArticle) {
        // Click the reply button to open comment section
        const replyButton = tweetArticle.querySelector('[data-testid="reply"]')
        console.log('Reply button found:', replyButton)
        if (replyButton) {
          replyButton.click()
          console.log('Clicked reply button')

          // Wait a bit for the reply modal to open, then insert the reply
          setTimeout(() => {
            const replyTextarea =
              document.querySelector('[data-testid="tweetTextarea_0"]') ||
              document.querySelector(
                '[role="textbox"][contenteditable="true"]'
              ) ||
              document.querySelector(
                'textarea[placeholder*="Tweet your reply"]'
              )
            console.log('Reply textarea found:', replyTextarea)

            if (replyTextarea) {
              if (replyTextarea.tagName.toLowerCase() === 'textarea') {
                replyTextarea.value = replySuggestion
                replyTextarea.dispatchEvent(
                  new Event('input', { bubbles: true })
                )
                console.log('Inserted reply into textarea')
              } else {
                // For contenteditable elements
                replyTextarea.innerText = replySuggestion
                replyTextarea.dispatchEvent(
                  new Event('input', { bubbles: true })
                )
                console.log('Inserted reply into contenteditable')
              }

              showCustomMessage('Reply suggestion inserted!', false, 3000)
            } else {
              console.log('Could not find reply textarea')
              showCustomMessage('Could not find reply textarea', true, 3000)
            }
          }, 1000)
        } else {
          console.log('Could not find reply button')
          showCustomMessage('Could not find reply button', true, 3000)
        }
      }
      console.log('Could not find selected tweet element')
      showCustomMessage('Could not find selected tweet element', true, 3000)
    }

    sendResponse({ status: 'processed' })
  }
})
