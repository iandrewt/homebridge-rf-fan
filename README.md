# homebridge-rf-fan

This is a homebridge plugin to control RF devices, in this case to emulate a Mercator FRM98 fan controller.

## What does this plugin do?

This plugin communicates with [rf-fan](https://github.com/iandrewt/rf-fan) via the REST API. Feel free to fork and modify either the plugin or the API to suit your RF fan.

## Install

To install as a homebridge plugin, just run

```npm install -g homebridge-rf-fan```

## Configuration

The plugin is registered as `rf-fan`. You have the following options:

| Option       | Default   |
| ------------ | --------- |
| host         | localhost |
| port         | 5000      |
| manufacturer | Mercator  |
| model        | FRM98     |
| serial       | 0000-0000 |
| id           | 1         |
