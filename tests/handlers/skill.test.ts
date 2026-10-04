import { test, expect } from "bun:test"
import type { EventMessagePartUpdated } from "@opencode-ai/sdk"
import { handleMessagePartUpdated } from "../../src/handlers/message.ts"
import { makeCtx } from "../helpers.ts"

function event(name: unknown = "testing", status = "completed", callID = "call_1", end: unknown = 2000): EventMessagePartUpdated {
  return { type: "message.part.updated", properties: { part: {
    type: "tool", id: "part_1", sessionID: "ses_1", messageID: "msg_1", callID, tool: "skill",
    state: { status, input: { name, secret: "DO_NOT_EXPORT" }, time: { start: 1000, end }, output: "DO_NOT_EXPORT", error: "DO_NOT_EXPORT" },
  } } } as unknown as EventMessagePartUpdated
}

test("completed named load is metadata-only, completion-timed and callback-deduplicated", () => {
  const { ctx, logger } = makeCtx("test", [], ["tool"])
  handleMessagePartUpdated(event(), ctx)
  handleMessagePartUpdated(event(), ctx)
  const loads = logger.records.filter(r => r.body === "skill_load")
  expect(loads).toHaveLength(1)
  expect(loads[0]!.timestamp).toBe(2000)
  expect(loads[0]!.attributes).toEqual({ "event.name": "skill_load", runtime: "opencode", skill_name: "testing", load_kind: "explicit", status: "ok" })
  expect(JSON.stringify(loads)).not.toContain("DO_NOT_EXPORT")
  handleMessagePartUpdated(event("Plugin:Skill", "completed", "call_2"), ctx)
  expect(logger.records.filter(r => r.body === "skill_load")).toHaveLength(2)
})

test("failed, running, malformed and absent names do not become usage", () => {
  for (const e of [event("testing", "error"), event("testing", "running"), event("bad/name"), event(7), event(""), event("x".repeat(129)), event("testing", "completed", "", 2000), event("testing", "completed", "call_1", NaN)]) {
    const { ctx, logger } = makeCtx("test", [], ["tool"])
    handleMessagePartUpdated(e, ctx)
    expect(logger.records.filter(r => r.body === "skill_load")).toHaveLength(0)
  }
})

test("logs disablement is respected and dedup storage remains bounded", () => {
  const disabled = makeCtx("test", [], ["tool"], false)
  handleMessagePartUpdated(event(), disabled.ctx)
  expect(disabled.logger.records).toHaveLength(0)
  const { ctx, logger } = makeCtx("test", [], ["tool"])
  for (let n = 0; n < 4097; n++) handleMessagePartUpdated(event("testing", "completed", `call_${n}`), ctx)
  handleMessagePartUpdated(event("testing", "completed", "call_4096"), ctx)
  expect(logger.records.filter(r => r.body === "skill_load")).toHaveLength(4097)
  handleMessagePartUpdated(event("testing", "completed", "call_0"), ctx)
  expect(logger.records.filter(r => r.body === "skill_load")).toHaveLength(4098)
})
