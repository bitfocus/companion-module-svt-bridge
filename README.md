# companion-module-svt-bridge

## Description

Bridge is a generic playout control client that can control almost anything through custom plugins, however first and foremost built for CasparCG. This module will expose the control capabilities that are exposed through OSC as Companion functions.

## Table of contents
- [Description](#description)
- [Quick start](#quick-start)
- [Supported actions](#supported-actions)
- [Technical documentation](#techical-documentation)
- [License](#license)

## Quick start

1. **Enable Bridge's OSC server**  
Within Bridge, go to `Settings > OSC` and choose to enable listening on either TCP or UDP (TCP recommended). Make sure to bind to all interfaces if you're going to run Companion on a different host.

2. **Configure Companion**  
Create a new Connection within Companion and set the host and port to connect to Bridge.

## Supported actions

Supported actions are those that are exposed through Bridge's OSC api. Its reference is available in the [Bridge repository](https://github.com/svt/bridge/tree/main/plugins/osc#reference).

## Techical documentation

See [HELP.md](./companion/HELP.md)

## License  

See [LICENSE](./LICENSE)