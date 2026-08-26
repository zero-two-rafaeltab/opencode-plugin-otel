import { describe, expect, test } from "bun:test"
import { estimateHypotheticalApiCost } from "../src/pricing.ts"

describe("estimateHypotheticalApiCost", () => {
  test("prices the terra-fast subscription alias at frozen Standard API rates", () => {
    expect(estimateHypotheticalApiCost({
      providerID: "openai",
      modelID: "gpt-5.6-terra-fast",
      input: 100_000,
      output: 20_000,
      reasoning: 5_000,
      cacheRead: 50_000,
      cacheWrite: 10_000,
    })).toEqual({
      amountUsd: 0.535,
      contextBand: "short",
      pricedModel: "gpt-5.6-terra",
      mappingMethod: "explicit_subscription_alias",
    })
  })

  test("uses the long-context schedule above 272000 request input tokens", () => {
    expect(estimateHypotheticalApiCost({
      providerID: "openai",
      modelID: "gpt-5.6-sol",
      input: 272_001,
      output: 0,
      reasoning: 0,
      cacheRead: 0,
      cacheWrite: 0,
    })).toEqual({
      amountUsd: 2.176008,
      contextBand: "long",
      pricedModel: "gpt-5.6-sol",
      mappingMethod: "exact",
    })
  })

  test("maps only the six explicit Standard and subscription identities", () => {
    for (const [modelID, pricedModel, mappingMethod] of [
      ["gpt-5.6-luna", "gpt-5.6-luna", "exact"],
      ["gpt-5.6-luna-fast", "gpt-5.6-luna", "explicit_subscription_alias"],
      ["gpt-5.6-terra", "gpt-5.6-terra", "exact"],
      ["gpt-5.6-terra-fast", "gpt-5.6-terra", "explicit_subscription_alias"],
      ["gpt-5.6-sol", "gpt-5.6-sol", "exact"],
      ["gpt-5.6-sol-fast", "gpt-5.6-sol", "explicit_subscription_alias"],
    ] as const) {
      expect(estimateHypotheticalApiCost({
        providerID: "openai",
        modelID,
        input: 0,
        output: 0,
        reasoning: 0,
        cacheRead: 0,
        cacheWrite: 0,
      })).toEqual({ amountUsd: 0, contextBand: "short", pricedModel, mappingMethod })
    }
  })

  test("keeps exactly 272000 request input tokens in the short-context band", () => {
    expect(estimateHypotheticalApiCost({
      providerID: "openai",
      modelID: "gpt-5.6-sol",
      input: 272_000,
      output: 0,
      reasoning: 0,
      cacheRead: 0,
      cacheWrite: 0,
    })).toEqual({
      amountUsd: 1.088,
      contextBand: "short",
      pricedModel: "gpt-5.6-sol",
      mappingMethod: "exact",
    })
  })

  test("does not estimate unknown provider and model pairs", () => {
    const usage = {
      modelID: "gpt-5.6-terra-fast",
      input: 100,
      output: 100,
      reasoning: 0,
      cacheRead: 0,
      cacheWrite: 0,
    }
    expect(estimateHypotheticalApiCost({ providerID: "anthropic", ...usage })).toBeUndefined()
    expect(estimateHypotheticalApiCost({ providerID: "openai", ...usage, modelID: "gpt-5.6-unknown" })).toBeUndefined()
  })
})
