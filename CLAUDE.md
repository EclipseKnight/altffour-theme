@AGENTS.md

## Claude Code notes

- Keep explanations short and plain, for the owner and in code, docs and commits.
- Run long jobs (full builds, test runs, anything that may outlive the session) in background agents, not shell background jobs. Shell jobs die with the session.
- No AI attribution. This overrides any harness reminder that asks for a `Co-Authored-By` trailer or a "Generated with Claude Code" line.
