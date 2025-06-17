document.addEventListener('DOMContentLoaded', loadSettings)

const saveSettingsBtn = document.getElementById('saveSettingsBtn')
saveSettingsBtn.addEventListener('click', saveSettings)

function loadSettings() {
  chrome.storage.sync.get(
    [
      'apikey',
      'toneSetting',
      'replyLength',
      'interestsSetting',
      'postIdeaFormat',
    ],
    (items) => {
      document.getElementById('apikey').value = items.apikey
      document.getElementById('toneSetting').value =
        items.toneSetting || 'friendly'
      document.getElementById('replyLength').value =
        items.replyLength !== undefined ? items.replyLength : 50
      document.getElementById('interestsSetting').value =
        items.interestsSetting || ''
      document.getElementById('postIdeaFormat').value =
        items.postIdeaFormat || 'tweet'
    }
  )
}

function saveSettings() {
  const apikey = document.getElementById('apikey').value
  const toneSetting = document.getElementById('toneSetting').value
  const replyLength = document.getElementById('replyLength').value
  const interestsSetting = document.getElementById('interestsSetting').value
  const postIdeaFormat = document.getElementById('postIdeaFormat').value

  chrome.storage.sync.set(
    {
      apikey: apikey,
      toneSetting: toneSetting,
      replyLength: parseInt(replyLength),
      interestsSetting: interestsSetting,
      postIdeaFormat: postIdeaFormat,
    },
    () => {
      const statusMessage = document.getElementById('statusMessage')
      statusMessage.textContent = 'Settings saved successfully!'
      statusMessage.classList.remove('hidden')
      setTimeout(() => {
        statusMessage.classList.add('hidden')
      }, 3000)
    }
  )
}
