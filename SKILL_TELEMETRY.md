# Named skill-load telemetry

Successful `skill` tool completions emit a metadata-only `skill_load` log with `event.name=skill_load`, `runtime=opencode`, `skill_name`, `load_kind=explicit`, and `status=ok`. Available/discovered skills, failures, and running operations are excluded. This observes loading, not instruction adherence.

The timestamp is the tool completion timestamp; observedTimestamp is the callback observation time. Names preserve case and qualification and must match `[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}`. Missing identity, malformed name, or nonfinite completion time fails closed. Session/call identities are retained only in a 4096-entry context-local FIFO for callback deduplication; they are not exported by this signal. Replays beyond that bound or across processes may be counted again. Existing generic telemetry is unchanged.

The usual telemetry/log gates apply. No prompts, skill file contents, tool inputs/outputs, or secrets are emitted by this new signal. Existing telemetry privacy settings still require independent review.

Verification on 2026-10-04: typecheck passed; 336 tests passed, 645 assertions. Real OpenCode 1.18.28 loaded workspace skill `telemetry-verification` with this plugin, prompt capture off and traces disabled. Loki returned its actual completion at 1791113232895000000 ns, observed at 1791113232896000000 ns, host `zerotwo`. This was an isolated canary, not a permanent pin or remote deployment.

Dashboard orchestration: Kanban t_098f7439; https://github.com/zero-two-rafaeltab/homelab-grafana-dashboards/issues/1. Fork Issues are disabled; tracking remains on that cross-runtime task. Existing manjaro deployment still lacks named skill instrumentation. Deployment there requires separately approved host scope; no restart is performed by this change.

Rollback: revert the producer commit through review and restore the previous plugin pin for future processes. Any restart requires explicit approval.
