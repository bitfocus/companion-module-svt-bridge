const { Regex } = require('@companion-module/base')
const { parseArgument, parseCommandArguments, sendOsc } = require('./osc')

module.exports = function (self) {
	self.setActionDefinitions({
		play_item: {
			name: 'Play item by id',
			options: [
				{
					id: 'itemId',
					type: 'textinput',
					label: 'Item id',
					regex: Regex.SOMETHING,
					useVariables: true,
				},
			],
			callback: async (event) => {
				await sendOsc(self, '/api/items/playItem', [{ type: 'string', value: String(event.options.itemId || '') }])
			},
		},
		stop_item: {
			name: 'Stop item by id',
			options: [
				{
					id: 'itemId',
					type: 'textinput',
					label: 'Item id',
					regex: Regex.SOMETHING,
					useVariables: true,
				},
			],
			callback: async (event) => {
				await sendOsc(self, '/api/items/stopItem', [{ type: 'string', value: String(event.options.itemId || '') }])
			},
		},
		play_selection: {
			name: 'Play current main selection',
			options: [],
			callback: async () => {
				await sendOsc(self, '/api/client/selection/play')
			},
		},
		stop_selection: {
			name: 'Stop current main selection',
			options: [],
			callback: async () => {
				await sendOsc(self, '/api/client/selection/stop')
			},
		},
		play_tag: {
			name: 'Play items by tag',
			options: [
				{
					id: 'tag',
					type: 'textinput',
					label: 'Tag',
					regex: Regex.SOMETHING,
					useVariables: true,
				},
			],
			callback: async (event) => {
				const tag = encodeURIComponent(String(event.options.tag || ''))
				await sendOsc(self, `/api/items/tags/${tag}/play`)
			},
		},
		stop_tag: {
			name: 'Stop items by tag',
			options: [
				{
					id: 'tag',
					type: 'textinput',
					label: 'Tag',
					regex: Regex.SOMETHING,
					useVariables: true,
				},
			],
			callback: async (event) => {
				const tag = encodeURIComponent(String(event.options.tag || ''))
				await sendOsc(self, `/api/items/tags/${tag}/stop`)
			},
		},
		raw_osc: {
			name: 'Custom OSC',
			options: [
				{
					id: 'path',
					type: 'textinput',
					label: 'OSC path',
					default: '/api/client/selection/play',
					regex: Regex.SOMETHING,
					useVariables: true,
				},
				{
					id: 'type',
					type: 'dropdown',
					label: 'Argument type',
					default: 'none',
					choices: [
						{ id: 'none', label: 'No argument' },
						{ id: 'string', label: 'String' },
						{ id: 'integer', label: 'Integer' },
						{ id: 'float', label: 'Float' },
						{ id: 'boolean', label: 'Boolean (0/1)' },
					],
				},
				{
					id: 'value',
					type: 'textinput',
					label: 'Argument value',
					default: '',
					useVariables: true,
				},
			],
			callback: async (event) => {
				const path = String(event.options.path || '').trim()
				if (!path) {
					self.log('warn', 'OSC path is required')
					return
				}

				const type = String(event.options.type || 'none')
				if (type === 'none') {
					await sendOsc(self, path)
					return
				}

				const argument = parseArgument(type, event.options.value)
				if (!argument) {
					self.log('warn', `Invalid argument value for type ${type}`)
					return
				}

				await sendOsc(self, path, [argument])
			},
		},
	})
}
