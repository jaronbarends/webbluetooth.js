(function() {

	'use strict';

	let webBluetooth;
	let isConnected = false;
	const filterServiceInput = document.getElementById('filter-service-uuid');
	const targetServiceInput = document.getElementById('target-service-uuid');
	const targetCharacteristicInput = document.getElementById('target-characteristic-uuid');
	const targetValueInput = document.getElementById('target-value');
	const connectionDetailsElm = document.getElementById(`connection-details`);
	const statusElm = document.getElementById(`connection-status`);
	const deviceNameElm = document.getElementById(`connection-device-name`);


	const presets = window.devicePresets;
	
	// const preset = presets.magicBlue;
	const preset = presets.sBrick;
	// const preset = presets.thingy;


	/**
	* init the connect btn
	* @returns {undefined}
	*/
	const initButtons = function() {
		// connection buttons are one-offs
		document.getElementById('btn--connect').addEventListener('click', connectHandler);
		document.getElementById('btn--disconnect').addEventListener('click', disconnectHandler);
		
		// buttons for operations may occur multiple times
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
		let uuid = str;
		if (str.match(/[0-9a-z]{8}-(?:[0-9a-z]{4}-){3}[0-9a-z]{12}/i)) {
			// 128-bit: 123456ab-123a-123b-123c-1234567890ab
			uuid = str.toLowerCase();
			if (uuid !== str) {
				console.warn(`you need to specify uuid in lowercase (we've converted it for you now)`);
			}
		} else if (str.match(/^(0x)?([0-9a-f]{4}){1,2}$/i)) {
			// 16-bit or 32-bit: one of 0x12ab, 12ab, 0x12ab34cd, 12ab34cd
			uuid = valueFromHexString(str);
		} else {
			// it's a normal string, like 'heart_rate' - leave it as is.
		}
		
		return uuid;
	};
	

	/**
	* handle click on connect button
	* @returns {undefined}
	*/
	const connectHandler = async function(e) {
		e.preventDefault();
		const options = getConnectionOptions();
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
		console.log('doei');
		webBluetooth.device.removeEventListener('gattserverdisconnected', disconnectedHandler);
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

		// determine which service and characteristic we're dealing with
		const btn = e.currentTarget;
		const inputValues = getInputValuesForButtonRow(btn)

		// get service uuid
		const serviceUuid = getUuidFromString(inputValues.serviceUuidStr);

		// get characteristic uuid
		const characteristicUuid = getUuidFromString(inputValues.characteristicUuidStr);

		// now write value
		const value = await webBluetooth.readValue(serviceUuid, characteristicUuid);

		console.log('readHandler value:', value);
	};
	


	/**
	* handle click on write button
	* @returns {undefined}
	*/
	const writeHandler = async function(e) {
		e.preventDefault();
		// stuff needs to be passed to webBluetooth like this:
		//   const value = new Uint8Array([0x56, r, g, b, 0xbb, 0xf0, 0xaa]);
		//   webBluetooth.writeValue(serviceUuid, characteristicUuid, value);

		// determine which service and characteristic we're dealing with
		const btn = e.currentTarget;
		const inputValues = getInputValuesForButtonRow(btn)

		// get service uuid
		const serviceUuid = getUuidFromString(inputValues.serviceUuidStr);

		// get characteristic uuid
		const characteristicUuid = getUuidFromString(inputValues.characteristicUuidStr);
		
		// create Uint8Array from value
		const strArray = inputValues.characteristicValueStr.split(' ');// array with strings like "ff", "01"
		const valuesFromHexArray = [];// will be filled with values like 255, 01
		strArray.forEach((str) => {
			valuesFromHexArray.push(valueFromHexString(str));
		});
		const writeValue = new Uint8Array(valuesFromHexArray);

		// now write value
		webBluetooth.writeValue(serviceUuid, characteristicUuid, writeValue);
	};



	//-- Start helper functions for form


	/**
	* get appropriate values when clicking on button
	* @returns {undefined}
	*/
	const getInputValuesForButtonRow = function(btn) {

		const charList = btn.closest('[data-characteristic]');
		const characteristicUuidStr = charList.querySelector('[data-characteristic-input]').value;
		const characteristicValueStr = charList.querySelector('[data-value-input]').value;

		const serviceRow = charList.closest('[data-service-row]');
		const serviceUuidStr = serviceRow.querySelector('[data-service-input]').value;

		return {
			characteristicUuidStr,
			characteristicValueStr,
			serviceUuidStr
		};
	};
	


	/**
	* create a form row for a characteristic
	* @returns {undefined}
	*/
	const createCharacteristicFormRow = function(firstCharRow, characteristic, iChar, iServ) {
		let charRow;
		if (iChar === 0) {
			charRow = firstCharRow;
		} else {
			charRow = firstCharRow.cloneNode(true);
		}

		const charInputId = `target-characteristic-${iServ}-${iChar}-uuid`;
		const valueInputId = `target-characteristic-${iServ}-${iChar}-value`;
		const charInput = charRow.querySelector('[data-characteristic-input]');
		const valueInput = charRow.querySelector('[data-value-input]');
		
		charRow.querySelector('[data-characteristic-label]').setAttribute('for', charInputId);
		charInput.id = charInputId;
		charInput.value = characteristic.uuid;
		charRow.querySelector('[data-characteristic-description]').innerHTML = characteristic.description || '';

		charRow.querySelector('[data-value-label]').setAttribute('for', valueInputId);
		valueInput.id = valueInputId;
		valueInput.value = characteristic.exampleValue || '';
		charRow.querySelector('[data-value-explanation]').innerHTML = characteristic.valueExplanation || '';

		return charRow;
	};
	


	/**
	* create a form row for a service
	* @returns {undefined}
	*/
	const createServiceFormRow = function(firstRow, service, iServ) {
		let serviceRow;
		if (iServ === 0) {
			serviceRow = firstRow;
		} else {
			serviceRow = firstRow.cloneNode(true);
		}
		
		const inputId = `target-service-${iServ}-uuid`;
		serviceRow.querySelector('[data-service-label]').setAttribute('for', inputId);
		const serviceInput = serviceRow.querySelector('[data-service-input]');
		serviceInput.id = inputId;
		serviceInput.value = service.uuid;
		serviceRow.querySelector('[data-service-description]').innerHTML = service.description || '';

		// now loop through characteristics
		const characteristicsList = serviceRow.querySelector('[data-characteristics-list]')
		const firstCharRow = characteristicsList.querySelector('li');

		service.characteristics.forEach((characteristic, iChar) => {
			const charRow = createCharacteristicFormRow(firstCharRow, characteristic, iChar, iServ);
			characteristicsList.appendChild(charRow);
		});
		
		return serviceRow;
	};
	


	/**
	* fill a preset input field
	* @returns {undefined}
	*/
	const setPresetInput = function(selector, value) {
		const elm = document.querySelector(selector);
		if (Array.isArray(value)) {
			value = value.join(', ');
		}
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
			setPresetInput('#filter-services', preset.connection.services);
			setPresetInput('#filter-name', preset.connection.name);
			setPresetInput('#filter-name-prefix', preset.connection.namePrefix);
			setPresetInput('#optional-services', preset.connection.optionalServices);

			// operations presets
			// loop through services and create fields for characteristic and value
			if (preset.operations) {
				const serviceList = document.getElementById(`target-services-list`);
				const firstRow = serviceList.querySelector('li');

				preset.operations.services.forEach((service, i) => {
					const serviceRow = createServiceFormRow(firstRow, service, i);
					serviceList.appendChild(serviceRow);
				});
			}
			
		}
	};
	









	/**
	* initialize all
	* @param {string} varname Description
	* @returns {undefined}
	*/
	const init = function() {
		webBluetooth = new WebBluetooth();
		initPresets();
		initButtons();
	};

	// kick of the script when all dom content has loaded
	document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();

})();
