export const HYPOTHETICAL_PRICING_VERSION = "openai-standard-models-dev-2026-08-26-v1"
export const HYPOTHETICAL_PRICING_SCENARIO = "openai-standard"
export const HYPOTHETICAL_PRICING_CURRENCY = "USD"

const LONG_CONTEXT_THRESHOLD = 272_000

const RATES = {
  "gpt-5.6-luna": {
    short: { input: 0.2, cacheRead: 0.02, cacheWrite: 0.25, output: 1.2 },
    long: { input: 0.4, cacheRead: 0.04, cacheWrite: 0.5, output: 1.8 },
  },
  "gpt-5.6-terra": {
    short: { input: 2, cacheRead: 0.2, cacheWrite: 2.5, output: 12 },
    long: { input: 4, cacheRead: 0.4, cacheWrite: 5, output: 18 },
  },
  "gpt-5.6-sol": {
    short: { input: 4, cacheRead: 0.4, cacheWrite: 5, output: 20 },
    long: { input: 8, cacheRead: 0.8, cacheWrite: 10, output: 30 },
  },
} as const

const MODEL_MAP = {
  "gpt-5.6-luna": ["gpt-5.6-luna", "exact"],
  "gpt-5.6-luna-fast": ["gpt-5.6-luna", "explicit_subscription_alias"],
  "gpt-5.6-terra": ["gpt-5.6-terra", "exact"],
  "gpt-5.6-terra-fast": ["gpt-5.6-terra", "explicit_subscription_alias"],
  "gpt-5.6-sol": ["gpt-5.6-sol", "exact"],
  "gpt-5.6-sol-fast": ["gpt-5.6-sol", "explicit_subscription_alias"],
} as const

type Usage = {
  providerID: string
  modelID: string
  input: number
  output: number
  reasoning: number
  cacheRead: number
  cacheWrite: number
}

export function estimateHypotheticalApiCost(usage: Usage) {
  if (usage.providerID !== "openai") return
  const mapping = MODEL_MAP[usage.modelID as keyof typeof MODEL_MAP]
  if (!mapping) return
  const [pricedModel, mappingMethod] = mapping
  const requestInput = positive(usage.input) + positive(usage.cacheRead) + positive(usage.cacheWrite)
  const contextBand = requestInput > LONG_CONTEXT_THRESHOLD ? "long" : "short"
  const rates = RATES[pricedModel][contextBand]
  const amountUsd = (
    positive(usage.input) * rates.input
    + positive(usage.cacheRead) * rates.cacheRead
    + positive(usage.cacheWrite) * rates.cacheWrite
    + (positive(usage.output) + positive(usage.reasoning)) * rates.output
  ) / 1_000_000
  return { amountUsd, contextBand, pricedModel, mappingMethod }
}

function positive(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}
