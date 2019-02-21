import util from './util/util.js';

export default class WebBluetooth {
	constructor() {
		this._connectionOptions = null;
		this._debug = true;
		this._resetAll();
		this.util = util;
	}

	
	/**
	* connect with a peripheral device
	* for security reasons, every service you want to use, MUST be specified in either options.filters.services or options.optionalServices
	* https://webbluetoothcg.github.io/web-bluetooth/#dom-requestdeviceoptions-optionalservices
	* @param {Object} [options={acceptAllDevices:true}]
	* @param {Array} [options.filters] - Filters to apply on returned list of devices
	* @param {Array} [options.filters.services] - Array of UUIDs of services the device has to advertise
	* @param {String} [options.filters.name] - The name of the device
	* @param {String} [options.filters.namePrefix] - The starting characters of the device name
	* @param {Array} [options.optionalServices] - Array of UUIDs of optional services the device has to offer
	* @returns {Promise} Promise resolving to Boolean
	*/
	async connect(options={acceptAllDevices:true}) {
		this._resetAll();
		if (!options.filters) {
			options.acceptAllDevices = true;
		}
		this._connectionOptions = options;

		try {
			this._device = await navigator.bluetooth.requestDevice(options);
			window.device = this._device;
			this._gattServer = await this._device.gatt.connect();
			return true;
		} catch(error) {
			this._error(`Something went wrong while connecting`, error);
			return false;
		}
	}


	/**
	* disconnect the device
	* @returns {undefined}
	*/
	disconnect() {
		if (this.isConnected) {
			this._device.gatt.disconnect();
			this._resetAll();
		} else {
			console.warn(`Device was not connected`)
		}
	};


	/**
	* check if device is connected
	* @returns {Boolean}
	*/
	get isConnected() {
		return this._device && this._device.gatt.connected;
	};


	/**
	* get the device's name
	* @returns {String} Return the name of the device
	*/
	get name() {
		return this._device.name;
	};


	/**
	* write a value to a characteristic
	* @param {String} serviceUuid - The UUID of the service the characteristic belongs to
	* @param {String} characteristicUuid - The UUID of the characteristic to write to
	* @param {Number} value - The value to write
	* @returns {Promise} Promise resolving to value
	*/
	async writeValue(serviceUuid, characteristicUuid, value) {
		try {
			const characteristic = await this.getCharacteristic(serviceUuid, characteristicUuid);
			return await characteristic.writeValue(value);
		} catch(error) {
			this._error(`Couldn't write value`, error);
		}
	};


	/**
	* read a value from a characteristic
	* @param {String} serviceUuid - The UUID of the service the characteristic belongs to
	* @param {String} characteristicUuid - The UUID of the characteristic to read from
	* @param {dataType} [returnType] - The data type of the return value DataView, String or Uint8Array
	* @returns {Promise} Promise resolving to value (DataView, String or Array)
	*/
	async readValue(serviceUuid, characteristicUuid, returnType = DataView) {
		try {
			const characteristic = await this.getCharacteristic(serviceUuid, characteristicUuid);
			if (characteristic.properties.read) {
				return await characteristic.readValue()
					.then((dataView) => {
						let value = dataView;
						if (returnType !== DataView) {
							if (returnType === String) {
								value = util.transform.dataViewToString(dataView);
							} else if (returnType === Uint8Array) {
								value = this.util.transform.dataViewToUint8Array(dataView);
							}
						}
						return value;
					});
			} else {
				console.warn('characteristic does not support read: ', this._getOperationsString(characteristic));
			}
		} catch(error) {
			console.warn(`Couldn't read value: `, error);
		}
	};

	get device() {
		return this._device
	}


	/**
	* get a characteristic from the device
	* @param {String | Number} serviceUuid - The UUID of the service to retrieve
	* @returns {Promise} Promise resolving to BluetoothGATTService
	*/
	async getService(serviceUuid) {
		if (!this.isConnected) {
			throw new Error('Device not connected');
		}

		// check if we've already got this service
		let service = this._services.get(serviceUuid);
		if (typeof service === 'undefined') {
			// this service hasn't been requested yet
			try {
				service = await this._gattServer.getPrimaryService(serviceUuid);
				// cache for later use
				this._services.set(serviceUuid, service);
			} catch(error) {
				this._error(`Error getting service`, error);
				throw error;
			}
		}
		return service;
	};


	/**
	* get a characteristic from the device
	* @param {string} serviceUuid - The UUID of the service the characteristic belongs to
	* @param {string} characteristicUuid - The UUID of the characteristic to retrieve
	* @returns {Promise} Promise resolving to BluetoothGATTCharacteristic
	*/
	async getCharacteristic(serviceUuid, characteristicUuid) {
		if (!this.isConnected) {
			throw new Error('Device not connected');
		}

		// check if we've already got this characteristic
		let characteristic = this._characteristics.get(characteristicUuid);
		if (typeof characteristic === 'undefined') {
			// this characteristic hasn't been requested yet
			try {
				const service = await this.getService(serviceUuid);
				characteristic = await service.getCharacteristic(characteristicUuid);
				// cache for later use
				this._characteristics.set(characteristicUuid, characteristic);
			} catch(error) {
				this._error(`Error getting characteristic`, error);
				throw error;
			}
		}
		return characteristic;
	};


	//-- Start private functions ------------------

	/**
	* reset all variables
	* @returns {undefined}
	*/
	_resetAll() {
		this._device = null;
		this._gattServer = null;
		this._services = new Map();// all services we've connected with
		this._characteristics = new Map();// all characteristics we've found
	};

	
	/**
	* get a string with characteristic's operations and their value (read, write, notify)
	* @param {characteristic} char - The characteristic
	* @returns {undefined}
	*/
	_getOperationsString(characteristic) {
		return `Read: ${characteristic.properties.read}; Write: ${characteristic.properties.write}; Notify: ${characteristic.properties.notify}`;
	};


	//-- helper functions


	/**
	* log an error to the console
	* @param {string} msg - Your custom error message
	* @param {Error} error - The error that was thrown
	* @returns {undefined}
	*/
	_error(msg, error) {
		if (this._debug) {
			console.error(`${msg}\n ${error.name}: ${error.message}`);
		}
	};

}
