document.addEventListener('DOMContentLoaded', loadSettings)

const saveSettingsBtn = document.getElementById('saveSettingsBtn')
saveSettingsBtn.addEventListener('click', saveSettings)

function loadSettings() {
  chrome.storage.sync.get(
    [
      'apikey',
      'modelName',
      'twitterUsername',
      'toneParams',
      'replyLength',
      'interestsSetting',
      'postIdeaFormat',
      'replyExamples',
    ],
    (items) => {
      document.getElementById('apikey').value = items.apikey
      document.getElementById('modelName').value =
        items.modelName || 'openai/gpt-4o-mini'
      document.getElementById('twitterUsername').value =
        items.twitterUsername || '0xMehrab'

      document.getElementById('replyLength').value =
        items.replyLength !== undefined ? items.replyLength : 50
      document.getElementById('interestsSetting').value =
        items.interestsSetting || ''
      document.getElementById('postIdeaFormat').value =
        items.postIdeaFormat || 'tweet'
      document.getElementById('replyExamples').value = items.replyExamples || ''

      document.getElementById('sasstone').value = items.toneParams
        ? items.toneParams.sass
        : 3
      document.getElementById('formalityeone').value = items.toneParams
        ? items.toneParams.formality
        : 3
      document.getElementById('engagementtone').value = items.toneParams
        ? items.toneParams.engagement
        : 3
      document.getElementById('humortone').value = items.toneParams
        ? items.toneParams.humor
        : 3
      document.getElementById('relatabilitytone').value = items.toneParams
        ? items.toneParams.relatability
        : 3
    }
  )
}

function saveSettings() {
  const apikey = document.getElementById('apikey').value
  const modelName = document.getElementById('modelName').value
  const twitterUsername = document.getElementById('twitterUsername').value
  const replyLength = document.getElementById('replyLength').value
  const interestsSetting = document.getElementById('interestsSetting').value
  const postIdeaFormat = document.getElementById('postIdeaFormat').value
  const replyExamples = document.getElementById('replyExamples').value

  const formalityeone = document.getElementById('formalityeone').value
  const sasstone = document.getElementById('sasstone').value
  const engagementtone = document.getElementById('engagementtone').value
  const humortone = document.getElementById('humortone').value
  const relatabilitytone = document.getElementById('relatabilitytone').value

  const toneParams = {
    formality: formalityeone || 0,
    sass: sasstone || 0,
    humor: humortone || 0,
    engagement: engagementtone || 0,
    relatability: relatabilitytone || 0,
  }

  chrome.storage.sync.set(
    {
      apikey: apikey,
      modelName: modelName,
      twitterUsername: twitterUsername,
      toneParams: toneParams,
      replyLength: parseInt(replyLength),
      interestsSetting: interestsSetting,
      postIdeaFormat: postIdeaFormat,
      replyExamples: replyExamples,
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
