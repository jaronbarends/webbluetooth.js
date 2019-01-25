const WebBluetooth = (function() {

	'use strict';

	class WebBluetooth {
		constructor() {
			this._device = null;
			this._gattServer = null;
			this._service = null;
			this._characteristics = new Map();
		}

		
		/**
		* connect with a peripheral device
		* @param {number} serviceUuid - The uuid of the device's service we want to target
		* @returns {boolean}
		*/
		async connect(serviceUuid=null) {
			let options = {
				acceptAllDevices: true
			}
			if (serviceUuid) {
				options = {
					filters: [{
						services: [serviceUuid]
					}]
				}
			}

			try {
				this._device = await navigator.bluetooth.requestDevice(options);
				this._gattServer = await this._device.gatt.connect();
				this._service = await this._gattServer.getPrimaryService(serviceUuid);
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
				this._service = null;
				this._characteristics = new Map();
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
		* write a value to a characteristic
		* @param {string} characteristicUuid - The UUID of the characteristic to write to
		* @param {number} vale - The value to write
		* @returns {undefined}
		*/
		async writeValue(characteristicUuid, value) {
			try {
				const characteristic = await this._getCharacteristic(characteristicUuid);
				return characteristic.writeValue(value);
			} catch(error) {
				console.warn(`Couldn't write value: `, error);
			}
		};


		//-- Start private functions ------------------


		/**
		* get a characteristic from the device
		* @returns {undefined}
		*/
		async _getCharacteristic(characteristicUuid) {
			if (!this.isConnected()) {
				throw new Error('Device not connected');
			}

			// check if we've already got this characteristic
			let characteristic = this._characteristics.get(characteristicUuid);
			if (typeof characteristic === 'undefined') {
				// this characteristic hasn't been requested yet
				characteristic = await this._service.getCharacteristic(characteristicUuid);
				// cache for later use
				this._characteristics.set(characteristicUuid, characteristic);
			}
			return characteristic;
		};


	}

	return WebBluetooth;

})();