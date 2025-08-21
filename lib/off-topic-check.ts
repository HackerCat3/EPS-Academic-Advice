export type OffTopicResult = {
  outcome: "allow" | "block"
  reason?: string
}

// Off-topic keywords and patterns
const OFF_TOPIC_PATTERNS = {
  dating: [
    "dating",
    "boyfriend",
    "girlfriend",
    "crush",
    "relationship",
    "romantic",
    "love",
    "breakup",
    "asking out",
    "date night",
    "valentine",
  ],
  appearance: [
    "rate me",
    "how do i look",
    "am i pretty",
    "am i ugly",
    "appearance rating",
    "looks",
    "attractive",
    "hot or not",
    "beauty",
    "makeup tips",
  ],
  entertainment: [
    "movie review",
    "tv show",
    "netflix",
    "streaming",
    "celebrity",
    "gossip",
    "entertainment",
    "pop culture",
    "music recommendation",
    "concert",
  ],
  memes: [
    "meme",
    "funny pic",
    "joke",
    "lol",
    "lmao",
    "rofl",
    "hilarious",
    "comedy",
    "viral",
    "tiktok",
    "instagram",
    "snapchat",
  ],
  politics: [
    "political",
    "election",
    "vote",
    "democrat",
    "republican",
    "liberal",
    "conservative",
    "government",
    "president",
    "congress",
    "senate",
  ],
  marketplace: [
    "selling",
    "buying",
    "for sale",
    "marketplace",
    "trade",
    "exchange",
    "money",
    "price",
    "cost",
    "cheap",
    "expensive",
    "deal",
  ],
  social: [
    "party",
    "hangout",
    "weekend plans",
    "social event",
    "gathering",
    "meetup",
    "casual chat",
    "whats up",
    "how was your day",
  ],
}

export function offTopicCheck(text: string): OffTopicResult {
  const lowerText = text.toLowerCase()

  // Check each category
  for (const [category, keywords] of Object.entries(OFF_TOPIC_PATTERNS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return {
          outcome: "block",
          reason: `off_topic:${category}`,
        }
      }
    }
  }

  // Additional heuristics for academic content
  const academicKeywords = [
    "homework",
    "assignment",
    "test",
    "exam",
    "study",
    "class",
    "teacher",
    "subject",
    "math",
    "science",
    "english",
    "history",
    "biology",
    "chemistry",
    "physics",
    "algebra",
    "geometry",
    "essay",
    "research",
    "project",
    "grade",
    "school",
    "learning",
    "education",
    "academic",
    "curriculum",
    "lesson",
  ]

  const hasAcademicContent = academicKeywords.some((keyword) => lowerText.includes(keyword.toLowerCase()))

  // If it's very short and has no academic keywords, it might be off-topic
  if (text.trim().length < 20 && !hasAcademicContent) {
    return {
      outcome: "block",
      reason: "off_topic:too_brief",
    }
  }

  return { outcome: "allow" }
}
