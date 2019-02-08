// import {MagicBlue} from '../../src/magicblue.js';
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


	/**
	* init the connect btn
	* @returns {undefined}
	*/
	const initButtons = function() {
		document.getElementById('btn--connect').addEventListener('click', connectHandler);
		document.getElementById('btn--disconnect').addEventListener('click', (e) => {
			e.preventDefault();
			webBluetooth.disconnect();
			isConnected = false;
			setConnectionStatus();
		});
		Array.from(document.querySelectorAll(`[data-btn-write]`)).forEach((btn) => {
			btn.addEventListener('click', writeHandler);
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
		// const serviceUuid = getUuidFromString(filterServiceInput.value);
		isConnected = await webBluetooth.connect(options);
		setConnectionStatus();
	};


	/**
	* 
	* @returns {undefined}
	*/
	const getConnectionOptions = function() {
		const options = {};

		// add services
		let servicesArr;
		let servicesStr = document.getElementById(`filter-services`).value;
		console.log(servicesStr);
		if (servicesStr) {
			servicesStr = servicesStr.replace(' ', '');// remove any spaces
			servicesArr = servicesStr.split(',');
			
			if (servicesArr.length === 1) {
				options.services = getUuidFromString(servicesArr[0]);// we could also make array of just one, but this way we can test passing in a single value as well :)
			} else {
				options.services = [];
				servicesArr.forEach((service) => {
					options.services.push(getUuidFromString(service));
				});
			}
		}

		// add name
		const filterName = document.getElementById(`filter-name`).value;
		if (filterName) {
			options.name = filterName;
		}

		// add namePrefix
		const filterNamePrefix = document.getElementById(`filter-name-prefix`).value;
		if (filterNamePrefix) {
			options.namePrefix = filterNamePrefix;
		}
		console.log(options);

		return options;
	};
	


	/**
	* set current connection status
	* @returns {undefined}
	*/
	const setConnectionStatus = function() {
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
	const writeHandler = async function(e) {
		e.preventDefault();
		// stuff needs to be passed to webBluetooth like this:
		//   const value = new Uint8Array([0x56, r, g, b, 0xbb, 0xf0, 0xaa]);
		//   webBluetooth.writeValue(serviceUuid, characteristicUuid, value);
		console.log('go write');

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

		// now write value
		webBluetooth.writeValue(serviceUuid, characteristicUuid, writeValue);
	};
	




	/**
	* initialize all
	* @param {string} varname Description
	* @returns {undefined}
	*/
	const init = function() {
		webBluetooth = new WebBluetooth();
		initButtons();
	};

	// kick of the script when all dom content has loaded
	document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();

})();
