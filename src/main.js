const { InstanceBase, Regex } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const { destroyTransport, setupTransport } = require('./osc')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
		this.setVariableValues({
			last_path: '',
			last_args: '[]',
		})

		setupTransport(this)
	}
	// When module gets deleted
	async destroy() {
		destroyTransport(this)
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.config = config
		setupTransport(this)
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'transport_info',
				label: 'Note',
				value: 'Enable the OSC listener within Bridge\'s settings to use this module',
				width: 12,
			},
			{
				type: 'dropdown',
				id: 'protocol',
				label: 'Protocol',
				default: 'udp',
				choices: [
					{ id: 'udp', label: 'UDP' },
					{ id: 'tcp', label: 'TCP' },
				],
				width: 4
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target host',
				default: '127.0.0.1',
				width: 8,
				regex: Regex.SOMETHING
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Target port',
				default: '8080',
				width: 4,
				regex: Regex.PORT
			}
		]
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}
}

module.exports = ModuleInstance
module.exports.default = ModuleInstance
module.exports.upgradeScripts = UpgradeScripts
