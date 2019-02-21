
import WebBluetooth from '../../webbluetooth.js';
import devicePresets from './device-presets/devices.js';
import interfaceUtil from './interface-util.js';

let webBluetooth;
const connectionDetailsElm = document.getElementById(`connection-details`);
const statusElm = document.getElementById(`connection-status`);
const deviceNameElm = document.getElementById(`connection-device-name`);

const connectBtn = document.getElementById('btn--connect');
const disconnectBtn = document.getElementById('btn--disconnect');

let currPreset = null;
let currPresetIdx = 0;
currPreset = devicePresets[currPresetIdx];


/**
* init the connect btn
* @returns {undefined}
*/
const initConnectButtons = function() {
	// connection buttons are one-offs
	connectBtn.addEventListener('click', connectHandler);
	disconnectBtn.addEventListener('click', disconnectHandler);
};


/**
* initialize buttons for characteristic actions
* @returns {undefined}
*/
const initCharacteristicButtons = function() {
	
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
* 
* @returns {undefined}
*/
const disableAllCharacteristicButtons = function() {
	const allButtons = document.querySelectorAll('[data-characteristic-row] .btn');
	allButtons.forEach(button => button.setAttribute('disabled', 'disabled'));
};




/**
* get a 0-prefixed hex string from a number value
* @returns {string}
*/
const getHexStringFromValue = function(num) {
	let str = num.toString(16);
	if (str.length === 1) {
		str = `0${str}`;
	}
	return str;
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
const getUUIDFromString = function(str) {
	let uuid = str;
	if (str.match(/[0-9a-z]{8}-(?:[0-9a-z]{4}-){3}[0-9a-z]{12}/i)) {
		// 128-bit: 123456ab-123a-123b-123c-1234567890ab
		uuid = str.toLowerCase();
		if (uuid !== str) {
			console.warn(`you need to specify uuid in lowercase (we've converted it for you now)`);
		}
	} else if (str.match(/^(0x)?([0-9a-f]{4}){1,2}$/i)) {
		// 16-bit or 32-bit: one of 0x12ab, 12ab, 0x12ab34cd, 12ab34cd
		uuid = parseInt(str, 16);
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
	disableAllCharacteristicButtons();
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
	uuidStr = uuidStr.replace(/\s/g, '');// remove any white space
	const uuidStrArr = uuidStr.split(',');
	const uuidArr = [];
	uuidStrArr.forEach((uuidStr) => {
		// convert each uuid str to a real uuid
		uuidArr.push(getUUIDFromString(uuidStr));
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
	const btnAssociations = interfaceUtil.getBtnAssociations(btn);
	const valueInput = btnAssociations.valueInput;
	const serviceUUID = getUUIDFromString(btnAssociations.serviceUUIDStr);
	const charUUID = getUUIDFromString(btnAssociations.charUUIDStr);

	// now read value
	const dataView = await webBluetooth.readValue(serviceUUID, charUUID);
	const text = webBluetooth.util.dataViewToString(dataView);
	let uint8Array = webBluetooth.util.dataViewToUint8Array(dataView);

	if (btnAssociations.valueType === 'hex') {
		// then convert each value to hex
		uint8Array = Array.from(uint8Array);
		uint8Array = uint8Array.map(num => getHexStringFromValue(num));
	}
	
	valueInput.value = `${text} [ ${uint8Array.join(' ')} ]`;
};



/**
* handle click on write button
* @returns {undefined}
*/
const writeHandler = async function(e) {
	e.preventDefault();

	// determine which service and characteristic we're dealing with
	const btn = e.currentTarget;
	const btnAssociations = interfaceUtil.getBtnAssociations(btn);
	const serviceUUID = getUUIDFromString(btnAssociations.serviceUUIDStr);
	const charUUID = getUUIDFromString(btnAssociations.charUUIDStr);

	// prepare data to write
	// stuff needs to be passed to webBluetooth as a Uint8Array:
	// create Uint8Array from value
	const strArray = btnAssociations.valueStr.split(' ');// array with strings of decimal or hex values
	let valuesArray = [];// will be filled with values like 255, 01
	strArray.forEach((str) => {
		valuesArray.push(str);
	});
	const radix = (btnAssociations.valueType === 'hex') ? 16 : 10;
	valuesArray = valuesArray.map(str => parseInt(str, radix));
	const writeValue = new Uint8Array(valuesArray);

	// now write value
	webBluetooth.writeValue(serviceUUID, charUUID, writeValue);
};


/**
* start or stop notifications
* @returns {undefined}
*/
const startOrStopNotifications = async function(btn, start) {
	const btnAssociations = interfaceUtil.getBtnAssociations(btn);
	const serviceUUID = getUUIDFromString(btnAssociations.serviceUUIDStr);
	const charUUID = getUUIDFromString(btnAssociations.charUUIDStr);

	const characteristic = await webBluetooth.getCharacteristic(serviceUUID, charUUID);
	if (start) {
		characteristic.addEventListener('characteristicvaluechanged', notificationHandler);
		characteristic.startNotifications();
	} else {
		characteristic.removeEventListener('characteristicvaluechanged', notificationHandler);
		characteristic.stopNotifications();
	}
};


/**
* handle click on stop notify
* @returns {undefined}
*/
const stopNotificationsHandler = function(e) {
	e.preventDefault();
	const btn = e.currentTarget;
	btn.addEventListener('click', startNotificationsHandler);
	btn.removeEventListener('click', stopNotificationsHandler);
	startOrStopNotifications(btn, false);
};


/**
* handle click on notify button
* @returns {undefined}
*/
const startNotificationsHandler = function(e) {
	e.preventDefault();
	const btn = e.currentTarget;
	btn.removeEventListener('click', startNotificationsHandler);
	btn.addEventListener('click', stopNotificationsHandler);
	startOrStopNotifications(btn, true);
};


/**
* handle a notification
* @returns {undefined}
*/
const notificationHandler = function(e) {
	const char = e.target;
	const dataView = char.value;
	const valueInput = interfaceUtil.getValueInputByCharUUID(char.uuid);

	if (valueInput) {
		const uint8Array = new Uint8Array(dataView.buffer);
		const text = webBluetooth.util.dataViewToString(dataView);
		valueInput.value = `${text} [ ${uint8Array.join(' ')} ]`;
	}
};





//-- Start helper functions for form


/**
* enable the right buttons for all characteristics' permissions
* @returns {undefined}
*/
const setAllCharacteristicPermissions = function() {
	const serviceRows = Array.from(document.querySelectorAll(`[data-service-row]`));
	serviceRows.forEach((serviceRow) => {

		const serviceUUIDString = serviceRow.querySelector([`[data-service-input]`]).value;
		if (serviceUUIDString) {
			const characteristicRows = Array.from(serviceRow.querySelectorAll(`[data-characteristic-row]`));
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
	const serviceUUID = getUUIDFromString(serviceUUIDString);
	const charUUID = getUUIDFromString(charUUIDString);

	webBluetooth.getCharacteristic(serviceUUID, charUUID)
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




/*---------------------------------------------------------------------------------
* Start form setup
*---------------------------------------------------------------------------------*/



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

	const rowId = `${iServ}-${iChar}`;
	const charInputId = `target-characteristic-${rowId}-uuid`;
	const valueInputId = `target-characteristic-${rowId}-value`;
	const radixHexId = `value-radix-hex-${rowId}`;
	const radixDecId = `value-radix-dec-${rowId}`;
	const charInput = charRow.querySelector('[data-characteristic-input]');
	const valueInput = charRow.querySelector('[data-value-input]');
	const radixHexInput = charRow.querySelector('[data-radix-input-hex]');
	const radixDecInput = charRow.querySelector('[data-radix-input-dec]');

	charRow.setAttribute('data-characteristic-row-id', rowId);
	
	charRow.querySelector('[data-characteristic-label]').setAttribute('for', charInputId);
	charInput.id = charInputId;
	charInput.value = characteristicObj.uuid;
	charRow.querySelector('[data-characteristic-description]').innerHTML = characteristicObj.description || '';

	charRow.querySelector('[data-value-label]').setAttribute('for', valueInputId);
	valueInput.id = valueInputId;
	valueInput.value = characteristicObj.exampleValue || '';
	charRow.querySelector('[data-value-explanation]').innerHTML = characteristicObj.valueExplanation || '';

	radixHexInput.id = radixHexId
	radixHexInput.setAttribute('name', `value-radix-${rowId}`);
	charRow.querySelector('[data-radix-label-hex]').setAttribute('for', radixHexId);
	radixDecInput.id = radixDecId
	radixDecInput.setAttribute('name', `value-radix-${rowId}`);
	charRow.querySelector('[data-radix-label-dec]').setAttribute('for', radixDecId);
	if (characteristicObj.exampleValueIsDecimal) {
		radixDecInput.checked = true;
	} else {
		radixHexInput.checked = true;
	}

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

	if (service.characteristics) {
		service.characteristics.forEach((characteristic, iChar) => {
			const charRow = createCharacteristicFormRow(firstCharRow, characteristic, service.uuid, iChar, iServ);
			characteristicsList.appendChild(charRow);
		});
	}
	
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
* get the service UUIDs of services or optional services
* @returns {Array} Array of UUIDs
*/
const getPresetServiceUUIDs = function(serviceObjs) {
	return serviceObjs.map(obj => obj.uuid);
};


/**
* change the device preset
* @returns {undefined}
*/
const changePreset = function(e) {
	if (e) {
		currPresetIdx = e.target.value;
		currPreset = devicePresets[currPresetIdx];
	}
	setDevicePresets();
	initCharacteristicButtons();
};




/**
* initialize presets for a specific device
* @returns {undefined}
*/
const initPresets = function() {
	const presetSelect = document.getElementById(`device-presets`);
	devicePresets.forEach((preset, i) => {
		const option = document.createElement('option');
		option.value = i;
		option.textContent = preset.presetTitle || ((i === 0) ? '- none -' : '');
		if (i == currPresetIdx) {
			option.selected = true;
		}
		presetSelect.appendChild(option);
	});
	presetSelect.addEventListener('change', changePreset);
	changePreset();
};




/**
* initialize presets for a specific device
* @returns {undefined}
*/
const setDevicePresets = function() {
		// connection presets
		let services = currPreset.services || [];
		let optionalServices = currPreset.optionalServices || [];
		if (!Array.isArray(services)) { services = [services] };
		if (!Array.isArray(optionalServices)) { optionalServices = [optionalServices] };

		setPresetInput('#filter-services', getPresetServiceUUIDs(services));
		setPresetInput('#filter-name', currPreset.name);
		setPresetInput('#filter-name-prefix', currPreset.namePrefix);
		setPresetInput('#optional-services', getPresetServiceUUIDs(optionalServices));

		// operations presets
		// loop through services and create fields for characteristic and value
		const serviceList = document.getElementById(`target-services-list`);
		while (serviceList.hasChildNodes()) {
			serviceList.removeChild(serviceList.lastChild);
			}// empty the list
		const firstRow = document.getElementById(`services-list-clone-src`).querySelector('[data-service-row]').cloneNode(true);
		serviceList.appendChild(firstRow);

		const allServices = services.concat(optionalServices);
		allServices.forEach((service, i) => {
			const serviceRow = createServiceFormRow(firstRow, service, i);
			serviceList.appendChild(serviceRow);
		});
};



/*---------------------------------------------------------------------------------
* End form setup
*---------------------------------------------------------------------------------*/







/**
* initialize all
* @param {string} varname Description
* @returns {undefined}
*/
const init = function() {
	webBluetooth = new WebBluetooth();
	initConnectButtons();
	initPresets();
	document.querySelectorAll(`input, textarea`).forEach(field => {
		field.addEventListener('focus', e => e.target.select());
	});
};

// kick of the script when all dom content has loaded
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
