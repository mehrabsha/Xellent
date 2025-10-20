function REPLY_SUGGESTION_PROMPT(tweetText, toneParams) {
  return `
Generate 5 different Twitter replies that sound like real people texting, with customizable style parameters for precise control over tone and approach.

## Parameters (Scale 1-10)

**Formality Level** (1-10):
- 1-3: Very casual, internet slang, abbreviations (ur, rn, ngl)
- 4-6: Natural conversational tone, balanced formality
- 7-10: More polished, complete sentences, professional language

**Sass/Attitude Level** (1-10):
- 1-3: Supportive, gentle, encouraging responses
- 4-6: Balanced, natural reactions with mild edge when appropriate
- 7-10: Sharp, witty, sarcastic, potentially confrontational

**Engagement Style** (1-10):
- 1-3: Brief acknowledgments, minimal investment
- 4-6: Standard engagement, some personal input
- 7-10: Highly engaged, detailed responses, personal anecdotes

**Humor Level** (1-10):
- 1-3: Serious, straightforward, minimal jokes
- 4-6: Light humor when contextually appropriate
- 7-10: Comedy-focused, witty observations, meme references

**Relatability Factor** (1-10):
- 1-3: Distant, observational responses
- 4-6: Some shared experiences, moderate connection
- 7-10: Highly relatable, "same energy," shared struggles

## Core Rules
- First understand the tweet's real meaning and tone - is it sarcastic, educational, complaining, joking, motivational etc
- Match that exact energy and context in your reply, modified by parameter settings
- Find the balance between too formal and too casual based on Formality Level
- Minimal punctuation - real people don't pepper texts with commas and periods
- Adjust exclamation marks and corporate language based on Formality Level
- Question usage depends on Engagement Style level
- Be specific instead of using "this," "that," "it"

## Reply Styles (Adjusted by Parameters)
Read the original tweet carefully to understand if it's:
- **Sarcastic/Snarky**: Match sarcasm level to Sass parameter
- **Educational**: Engagement level determines depth of response
- **Complaining**: Relatability factor influences how much you relate
- **Joking**: Humor level determines how much you play along
- **Motivational**: Formality and Sass levels affect supportiveness style
- **Controversial**: All parameters influence response approach
- **Personal story**: Relatability and Engagement determine connection level
- **Asking for help**: Engagement and Formality shape helpfulness style

## Natural Balance Guidelines
- Formality 1-3: Text speak, fragments, very casual
- Formality 4-6: Natural conversation, standard grammar
- Formality 7-10: Complete sentences, proper punctuation

- Sass 1-3: Kind, supportive, gentle
- Sass 4-6: Balanced reactions, appropriate edge
- Sass 7-10: Sharp wit, sarcasm, confrontational when warranted

- Engagement 1-3: "ok," "nice," "cool"
- Engagement 4-6: Standard responses with some input
- Engagement 7-10: Detailed thoughts, questions, personal shares

## Parameter Examples

**High Formality (8), Low Sass (2), Medium Engagement (5)**
Tweet: "Traffic is insane today"
Reply: "I completely understand that frustration. Hope it clears up soon for you."

**Low Formality (3), High Sass (8), High Engagement (7)**
Tweet: "Traffic is insane today"
Reply: "lmao traffic said nah ur not getting anywhere today huh"

**Medium Everything (5,5,5)**
Tweet: "Traffic is insane today"
Reply: "Always happens at the worst times too"

---

**Usage Instructions**:
1. Set your desired parameters (1-10 for each)
2. Provide the original tweet
3. Generator will create 5 replies matching your parameter settings
4. Default parameters if not specified: Formality: 5, Sass: 4, Engagement: 5, Humor: 5, Relatability: 6

**Original Tweet**: "${tweetText}"
**Parameters**: Formality: ${toneParams.formality}, Sass: ${toneParams.sass}, Engagement: ${toneParams.engagement}, Humor: ${toneParams.humor}, Relatability: ${toneParams.relatability}

`
}

function IMPROVE_TEXT_PROMPT(originalText) {
  return `Improve the following text to make it more engaging, clear, and professional while keeping its original meaning and intent. Make it concise but impactful. Provide 5 different improved versions.

Original text: "${originalText}"`
}

async function POST_IDEAS_PROMPT() {
  const interests = await getUserInterests()
  return `Suggest 3 unique and engaging X post ideas about ${interests}.`
}
