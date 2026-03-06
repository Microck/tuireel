# tuireel config examples

These examples are copy-pasteable starting points for `.tuireel.jsonc`.

Notes:

- Config files are JSONC (comments and trailing commas allowed).
- `pause.duration` is milliseconds.

## Minimal hello-world

Type a command in a shell and wait briefly before ending the recording.

```jsonc
{
  "output": "demo.mp4",
  "steps": [
    { "type": "launch", "command": "bash" },
    { "type": "type", "text": "echo 'hello from tuireel'" },
    { "type": "press", "key": "Enter" },
    { "type": "pause", "duration": 1200 },
  ],
}
```

## Wait for output (string match)

Wait until a line appears before continuing.

```jsonc
{
  "output": "wait-string.mp4",
  "steps": [
    { "type": "launch", "command": "bash" },
    { "type": "type", "text": "echo 'ready'" },
    { "type": "press", "key": "Enter" },
    { "type": "wait", "pattern": "ready", "timeout": 5000 },
    { "type": "pause", "duration": 800 },
  ],
}
```

## Wait for output (regex match)

Use a regex when output varies.

```jsonc
{
  "output": "wait-regex.mp4",
  "steps": [
    { "type": "launch", "command": "bash" },
    { "type": "type", "text": "date +%s" },
    { "type": "press", "key": "Enter" },
    { "type": "wait", "pattern": { "regex": "^[0-9]{10}$" }, "timeout": 5000 },
    { "type": "pause", "duration": 800 },
  ],
}
```

## Multi-video suite (defaults + videos array)

Record multiple videos from one file.

```jsonc
{
  "defaults": {
    "preset": "polished",
    "cols": 120,
    "rows": 30,
  },
  "videos": [
    {
      "name": "install",
      "output": "videos/install.mp4",
      "steps": [
        { "type": "launch", "command": "bash" },
        { "type": "type", "text": "npm install tuireel" },
        { "type": "press", "key": "Enter" },
        { "type": "pause", "duration": 1500 },
      ],
    },
    {
      "name": "help",
      "output": "videos/help.mp4",
      "steps": [
        { "type": "launch", "command": "bash" },
        { "type": "type", "text": "tuireel --help" },
        { "type": "press", "key": "Enter" },
        { "type": "pause", "duration": 1500 },
      ],
    },
  ],
}
```

## Share steps with $include

Pull a reusable step sequence into multiple recordings.

```jsonc
{
  "output": "include-demo.mp4",
  "steps": [
    { "$include": "./shared/setup.steps.jsonc" },
    { "type": "type", "text": "echo 'main demo starts here'" },
    { "type": "press", "key": "Enter" },
    { "type": "pause", "duration": 1200 },
  ],
}
```

Include files must be objects with a `steps` array:

```jsonc
// shared/setup.steps.jsonc
{
  "steps": [
    { "type": "launch", "command": "bash" },
    { "type": "set-env", "key": "DEMO", "value": "1" },
    { "type": "type", "text": "echo 'setup complete'" },
    { "type": "press", "key": "Enter" },
    { "type": "pause", "duration": 600 },
  ],
}
```
