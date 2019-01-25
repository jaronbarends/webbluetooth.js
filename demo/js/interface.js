// import {MagicBlue} from '../../src/magicblue.js';
(function() {

	'use strict';

	let webBluetooth;
	let isConnected = false;
	const filterServiceInput = document.getElementById('filter-service-uuid');
	const writeServiceInput = document.getElementById('write-service-uuid');
	const writeCharacteristicInput = document.getElementById('write-characteristic-uuid');
	const writeValueInput = document.getElementById('write-value');



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
		document.getElementById(`btn--write`).addEventListener('click', writeHandler);
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
	* handle click on connect button
	* @returns {undefined}
	*/
	const connectHandler = async function(e) {
		e.preventDefault();
		const serviceUuid = valueFromHexString(filterServiceInput.value);
		isConnected = await webBluetooth.connect(serviceUuid);
		setConnectionStatus();
	};


	/**
	* set current connection status
	* @returns {undefined}
	*/
	const setConnectionStatus = function() {
		console.log('Connected:', isConnected);
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
		const serviceUuid = valueFromHexString(writeServiceInput.value);

		// get characteristic uuid
		const characteristicUuid = valueFromHexString(writeCharacteristicInput.value);
		
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
