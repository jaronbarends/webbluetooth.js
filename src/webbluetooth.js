const WebBluetooth = (function() {

	'use strict';

	//-- start utitility functions

	/**
	* convert the numbers in a dataView to text
	* @returns {undefined}
	*/
	const dataViewToTextOld = function(dataView) {
		// the dataView returned by readValue represents a dataBuffer
		// a dataBuffer has a length in bytes (1 byte is 8 bits, representing 0-255)
		// you can pull data out of the dataView in chunks with methods like getUint8, getUint16 or getUint32
		// which give you a chunk of 8 bits (1 byte), 16 bits (2 bytes) or 32 bits (4 bytes) respectively.
		// how many bytes you need to examine together depends on the type of data the buffer represents.
		// if it represents somewhat large numbers, you may need to look at 2 bytes
		// regular text characters can be represented by a single byte;
		// we can get one such byte using getUint8 (which represents 0-255)
		// these numbers can be mapped to the character they represent
		let str = '';
		for (let i=0; i<dataView.byteLength; i++) {
			str += String.fromCharCode(dataView.getUint8( i ));
		}
		return str;
	}

	/**
	* convert the numbers in a dataView to text
	* @returns {undefined}
	*/
	const dataViewToText = function(dataView) {
		const uint8Array = dataViewToUint8Array(dataView);
		const decoder = new TextDecoder('utf-8');
		return decoder.decode(uint8Array);
	};
	

	/**
	* get the uint8 array for the dataView's view on its buffer
	* @returns {undefined}
	*/
	const dataViewToUint8Array = function(dataView) {
		// todo: take byte offset and byte length into account
		return new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
	};
	


	// define util object that we can point to from class
	const util = {
		dataViewToText,
		dataViewToUint8Array,
	};

	class WebBluetooth {
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
		* @param {object} [options={acceptAllDevices:true}]
		* @param {array} [options.filters] - Filters to apply on returned list of devices
		* @param {array} [options.filters.services] - Array of UUIDs of services the device has to advertise
		* @param {string} [options.filters.name] - The name of the device
		* @param {string} [options.filters.namePrefix] - The starting characters of the device name
		* @param {array} [options.optionalServices] - Array of UUIDs of optional services the device has to offer
		* @returns {boolean}
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
		* @returns {undefined}
		*/
		get isConnected() {
			return this._device && this._device.gatt.connected;
		};


		/**
		* 
		* @returns {undefined}
		*/
		get name() {
			return this._device.name;
		};


		/**
		* write a value to a characteristic
		* @param {string} serviceUuid - The UUID of the service the characteristic belongs to
		* @param {string} characteristicUuid - The UUID of the characteristic to write to
		* @param {number} vale - The value to write
		* @returns {undefined}
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
		* 
		* @returns {undefined}
		*/
		async readValue(serviceUuid, characteristicUuid, returnType = DataView) {
			try {
				const characteristic = await this.getCharacteristic(serviceUuid, characteristicUuid);
				if (characteristic.properties.read) {
					characteristic.oncharacteristicvaluechanged = ((e) => {
						// console.log('change');
					});
					return await characteristic.readValue()
						.then((dataView) => {
							let value = dataView;
							if (returnType !== DataView) {
								if (returnType === String) {
									value = dataViewToText(dataView);
								} else if (returnType === Uint8Array) {
									value = dataViewToUint8Array(dataView);
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
		* @returns {service}
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
		* @returns {characteristic}
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
		* @param {characteristic} ch - The characteristic
		* @returns {undefined}
		*/
		_getOperationsString(ch) {
			return `Read: ${ch.properties.read}; Write: ${ch.properties.write}; Notify: ${ch.properties.notify}`;
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

	return WebBluetooth;

})();