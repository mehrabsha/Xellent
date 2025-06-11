document.addEventListener('DOMContentLoaded', () => {
  const likePostsBtn = document.getElementById('likePostsBtn')
  const analyzeActivityBtn = document.getElementById('analyzeActivityBtn')
  const openSettingsBtn = document.getElementById('openSettingsBtn')

  // Listener for 'Like Posts from List' button
  likePostsBtn.addEventListener('click', () => {
    // Send a message to the content script or background script
    chrome.runtime.sendMessage({ action: 'likePosts' }, (response) => {
      if (response && response.status === 'success') {
        console.log('Like posts action initiated successfully.')
        // Optionally show a confirmation message in the popup
      } else {
        console.error('Failed to initiate like posts action:', response)
      }
    })
    window.close() // Close the popup after action
  })

  // Listener for 'Analyze Activity' button
  analyzeActivityBtn.addEventListener('click', () => {
    // Send a message to the content script or background script
    chrome.runtime.sendMessage({ action: 'analyzeActivity' }, (response) => {
      if (response && response.status === 'success') {
        console.log('Analyze activity action initiated successfully.')
        // Optionally show analysis results or a loading indicator
      } else {
        console.error('Failed to initiate activity analysis:', response)
      }
    })
    window.close() // Close the popup after action
  })

  // Listener for 'Open Settings Page' button
  openSettingsBtn.addEventListener('click', () => {
    // Open the settings page in a new tab
    chrome.runtime.openOptionsPage()
  })
})
