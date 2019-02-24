/*
* A wrapper around the Web bluetooth API
*/

import util from './util/util.js';
import WebBluetoothDevice from './WebBluetoothDevice.js';

export default class WebBluetooth {
	constructor() {
		this._debug = true;
		this._util = util;
		this._devices = new Map();
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
		if (!options.filters) {
			options.acceptAllDevices = true;
		}

		try {
			const deviceObj = await navigator.bluetooth.requestDevice(options);
			const gattServer = await deviceObj.gatt.connect();

			// create a technically less correct, but better understandable device object
			const device = new WebBluetoothDevice(gattServer, options, this);
			this._addDevice(device);
			return device;
		} catch(error) {
			this._error(`Something went wrong while connecting`, error);
			return false;
		}
	}


	/**
	* disconnect a device
	* @returns {undefined}
	*/
	disconnect(device) {
		if (device.isConnected) {
			device.gatt.disconnect();
		} else {
			console.warn(`Device was not connected`)
		}
	};


	/**
	* disconnect all devices
	* @returns {undefined}
	*/
	disconnectAll() {
		this._devices.forEach((device) => {
			this.disconnect(device);
		});
	};


	/**
	* add a device to the _devices map
	* @returns {undefined}
	*/
	_addDevice(device) {
		const deviceId = device.id;
		this._devices.set(deviceId, device);
		device.addEventListener('gattserverdisconnected', () => {
			this._devices.delete(deviceId);
		});
	};


	
	//-- Start getters

	get util() {
		return this._util;
	}



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
