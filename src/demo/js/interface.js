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

	const connectBtn = document.getElementById('btn--connect');
	const disconnectBtn = document.getElementById('btn--disconnect');

	const presets = window.devicePresets;
	let preset = null;
	
	// preset = presets.magicBlue;
	// preset = presets.sBrick;
	preset = presets.thingy;


	/**
	* init the connect btn
	* @returns {undefined}
	*/
	const initButtons = function() {
		// connection buttons are one-offs
		connectBtn.addEventListener('click', connectHandler);
		disconnectBtn.addEventListener('click', disconnectHandler);
		
		// buttons for operations may occur multiple times
		Array.from(document.querySelectorAll(`[data-btn-write]`)).forEach((btn) => {
			btn.addEventListener('click', writeHandler);
		});
		
		Array.from(document.querySelectorAll(`[data-btn-read]`)).forEach((btn) => {
			btn.addEventListener('click', readHandler);
		});
		
		Array.from(document.querySelectorAll(`[data-btn-notify]`)).forEach((btn) => {
			btn.addEventListener('click', startNotificationsHandler);
		});
	};


	/**
	* get integer value from string representing hex value
	* @returns {number}
	*/
	const getValueFromHexString = function(hexString) {
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
			uuid = getValueFromHexString(str);
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
		await webBluetooth.connect(options);
		const isConnected = webBluetooth.isConnected;
		if (isConnected) {
			setAllCharacteristicPermissions();
			webBluetooth.device.addEventListener('gattserverdisconnected', disconnectedHandler);
		}
		setConnectionStatus();
	};


	/**
	* handle disconnecting device
	* @returns {undefined}
	*/
	const disconnectHandler = function(e) {
		e.preventDefault();
		webBluetooth.disconnect();
		setConnectionStatus();
	};


	/**
	* handle device disconnected
	* @returns {undefined}
	*/
	const disconnectedHandler = function(e) {
		webBluetooth.device.removeEventListener('gattserverdisconnected', disconnectedHandler);
		setConnectionStatus();
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
		const isConnected = webBluetooth.isConnected;
		const color = isConnected ? 'green' : 'red';
		console.log(`%cStatus: ${isConnected ? 'Connected' : 'Disconnected'}`, `color: ${color}`);
		statusElm.textContent = isConnected ? 'Connected' : 'Not connected';

		let deviceNameText = '';
		if (isConnected) {
			connectionDetailsElm.classList.add('connection-details--is-connected');
			const deviceName = webBluetooth.name;
			if (deviceName) {
				statusElm.textContent += ' with';
				deviceNameText = deviceName;
			} else {
				deviceNameText = '(no device name specified)';
			}
		} else {
			connectionDetailsElm.classList.remove('connection-details--is-connected');
		}
		deviceNameElm.textContent = deviceNameText;

		setButtonState(connectBtn, !isConnected);
		setButtonState(disconnectBtn, isConnected);
	};


	/**
	* 
	* @returns {undefined}
	*/
	const readHandler = async function(e) {
		e.preventDefault();

		// determine which service and characteristic we're dealing with
		const btn = e.currentTarget;
		const inputValues = getInputValuesForButtonRow(btn);
		const valueInput = btn.closest('[data-characteristic]').querySelector('[data-value-input');

		// get service uuid
		const serviceUuid = getUuidFromString(inputValues.serviceUuidStr);

		// get characteristic uuid
		const characteristicUuid = getUuidFromString(inputValues.characteristicUuidStr);

		// now write value
		const dataView = await webBluetooth.readValue(serviceUuid, characteristicUuid);

		const uint8Array = new Uint8Array(dataView.buffer);
		const text = webBluetooth.util.dataViewToText(dataView);
		valueInput.value = `${text} [ ${uint8Array.join(' ')} ]`;
		
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
			valuesFromHexArray.push(getValueFromHexString(str));
		});
		const writeValue = new Uint8Array(valuesFromHexArray);

		// now write value
		webBluetooth.writeValue(serviceUuid, characteristicUuid, writeValue);
	};


	/**
	* handle click on stop notify
	* @returns {undefined}
	*/
	const stopNotificationsHandler = function(e) {
		e.preventDefault();
		
		// determine which service and characteristic we're dealing with
		const btn = e.currentTarget;
		btn.addEventListener('click', startNotificationsHandler);
		btn.removeEventListener('click', stopNotificationsHandler);
	};
	


	/**
	* handle click on notify button
	* @returns {undefined}
	*/
	const startNotificationsHandler = async function(e) {
		e.preventDefault();
		
		// determine which service and characteristic we're dealing with
		const btn = e.currentTarget;
		btn.removeEventListener('click', startNotificationsHandler);
		btn.addEventListener('click', stopNotificationsHandler);
		const inputValues = getInputValuesForButtonRow(btn);
		const valueInput = btn.closest('[data-characteristic]').querySelector('[data-value-input');

		// get service uuid
		const serviceUuid = getUuidFromString(inputValues.serviceUuidStr);

		// get characteristic uuid
		const characteristicUuid = getUuidFromString(inputValues.characteristicUuidStr);

		// now write value
		const characteristic = await webBluetooth.getCharacteristic(characteristicUuid, serviceUuid);
		characteristic.addEventListener('characteristicvaluechanged', notificationHandler);
		characteristic.startNotifications();
	};


	/**
	* handle a notification
	* @returns {undefined}
	*/
	const notificationHandler = function(e) {
		const char = e.target;
		const dataView = char.value;
		let valueInput;
		document.querySelectorAll('[data-characteristic-input]').forEach(input => {
			if (input.value === char.uuid) {
				const charRow = input.closest('[data-characteristic]');
				valueInput = charRow.querySelector('[data-value-input');
			}
		});

		if (valueInput) {
			const uint8Array = new Uint8Array(dataView.buffer);
			const text = webBluetooth.util.dataViewToText(dataView);
			valueInput.value = `${text} [ ${uint8Array.join(' ')} ]`;
		}
	};
	
	



	//-- Start helper functions for form


	/**
	* get appropriate values when clicking on button
	* @returns {undefined}
	*/
	const getInputValuesForButtonRow = function(btn) {

		const charRow = btn.closest('[data-characteristic]');
		const characteristicUuidStr = charRow.querySelector('[data-characteristic-input]').value;
		const characteristicValueStr = charRow.querySelector('[data-value-input]').value;

		const serviceRow = charRow.closest('[data-service-row]');
		const serviceUuidStr = serviceRow.querySelector('[data-service-input]').value;

		return {
			characteristicUuidStr,
			characteristicValueStr,
			serviceUuidStr
		};
	};



	/**
	* enable the right buttons for all characteristics' permissions
	* @returns {undefined}
	*/
	const setAllCharacteristicPermissions = function() {
		const serviceRows = Array.from(document.querySelectorAll(`[data-service-row]`));
		serviceRows.forEach((serviceRow) => {
			const serviceUUIDString = serviceRow.querySelector([`[data-service-input]`]).value;
			if (serviceUUIDString) {
				const characteristicRows = Array.from(serviceRow.querySelectorAll(`[data-characteristic]`));
				characteristicRows.forEach((charRow) => {
					const charUUIDString = charRow.querySelector(`[data-characteristic-input]`).value;
					if (charUUIDString) {
						setCharacteristicPermissions(charUUIDString, charRow, serviceUUIDString);
					}
				})
			}
		});
	};


	/**
	* enable the right buttons for a single characteristic's permissions
	* @returns {undefined}
	*/
	const setCharacteristicPermissions = function(charUUIDString, charRow, serviceUUIDString) {
		const serviceUUID = getUuidFromString(serviceUUIDString);
		const charUUID = getUuidFromString(charUUIDString);

		webBluetooth.getCharacteristic(charUUID, serviceUUID)
			.then((characteristic) => {
				setButtonState(charRow.querySelector(`[data-btn-write]`), characteristic.properties.write);
				setButtonState(charRow.querySelector(`[data-btn-read]`), characteristic.properties.read);
				setButtonState(charRow.querySelector(`[data-btn-notify]`), characteristic.properties.notify);
				if (!characteristic.properties.write) {
					charRow.querySelector(`[data-value-input]`).setAttribute('readonly', 'readonly');
				}
			});
	};


	/**
	* enable or disable a button
	* @returns {undefined}
	*/
	const setButtonState  = function(btn, status) {
		if (status) {
			btn.removeAttribute('disabled');
		} else {
			btn.setAttribute('disabled', 'disabled');
		}
	};
	
	
	
	


	/**
	* create a form row for a characteristic
	* @returns {undefined}
	*/
	const createCharacteristicFormRow = function(firstCharRow, characteristicObj, serviceUUID, iChar, iServ) {
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
		charInput.value = characteristicObj.uuid;
		charRow.querySelector('[data-characteristic-description]').innerHTML = characteristicObj.description || '';

		charRow.querySelector('[data-value-label]').setAttribute('for', valueInputId);
		valueInput.id = valueInputId;
		valueInput.value = characteristicObj.exampleValue || '';
		charRow.querySelector('[data-value-explanation]').innerHTML = characteristicObj.valueExplanation || '';

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
			const charRow = createCharacteristicFormRow(firstCharRow, characteristic, service.uuid, iChar, iServ);
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
