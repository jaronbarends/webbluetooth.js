/*
* A class representing a bluetooth device
* This class is meant to create an object that is more similar
* to a human interpretation of a device - something you can
* read, write and connect with
* It abstracts away some of the intricacies
* around gatt server, services and characteristics
*/
export default class WebBluetoothDevice {

	//-- Start public functions ----

		constructor(gattServer, connectionOptions, webBluetooth) {
			this._resetDeviceEnvironment();
			this._debug = true;
			this._webBluetooth = webBluetooth;
			this._gattServer = gattServer;
			this._deviceObj = gattServer.device;
			this._connectionOptions = connectionOptions;
			this.util = this._webBluetooth.util;

			this._getRequestedServices();
		}

		
		/**
		* disconnect the device
		* @returns {undefined}
		*/
		disconnect() {
			if (this.isConnected) {
				this._gattServer.disconnect();
				this._resetDeviceEnvironment();
			} else {
				console.warn(`Device was not connected`)
			}
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


		/**
		* this class is an abstraction of several classes
		* I think only this._deviceObj dispatches an event (gattserverdisconnected)
		* so pass it on to the original device object
		* @returns {undefined}
		*/
		addEventListener(eventName, callback) {
			if (eventName === 'gattserverdisconnected') {
				this._deviceObj.addEventListener(eventName, callback);
			} else {
				console.warn(`This abstraction class only supports adding gattserverdisconnected. If you want to add an other listener, try adding it to that object directly`);
			}
		};

	//-- End public functions ----



	//-- Start getters / setters ----

		/**
		* get this device's deviceObj's id
		* @returns {undefined}
		*/
		get id() {
			return this._deviceObj.id;
		};

		/**
		* check if device is connected
		* @returns {Boolean}
		*/
		get isConnected() {
			// return this._deviceObj && this._deviceObj.gatt.connected;
			return this._gattServer && this._gattServer.connected;
		};


		/**
		* get this devices gattServer
		* @returns {undefined}
		*/
		get gatt() {
			return this._gattServer;
		}


		/**
		* get the device's name
		* @returns {String} Return the name of the device
		*/
		get name() {
			return this._deviceObj.name;
		};


		/*
		* get the "real" BluetoothDevice object
		*/
		get deviceObj() {
			return this._deviceObj
		}
	
	//-- End getters / setters ----


	//-- Start private functions ----


	/**
	* reset all device environment variables
	* @returns {undefined}
	*/
	_resetDeviceEnvironment() {
		this._webBluetooth = null;
		this._deviceObj = null;
		this._gattServer = null;
		this._services = new Map();// all services we've connected with
		this._characteristics = new Map();// all characteristics we've found
	};


	/**
	* get the services that were requested at connection time
	* @returns {undefined}
	*/
	_getRequestedServices() {
		
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
