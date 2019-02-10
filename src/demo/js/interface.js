(function() {

	'use strict';

	let webBluetooth;
	let isConnected = false;
	const filterServiceInput = document.getElementById('filter-service-uuid');
	const writeServiceInput = document.getElementById('write-service-uuid');
	const writeCharacteristicInput = document.getElementById('write-characteristic-uuid');
	const writeValueInput = document.getElementById('write-value');
	const connectionDetailsElm = document.getElementById(`connection-details`);
	const statusElm = document.getElementById(`connection-status`);
	const deviceNameElm = document.getElementById(`connection-device-name`);






	const FIRMWARE_COMPATIBILITY                = 4.17;

	const UUID_SERVICE_DEVICEINFORMATION        = "device_information";
	const UUID_CHARACTERISTIC_MODELNUMBER       = "model_number_string";
	const UUID_CHARACTERISTIC_FIRMWAREREVISION  = "firmware_revision_string";
	const UUID_CHARACTERISTIC_HARDWAREREVISION  = "hardware_revision_string";
	const UUID_CHARACTERISTIC_SOFTWAREREVISION  = "software_revision_string";
	const UUID_CHARACTERISTIC_MANUFACTURERNAME  = "manufacturer_name_string";

	const UUID_SERVICE_REMOTECONTROL            = "4dc591b0-857c-41de-b5f1-15abda665b0c";
	const UUID_CHARACTERISTIC_REMOTECONTROL     = "02b8cbcc-0e25-4bda-8790-a15f53e6010f";
	const UUID_CHARACTERISTIC_QUICKDRIVE        = "489a6ae0-c1ab-4c9c-bdb2-11d373c1b7fb";

	const UUID_SERVICE_OTA                      = "1d14d6ee-fd63-4fa1-bfa4-8f47b42119f0";
	const UUID_CHARACTERISTIC_OTACONTROL        = "f7bf3564-fb6d-4e53-88a4-5e37e0326063";

	 const SERVICES = {
		[UUID_SERVICE_DEVICEINFORMATION] : {
			name : "Device Information",
			characteristics : {
				[UUID_CHARACTERISTIC_MODELNUMBER] : {
					name : "Model Number String"
				},
				[UUID_CHARACTERISTIC_FIRMWAREREVISION] : {
					name : "Firmware Revision String"
				},
				[UUID_CHARACTERISTIC_HARDWAREREVISION] : {
					name : "Hardware Revision String"
				},
				[UUID_CHARACTERISTIC_SOFTWAREREVISION] : {
					name : "Software Revision String"
				},
				[UUID_CHARACTERISTIC_MANUFACTURERNAME] : {
					name : "Manufacturer Name String"
				}
			}
		},
		[UUID_SERVICE_REMOTECONTROL] : {
			name : "Remote Control",
			characteristics : {
				[UUID_CHARACTERISTIC_REMOTECONTROL] : {
					name : "Quick Drive"
				},
				[UUID_CHARACTERISTIC_QUICKDRIVE] : {
					name : "Remote Control"
				}
			}
		}
	};






	const presets = {
		magicBlue: {
			connection: {
				services: '0xffe5'
			},
			services: {
				service: '0xffe5',
				characteristic: '0xffe9',
				value: '56 00 ff 00 bb f0 aa'
			}
		},
		sBrick: {
			lights: {
				connection: {
					namePrefix: 'SBrick',
					optionalServices: '4dc591b0-857c-41de-b5f1-15abda665b0c'
				},
				services: {
					service: '4dc591b0-857c-41de-b5f1-15abda665b0c',// remote service
					characteristic: '02b8cbcc-0e25-4bda-8790-a15f53e6010f',
					value: '01 00 00 c0'
				}
			}
		},
		thingy: {
			temperature: {
				connection: {
					namePrefix: 'Thingy'
				},
				services: {
					service: 'ef680200-9b35-4933-9b10-52ffa9740042', // TES_UUID
					characteristic: 'ef680201-9b35-4933-9b10-52ffa9740042', // TES_TEMP_UUID
				}
			},
			firmware: {
				connection: {
					namePrefix: 'Thingy'
				},
				services: {
					service: '0000fe59-0000-1000-8000-00805f9b34fb', // TES_UUID
					characteristic: '8ec90001-f315-4f60-9fb8-838830daea50', // TES_TEMP_UUID
				}
			}
		}
	}
	// const preset = presets.magicBlue;
	const preset = presets.sBrick.lights;
	// const preset = presets.thingy.temperature;
	// const preset = presets.thingy.firmware;


	/**
	* init the connect btn
	* @returns {undefined}
	*/
	const initButtons = function() {
		document.getElementById('btn--connect').addEventListener('click', connectHandler);
		document.getElementById('btn--disconnect').addEventListener('click', disconnectHandler);
		
		Array.from(document.querySelectorAll(`[data-btn-write]`)).forEach((btn) => {
			btn.addEventListener('click', writeHandler);
		});
		
		Array.from(document.querySelectorAll(`[data-btn-read]`)).forEach((btn) => {
			btn.addEventListener('click', readHandler);
		});
	};


	/**
	* get integer value from string representing hex value
	* @returns {number}
	*/
	const valueFromHexString = function(hexString) {
		hexString = hexString || 0;
		if (hexString) {
			if (hexString.indexOf('0x') === -1) {
				hexString = `0x${hexString}`;
			}
		}
		return parseInt(hexString);
	};


	/**
	* get a UUID value from a string
	* I've encountered two types of UUIDs:
	* #1: 128-bit 4dc591b0-857c-41de-b5f1-15abda665b0c (i.e. 8-4-4-4-12 numbers)
	* For types, services and profiles specified by the SIG, these always end in -0000-1000-8000-00805f9b34fb
	* #2: 16-bit id's like 0xffe9
	* how these two relate: https://stackoverflow.com/questions/36212020/how-can-i-convert-a-bluetooth-16-bit-service-uuid-into-a-128-bit-uuid
	* return type #1 as string, type #2 as number.
	* todo: add possibility for strings like "heart_rate"
	* @returns {string | number}
	*/
	const getUuidFromString = function(str) {
		let uuid;
		if (str.match(/[0-9a-z]{8}-(?:[0-9a-z]{4}-){3}[0-9a-z]{12}/i)) {
			uuid = str.toLowerCase();
			if (uuid !== str) {
				console.warn(`you need to specify uuid in lowercase (we've converted it for you now)`);
			}
		} else {
			// todo check if this are only hex characters
			uuid = valueFromHexString(str);
		}
		// todo add possibility for string
		return uuid;
	};
	

	/**
	* handle click on connect button
	* @returns {undefined}
	*/
	const connectHandler = async function(e) {
		e.preventDefault();
		const options = getConnectionOptions();
		console.log('options:', options);
		isConnected = await webBluetooth.connect(options);
		webBluetooth.device.addEventListener('gattserverdisconnected', disconnectedHandler);

		setConnectionStatus();
	};


	/**
	* handle disconnecting device
	* @returns {undefined}
	*/
	const disconnectHandler = function(e) {
		e.preventDefault();
		webBluetooth.disconnect();
		isConnected = false;
		setConnectionStatus();
	};


	/**
	* handle device disconnected
	* @returns {undefined}
	*/
	const disconnectedHandler = function(e) {
		(e) => {
			console.log('doei');
			webBluetooth.device.removeEventListener('gattserverdisconnected', disconnectedHandler);
		}
	};
	
	
	/**
	* create an array from a string of UUIDs
	* @returns {undefined}
	*/
	const getUUIDArrayFromString = function(uuidStr) {
		uuidStr = uuidStr.replace(' ', '');// remove any spaces
		const uuidStrArr = uuidStr.split(',');
		const uuidArr = [];
		uuidStrArr.forEach((uuidStr) => {
			// convert each uuid str to a real uuid
			uuidArr.push(getUuidFromString(uuidStr));
		});

		return uuidArr;
	};


	/**
	* 
	* @returns {undefined}
	*/
	const getConnectionOptions = function() {
		const options = {};

		// add services
		const servicesStr = document.getElementById(`filter-services`).value;
		if (servicesStr) {
			options.filters = options.filters || [];
			// servicesStr = servicesStr.replace(' ', '');// remove any spaces
			// const servicesArr = servicesStr.split(',');
			
			// options.services = [];
			// servicesArr.forEach((service) => {
			// 	options.filters.services.push(getUuidFromString(service));
			// });
			options.filters.push({services: getUUIDArrayFromString(servicesStr)});
		}

		// add name
		const filterName = document.getElementById(`filter-name`).value;
		if (filterName) {
			options.filters = options.filters || [];
			options.filters.push( { name: filterName } );
		}

		// add namePrefix
		const filterNamePrefix = document.getElementById(`filter-name-prefix`).value;
		if (filterNamePrefix) {
			options.filters = options.filters || [];
			options.filters.push( { namePrefix: filterNamePrefix } );
		}
		
		// add optional services
		const optionalServicesStr = document.getElementById(`optional-services`).value;
		if (optionalServicesStr) {
			options.optionalServices = getUUIDArrayFromString(optionalServicesStr);
		}
		
		console.log(options);

		return options;
	};
	


	/**
	* set current connection status
	* @returns {undefined}
	*/
	const setConnectionStatus = function() {
		const clr = isConnected ? 'green' : 'red';
		console.log(`%cStatus: ${isConnected ? 'Connected' : 'Disconnected'}`, `color: ${clr}`);
		statusElm.textContent = isConnected ? 'Connected' : 'Not connected';

		let deviceNameText = '';
		if (isConnected) {
			connectionDetailsElm.classList.add('connection-details--is-connected');
			const deviceName = webBluetooth.name;
			if (deviceName) {
				deviceNameText = `with ${deviceName}`;
			} else {
				deviceNameText = '(no device name specified)';
			}
		} else {
			connectionDetailsElm.classList.remove('connection-details--is-connected');
		}
		deviceNameElm.textContent = deviceNameText;
	};


	/**
	* 
	* @returns {undefined}
	*/
	const readHandler = async function(e) {
		e.preventDefault();
		console.log('go read');

		// get service uuid
		const serviceUuid = getUuidFromString(writeServiceInput.value);

		// get characteristic uuid
		const characteristicUuid = getUuidFromString(writeCharacteristicInput.value);

		console.log('serviceUuid:', serviceUuid);
		console.log('characteristicUuid:', characteristicUuid);

		// now write value
		const value = webBluetooth.readValue(serviceUuid, characteristicUuid);

		console.log('readHandler value:', value);
	};
	


	/**
	* 
	* @returns {undefined}
	*/
	const writeHandler = async function(e) {
		e.preventDefault();
		// stuff needs to be passed to webBluetooth like this:
		//   const value = new Uint8Array([0x56, r, g, b, 0xbb, 0xf0, 0xaa]);
		//   webBluetooth.writeValue(serviceUuid, characteristicUuid, value);

		// get service uuid
		const serviceUuid = getUuidFromString(writeServiceInput.value);

		// get characteristic uuid
		const characteristicUuid = getUuidFromString(writeCharacteristicInput.value);
		
		// create Uint8Array from value
		const strArray = writeValueInput.value.split(' ');// array with strings like "ff", "01"
		const valuesFromHexArray = [];// will be filled with values like 255, 01
		strArray.forEach((str) => {
			valuesFromHexArray.push(valueFromHexString(str));
		});
		const writeValue = new Uint8Array(valuesFromHexArray);

		console.log('call webBluetooth.writeValue');

		// now write value
		webBluetooth.writeValue(serviceUuid, characteristicUuid, writeValue);
	};


	/**
	* fill a preset
	* @returns {undefined}
	*/
	const setPreset = function(selector, value) {
		const elm = document.querySelector(selector);
		elm.value = value ? value.toString() : '';
	};
	
	
	
	/**
	* initialize presets for a specific device
	* @returns {undefined}
	*/
	const initPresets = function() {
		if (preset) {
			// connection presets
			preset.connection = preset.connection || {};
			setPreset('#filter-services', preset.connection.services);
			setPreset('#filter-name', preset.connection.name);
			setPreset('#filter-name-prefix', preset.connection.namePrefix);
			setPreset('#optional-services', preset.connection.optionalServices);

			// services presets
			preset.services = preset.services || {};
			setPreset('#write-service-uuid', preset.services.service);
			setPreset('#write-characteristic-uuid', preset.services.characteristic);
			setPreset('#write-value', preset.services.value);
		}
	};
	




	/**
	* initialize all
	* @param {string} varname Description
	* @returns {undefined}
	*/
	const init = function() {
		webBluetooth = new WebBluetooth();
		initButtons();
		initPresets();
	};

	// kick of the script when all dom content has loaded
	document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();

})();
