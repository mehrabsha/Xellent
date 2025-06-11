document.addEventListener('DOMContentLoaded', loadSettings)

const saveSettingsBtn = document.getElementById('saveSettingsBtn')
saveSettingsBtn.addEventListener('click', saveSettings)

function loadSettings() {
  chrome.storage.sync.get(
    [
      'autoStart',
      'likeKeywords',
      'minFollowers',
      'toneSetting',
      'replyLength',
      'interestsSetting',
      'postIdeaFormat',
      'analysisDepth',
    ],
    (items) => {
      document.getElementById('autoStart').checked =
        items.autoStart !== undefined ? items.autoStart : true
      document.getElementById('likeKeywords').value = items.likeKeywords || ''
      document.getElementById('minFollowers').value =
        items.minFollowers !== undefined ? items.minFollowers : 0
      document.getElementById('toneSetting').value =
        items.toneSetting || 'friendly'
      document.getElementById('replyLength').value =
        items.replyLength !== undefined ? items.replyLength : 50
      document.getElementById('interestsSetting').value =
        items.interestsSetting || ''
      document.getElementById('postIdeaFormat').value =
        items.postIdeaFormat || 'tweet'
      document.getElementById('analysisDepth').value =
        items.analysisDepth !== undefined ? items.analysisDepth : 100
    }
  )
}

function saveSettings() {
  const autoStart = document.getElementById('autoStart').checked
  const likeKeywords = document.getElementById('likeKeywords').value
  const minFollowers = document.getElementById('minFollowers').value
  const toneSetting = document.getElementById('toneSetting').value
  const replyLength = document.getElementById('replyLength').value
  const interestsSetting = document.getElementById('interestsSetting').value
  const postIdeaFormat = document.getElementById('postIdeaFormat').value
  const analysisDepth = document.getElementById('analysisDepth').value

  chrome.storage.sync.set(
    {
      autoStart: autoStart,
      likeKeywords: likeKeywords,
      minFollowers: parseInt(minFollowers),
      toneSetting: toneSetting,
      replyLength: parseInt(replyLength),
      interestsSetting: interestsSetting,
      postIdeaFormat: postIdeaFormat,
      analysisDepth: parseInt(analysisDepth),
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
