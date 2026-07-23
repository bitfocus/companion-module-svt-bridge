## Bridge OSC Companion Module

This module sends OSC commands to the Bridge OSC plugin.

Set Bridge transport, host and port in the module config.

- UDP default port: `8080`
- TCP default port: `8081`

UDP is connectionless, so the module can only report that the target is configured.
TCP uses a persistent socket and reports real connection state.

## Available Actions

- Play item by id
  - Sends `/api/items/playItem` with item id argument.
- Stop item by id
  - Sends `/api/items/stopItem` with item id argument.
- Play current main selection
  - Sends `/api/client/selection/play`.
- Stop current main selection
  - Sends `/api/client/selection/stop`.
- Play items by tag
  - Sends `/api/items/tags/:tag/play`.
- Stop items by tag
  - Sends `/api/items/tags/:tag/stop`.
- Send raw OSC path
  - Sends any OSC path, optionally with one typed argument.

## Variables

- `last_path`: The last OSC path sent from this module.
- `last_args`: JSON representation of the last OSC arguments sent.
