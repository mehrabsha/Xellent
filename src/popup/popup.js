document.addEventListener('DOMContentLoaded', () => {
  const openSettingsBtn = document.getElementById('openSettingsBtn')

  openSettingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })
})
