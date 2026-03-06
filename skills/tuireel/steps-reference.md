# Step types reference

In `.tuireel.jsonc`, steps are objects in a `steps` array.

Each step is either:

- a step object with a `type` field (one of the types below), or
- an include object: `{ "$include": "./path/to/steps.jsonc" }`

## $include

`$include` can appear inside any `steps` array.

| Field      | Type   | Required | Description                                          |
| ---------- | ------ | -------- | ---------------------------------------------------- |
| `$include` | string | yes      | Path to a JSONC file containing `{ "steps": [...] }` |

The include file must be a JSONC object with a `steps` array:

```jsonc
{ "steps": [{ "type": "press", "key": "Enter" }] }
```

Paths are resolved relative to the including file.

---

## launch

Start a new session by running a command.

| Field     | Type       | Required | Description                |
| --------- | ---------- | -------- | -------------------------- |
| `type`    | `"launch"` | yes      |                            |
| `command` | string     | yes      | Command to run (non-empty) |

```jsonc
{ "type": "launch", "command": "bash" }
```

## type

Type text into the running session.

| Field   | Type     | Required | Description                                    |
| ------- | -------- | -------- | ---------------------------------------------- |
| `type`  | `"type"` | yes      |                                                |
| `text`  | string   | yes      | Text to write into the PTY                     |
| `speed` | number   | no       | Typing speed in ms per character (default: 50) |

```jsonc
{ "type": "type", "text": "echo 'hello'" }
{ "type": "type", "text": "npm install", "speed": 25 }
```

## press

Press a key or key combo.

| Field  | Type      | Required | Description                              |
| ------ | --------- | -------- | ---------------------------------------- |
| `type` | `"press"` | yes      |                                          |
| `key`  | string    | yes      | Key string (examples: `Enter`, `Ctrl+C`) |

```jsonc
{ "type": "press", "key": "Enter" }
{ "type": "press", "key": "Ctrl+C" }
```

## wait

Wait until the terminal output matches a pattern.

| Field     | Type                                          | Required | Description                                           |
| --------- | --------------------------------------------- | -------- | ----------------------------------------------------- |
| `type`    | `"wait"`                                      | yes      |                                                       |
| `pattern` | string or `{ regex: string, flags?: string }` | yes      | Text substring match, or a validated regex            |
| `timeout` | number                                        | no       | Timeout in ms (overrides `defaultWaitTimeout` if set) |

```jsonc
{ "type": "wait", "pattern": "server started", "timeout": 15000 }
{ "type": "wait", "pattern": { "regex": "ready on http://", "flags": "i" } }
```

## pause

Wait a fixed duration.

| Field      | Type      | Required | Description           |
| ---------- | --------- | -------- | --------------------- |
| `type`     | `"pause"` | yes      |                       |
| `duration` | number    | yes      | Milliseconds to sleep |

```jsonc
{ "type": "pause", "duration": 500 }
```

## scroll

Scroll the terminal view.

| Field       | Type               | Required | Description                         |
| ----------- | ------------------ | -------- | ----------------------------------- |
| `type`      | `"scroll"`         | yes      |                                     |
| `direction` | `"up"` or `"down"` | yes      | Direction to scroll                 |
| `amount`    | number             | no       | Number of scroll ticks (default: 3) |

```jsonc
{ "type": "scroll", "direction": "down" }
{ "type": "scroll", "direction": "up", "amount": 10 }
```

## click

Click text in the terminal view.

| Field     | Type      | Required | Description                |
| --------- | --------- | -------- | -------------------------- |
| `type`    | `"click"` | yes      |                            |
| `pattern` | string    | yes      | Text to match for clicking |

```jsonc
{ "type": "click", "pattern": "Continue" }
```

## screenshot

Write a PNG screenshot.

| Field    | Type           | Required | Description                  |
| -------- | -------------- | -------- | ---------------------------- |
| `type`   | `"screenshot"` | yes      |                              |
| `output` | string         | yes      | Output file path (non-empty) |

```jsonc
{ "type": "screenshot", "output": "screenshots/state.png" }
```

## resize

Resize the terminal.

| Field  | Type       | Required | Description     |
| ------ | ---------- | -------- | --------------- |
| `type` | `"resize"` | yes      |                 |
| `cols` | number     | yes      | Terminal width  |
| `rows` | number     | yes      | Terminal height |

```jsonc
{ "type": "resize", "cols": 120, "rows": 30 }
```

## set-env

Set an environment variable for subsequent steps.

| Field   | Type        | Required | Description                                      |
| ------- | ----------- | -------- | ------------------------------------------------ |
| `type`  | `"set-env"` | yes      |                                                  |
| `key`   | string      | yes      | Env var name (pattern: `[A-Za-z_][A-Za-z0-9_]*`) |
| `value` | string      | yes      | Env var value                                    |

```jsonc
{ "type": "set-env", "key": "CI", "value": "1" }
```
