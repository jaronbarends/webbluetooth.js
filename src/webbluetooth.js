const WebBluetooth = (function() {

	'use strict';

	class WebBluetooth {
		constructor() {
			this._resetAll();
		}

		
		/**
		* connect with a peripheral device
		* @param {object} options - Optional connection options. Possible properties: services (UUID or array of UUID's), name (string), namePrefix (string), optionalServices (UUID or array of UUID's)
		* @returns {boolean}
		*/
		async connect(options) {
			// console.log('options passed in:', options);
			options = this._createOptionsObject(options);
			// console.log('options to pass on:', options);

			this._resetAll();
			try {
				this._device = await navigator.bluetooth.requestDevice(options);
				this._gattServer = await this._device.gatt.connect();
				if (options.filter && options.filter.services) {
					// let's proactively get these services
					// await this._getService(serviceUuid);
				}
				return true;
			} catch(error) {
				console.warn(`Something went wrong while connecting:`, error);
				return false;
			}
		}


		/**
		* disconnect the device
		* @returns {undefined}
		*/
		disconnect() {
			if (this.isConnected()) {
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
		isConnected() {
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
				const characteristic = await this._getCharacteristic(characteristicUuid, serviceUuid);
				return await characteristic.writeValue(value)
			} catch(error) {
				console.warn(`Couldn't write value: `, error);
			}
		};


		/**
		* 
		* @returns {undefined}
		*/
		async readValue(serviceUuid, characteristicUuid) {
			console.log('start readValue');
			try {
				const characteristic = await this._getCharacteristic(characteristicUuid, serviceUuid);
				return await characteristic.readValue()
					.then((value) => {
						console.log('val:', value);
						return value;
					});
			} catch(error) {
				console.warn(`Couldn't read value: `, error);
			}
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
		* get a characteristic from the device
		* @returns {service}
		*/
		async _getService(serviceUuid) {
			if (!this.isConnected()) {
				throw new Error('Device not connected');
			}

			// check if we've already got this service
			let service = this._services.get(serviceUuid);
			if (typeof service === 'undefined') {
				// this service hasn't been requested yet
				console.log('go get service', serviceUuid,);
				service = await this._gattServer.getPrimaryService(serviceUuid);
				console.log('found service');
				// cache for later use
				this._services.set(serviceUuid, service);
			}
			return service;
		};


		/**
		* get a characteristic from the device
		* @returns {characteristic}
		*/
		async _getCharacteristic(characteristicUuid, serviceUuid) {
			if (!this.isConnected()) {
				throw new Error('Device not connected');
			}

			// check if we've already got this characteristic
			let characteristic = this._characteristics.get(characteristicUuid);
			if (typeof characteristic === 'undefined') {
				// this characteristic hasn't been requested yet
				try {
					const service = await this._getService(serviceUuid);
					console.log('found service');
					characteristic = await service.getCharacteristic(characteristicUuid);
					// cache for later use
					this._characteristics.set(characteristicUuid, characteristic);
				} catch(error) {
					console.warn('Error getting characteristic:', error);
				}
			}
			return characteristic;
		};


		//-- helper functions

		/**
		* create an options object to pass to requestDevice
		* @param {object} params - Optional connection options. Possible properties: services (UUID or array of UUID's), name (string), namePrefix (string), optionalServices (UUID or array of UUID's)
		* @returns {object} - object containing either filters or acceptAllDevices=true
		*/
		_createOptionsObject(params) {
			const options = {};
			if (params) {
				if (params.services) {
					options.filters = [
						{ services: this._getArray(params.services) }
					];
				}
				if (params.name) {
					options.filters = options.filters || [];
					options.filters.push({
						name: params.name
					});
				}
				if (params.namePrefix) {
					options.filters = options.filters || [];
					options.filters.push({
						namePrefix: params.namePrefix
					});
				}
			}
			if (!options.filters) {
				// no valid params were passed in
				options.acceptAllDevices = true;
			}

			return options;
		};


		/**
		* check if an object is an array or a single value. If single value, turn into array
		* @param {any} value - An array or single value
		* @returns {Array}
		*/
		_getArray(value) {
			if (!Array.isArray(value)) {
				value = [value];
			}
			return value;
		};


	}

	return WebBluetooth;

})();