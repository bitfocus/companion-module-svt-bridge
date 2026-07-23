const { InstanceStatus, TCPHelper } = require('@companion-module/base')

const DEFAULT_PORTS = {
	udp: 8080,
	tcp: 8081,
}

function parseInteger(value) {
	const parsed = Number.parseInt(String(value), 10)
	return Number.isNaN(parsed) ? undefined : parsed
}

function parseFloatValue(value) {
	const parsed = Number.parseFloat(String(value))
	return Number.isNaN(parsed) ? undefined : parsed
}

function parseBoolean(value) {
	if (typeof value === 'boolean') {
		return value
	}

	const normalised = String(value).trim().toLowerCase()
	if (
		normalised === 'true' ||
		normalised === 't' ||
		normalised === '1' ||
		normalised === 'yes' ||
		normalised === 'on'
	) {
		return true
	}
	if (
		normalised === 'false' ||
		normalised === 'f' ||
		normalised === '0' ||
		normalised === 'no' ||
		normalised === 'off'
	) {
		return false
	}

	return undefined
}

function parseArgument(type, value) {
	const selectedType = String(type || 'string').toLowerCase()

	switch (selectedType) {
		case 'string':
			return { type: 'string', value: String(value) }
		case 'integer': {
			const integerValue = parseInteger(value)
			if (integerValue === undefined) {
				return undefined
			}
			return { type: 'integer', value: integerValue }
		}
		case 'float': {
			const floatValue = parseFloatValue(value)
			if (floatValue === undefined) {
				return undefined
			}
			return { type: 'float', value: floatValue }
		}
		case 'boolean': {
			const boolValue = parseBoolean(value)
			if (boolValue === undefined) {
				return undefined
			}
			return { type: 'boolean', value: boolValue }
		}
		default:
			return undefined
	}
}

function parseCommandArguments(rawValue) {
	const input = String(rawValue || '').trim()
	if (!input) {
		return []
	}

	let parsed
	try {
		parsed = JSON.parse(input)
	} catch (error) {
		return undefined
	}

	if (!Array.isArray(parsed)) {
		return undefined
	}

	const converted = []
	for (const arg of parsed) {
		if (typeof arg === 'string') {
			converted.push({ type: 'string', value: arg })
		} else if (typeof arg === 'number') {
			if (Number.isInteger(arg)) {
				converted.push({ type: 'integer', value: arg })
			} else {
				converted.push({ type: 'float', value: arg })
			}
		} else if (typeof arg === 'boolean') {
			converted.push({ type: 'boolean', value: arg })
		} else {
			return undefined
		}
	}

	return converted
}

function getProtocol(self) {
	const protocol = String(self.config?.protocol || 'udp').trim().toLowerCase()
	return protocol === 'tcp' ? 'tcp' : 'udp'
}

function getConnection(self) {
	const protocol = getProtocol(self)
	const host = String(self.config?.host || '').trim()
	const port = parseInteger(self.config?.port) ?? DEFAULT_PORTS[protocol]

	if (!host || port === undefined || port < 1 || port > 65535) {
		return undefined
	}

	return { protocol, host, port }
}

function encodeUdpArgs(args) {
	return args.map((arg) => {
		switch (arg.type) {
			case 'string':
				return { type: 's', value: arg.value }
			case 'integer':
				return { type: 'i', value: arg.value }
			case 'float':
				return { type: 'f', value: arg.value }
			case 'boolean':
				return { type: 'i', value: arg.value ? 1 : 0 }
			default:
				return undefined
		}
	})
}

function padBuffer(buffer) {
	const remainder = buffer.length % 4
	if (remainder === 0) {
		return buffer
	}

	return Buffer.concat([buffer, Buffer.alloc(4 - remainder)])
}

function encodeOscString(value) {
	return padBuffer(Buffer.from(`${value}\0`, 'utf8'))
}

function encodeOscArgument(arg) {
	switch (arg.type) {
		case 'string':
			return encodeOscString(arg.value)
		case 'integer': {
				const buffer = Buffer.alloc(4)
				buffer.writeInt32BE(arg.value, 0)
				return buffer
		}
		case 'float': {
				const buffer = Buffer.alloc(4)
				buffer.writeFloatBE(arg.value, 0)
				return buffer
		}
		case 'boolean':
			return Buffer.alloc(0)
		default:
			throw new Error(`Unsupported OSC argument type: ${arg.type}`)
	}
}

function encodeTcpBuffer(path, args) {
	const typeTags = `,${args
		.map((arg) => {
			switch (arg.type) {
				case 'string':
					return 's'
				case 'integer':
					return 'i'
				case 'float':
					return 'f'
				case 'boolean':
					return arg.value ? 'T' : 'F'
				default:
					throw new Error(`Unsupported OSC argument type: ${arg.type}`)
			}
		})
		.join('')}`

	return Buffer.concat([
		encodeOscString(path),
		encodeOscString(typeTags),
		...args.map((arg) => encodeOscArgument(arg)),
	])
}

function destroyTransport(self) {
	if (self.tcpClient) {
		self.tcpClient.destroy()
		self.tcpClient = undefined
	}
}

function getTcpStatusMessage(status, message, connection) {
	if (message) {
		return message
	}

	switch (status) {
		case InstanceStatus.Connecting:
			return `Connecting to Bridge TCP OSC at ${connection.host}:${connection.port}`
		case InstanceStatus.Ok:
			return `Connected to Bridge TCP OSC at ${connection.host}:${connection.port}`
		case InstanceStatus.Disconnected:
			return `Disconnected from Bridge TCP OSC at ${connection.host}:${connection.port}`
		case InstanceStatus.UnknownError:
			return `TCP OSC error at ${connection.host}:${connection.port}`
		default:
			return undefined
	}
}

function setupTransport(self) {
	destroyTransport(self)

	const connection = getConnection(self)
	if (!connection) {
		self.updateStatus(InstanceStatus.BadConfig, 'Set a valid host and port')
		return
	}

	if (connection.protocol === 'udp') {
		self.updateStatus(InstanceStatus.UnknownWarning, 'UDP target configured; remote OSC availability cannot be verified')
		return
	}

	const tcpClient = new TCPHelper(connection.host, connection.port)
	self.tcpClient = tcpClient

	tcpClient.on('status_change', (status, message) => {
		self.updateStatus(status, getTcpStatusMessage(status, message, connection))
	})
	tcpClient.on('error', (error) => {
		self.log('warn', `TCP OSC error: ${error.message}`)
	})

	self.updateStatus(InstanceStatus.Connecting, getTcpStatusMessage(InstanceStatus.Connecting, undefined, connection))
}

async function sendOsc(self, path, args = []) {
	const connection = getConnection(self)
	if (!connection) {
		self.updateStatus(InstanceStatus.BadConfig, 'Invalid host or port')
		self.log('error', `Unable to send OSC message. Invalid connection config for path ${path}`)
		return false
	}

	if (connection.protocol === 'tcp') {
		if (!self.tcpClient || self.tcpClient.isDestroyed) {
			self.updateStatus(InstanceStatus.ConnectionFailure, 'TCP client is not available')
			self.log('error', `Unable to send OSC message. TCP client is unavailable for path ${path}`)
			return false
		}

		const sent = await self.tcpClient.sendAsync(encodeTcpBuffer(path, args))
		if (!sent) {
			self.updateStatus(InstanceStatus.Connecting, 'TCP socket is not connected yet')
			self.log('warn', `TCP OSC message not sent because the socket is not connected: ${path}`)
			return false
		}
	} else {
		self.oscSend(connection.host, connection.port, path, encodeUdpArgs(args))
		self.updateStatus(InstanceStatus.UnknownWarning, 'OSC sent over UDP; remote OSC availability is not confirmed')
	}

	self.setVariableValues({
		last_path: path,
		last_args: JSON.stringify(args),
	})

	return true
}

module.exports = {
	getConnection,
	getProtocol,
	parseArgument,
	parseCommandArguments,
	setupTransport,
	destroyTransport,
	sendOsc,
}
