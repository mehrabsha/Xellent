document.addEventListener('DOMContentLoaded', () => {
  const openSettingsBtn = document.getElementById('openSettingsBtn')
  const startCollectorBtn = document.getElementById('startCollectorBtn')
  const stopCollectorBtn = document.getElementById('stopCollectorBtn')

  openSettingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })

  // Check initial state from content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'getCollectorState' },
        (response) => {
          if (response && response.isCollecting) {
            startCollectorBtn.style.display = 'none'
            stopCollectorBtn.style.display = 'block'
          } else {
            startCollectorBtn.style.display = 'block'
            stopCollectorBtn.style.display = 'none'
          }
        }
      )
    }
  })

  startCollectorBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'startCollector' })
    startCollectorBtn.style.display = 'none'
    stopCollectorBtn.style.display = 'block'
  })

  stopCollectorBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stopCollector' })
    startCollectorBtn.style.display = 'block'
  })
})
