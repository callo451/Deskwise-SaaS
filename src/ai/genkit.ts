import { genkit } from 'genkit'
import { googleAI } from '@genkit-ai/googleai'

// Initialize Genkit with Google AI plugin
export const ai = genkit({
  plugins: [googleAI()],
})

/**
 * Generate knowledge base article from a prompt
 */
export async function generateArticle(prompt: string, context?: string) {
  const { text } = await ai.generate({
    model: 'googleai/gemini-2.0-flash-exp',
    prompt: `You are a technical documentation expert. Generate a comprehensive knowledge base article based on the following:

${context ? `Context: ${context}\n\n` : ''}Prompt: ${prompt}

Generate a well-structured article with:
- A clear, descriptive title
- An introduction explaining the topic
- Step-by-step instructions or detailed explanation
- Best practices or tips
- A conclusion or summary

Format the article in markdown.`,
  })

  return text
}

/**
 * Generate article from ticket description
 */
export async function generateArticleFromTicket(
  ticketTitle: string,
  ticketDescription: string,
  resolution?: string
) {
  const { text } = await ai.generate({
    model: 'googleai/gemini-2.0-flash-exp',
    prompt: `You are a technical support expert. Create a knowledge base article from this support ticket:

**Ticket Title:** ${ticketTitle}

**Issue Description:**
${ticketDescription}

${resolution ? `**Resolution:**\n${resolution}\n\n` : ''}

Generate a comprehensive how-to article that would help users solve this issue themselves. Include:
- A descriptive title
- Problem description
- Step-by-step solution
- Troubleshooting tips
- Prevention recommendations

Format in markdown.`,
  })

  return text
}

/**
 * Suggest related articles for a ticket
 */
export async function suggestRelatedArticles(
  ticketTitle: string,
  ticketDescription: string,
  existingArticles: Array<{ title: string; content: string }>
) {
  const articlesContext = existingArticles
    .map((a, i) => `${i + 1}. ${a.title}`)
    .join('\n')

  const { text } = await ai.generate({
    model: 'googleai/gemini-2.0-flash-exp',
    prompt: `Based on this support ticket, which of these knowledge base articles would be most relevant?

**Ticket:** ${ticketTitle}
**Description:** ${ticketDescription}

**Available Articles:**
${articlesContext}

Return the top 3 most relevant article numbers (just the numbers, comma-separated).`,
  })

  return text
}

/**
 * Generate troubleshooting guide
 */
export async function generateTroubleshootingGuide(topic: string) {
  const { text } = await ai.generate({
    model: 'googleai/gemini-2.0-flash-exp',
    prompt: `Create a comprehensive troubleshooting guide for: ${topic}

Include:
- Common symptoms
- Possible causes
- Step-by-step diagnosis
- Solutions for each scenario
- When to escalate
- Prevention tips

Format in markdown with clear headings.`,
  })

  return text
}

/**
 * Generate FAQ article
 */
export async function generateFAQ(topic: string, commonQuestions?: string[]) {
  const questionsContext = commonQuestions
    ? `Common questions users have asked:\n${commonQuestions.map((q) => `- ${q}`).join('\n')}\n\n`
    : ''

  const { text } = await ai.generate({
    model: 'googleai/gemini-2.0-flash-exp',
    prompt: `Create a comprehensive FAQ article about: ${topic}

${questionsContext}Generate at least 8-10 frequently asked questions with detailed answers.
Format in markdown with clear Q&A structure.`,
  })

  return text
}

/**
 * Improve existing article
 */
export async function improveArticle(
  currentContent: string,
  improvementGoal: string
) {
  const { text } = await ai.generate({
    model: 'googleai/gemini-2.0-flash-exp',
    prompt: `Improve this knowledge base article with the following goal: ${improvementGoal}

**Current Article:**
${currentContent}

**Improvement Goal:** ${improvementGoal}

Rewrite the article to be more ${improvementGoal}. Maintain the markdown format and keep all important information.`,
  })

  return text
}

/**
 * Generate article from recorded steps (Chrome extension)
 */
export async function generateArticleFromSteps(
  steps: Array<{
    stepNumber: number
    action: string
    description: string
    element?: any
    screenshotUrl?: string
    url?: string
  }>,
  metadata: {
    url: string
    title: string
    description?: string
  }
) {
  // Build context from steps
  const stepsContext = steps
    .map((step) => {
      let stepText = `${step.stepNumber}. ${step.description}`
      if (step.element?.tagName) {
        stepText += ` (${step.element.tagName}${step.element.text ? `: "${step.element.text}"` : ''})`
      }
      return stepText
    })
    .join('\n')

  const { text } = await ai.generate({
    model: 'googleai/gemini-2.0-flash-exp',
    prompt: `You are a technical documentation expert. Create a comprehensive step-by-step guide from the following recorded user actions:

**Page URL:** ${metadata.url}
**Task:** ${metadata.title}
${metadata.description ? `**Description:** ${metadata.description}\n` : ''}

**Recorded Steps:**
${stepsContext}

Generate a professional knowledge base article with:
- A clear, descriptive title (action-oriented, e.g., "How to...", "Setting up...")
- A brief introduction explaining what this guide accomplishes
- Detailed step-by-step instructions (numbered list)
- Each step should be clear and actionable
- Include helpful tips or notes where appropriate
- A conclusion summarizing what was accomplished
- Any important prerequisites or requirements

Format in markdown. Make the instructions clear enough that someone unfamiliar with the process can follow them.`,
  })

  return text
}
