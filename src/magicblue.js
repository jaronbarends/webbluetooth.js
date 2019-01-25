
const MagicBlue = (function() {

	'use strict';

	const SERVICE_UUID = 0xffe5;
	const CONTROL_CHARACTERISTIC_UUID = 0xffe9;

	// export class MagicBlue {
	 class MagicBlue {
		constructor() {
			this._webBluetooth = new WebBluetooth();
			this._ctrlCharacteristic = null;
		}

		/**
		* connect with the bulb
		* @returns {boolean}
		*/
		async connect() {
			return this._webBluetooth.connect(SERVICE_UUID);
		}


		/**
		* disconnect the bulb
		* @returns {undefined}
		*/
		disconnect() {
			this._webBluetooth.disconnect();
		};


		/**
		* switch the bulb on
		* @returns {Promise}
		*/
		switchOn() {
			const value = new Uint8Array([0xcc, 0x23, 0x33]);
			return this._webBluetooth.writeValue(CONTROL_CHARACTERISTIC_UUID, value);
		};


		/**
		* switch the bulb off
		* @returns {Promise}
		*/
		switchOff() {
			const value = new Uint8Array([0xcc, 0x24, 0x33]);
			return this._webBluetooth.writeValue(CONTROL_CHARACTERISTIC_UUID, value);
		};


		/**
		* set an rgb value
		* @param {number} r - Red value 0-255
		* @param {number} g - Green value 0-255
		* @param {number} b - Blue value 0-255
		* @returns {Promise}
		*/
		setRGB(r, g, b) {
			const value = new Uint8Array([0x56, r, g, b, 0xbb, 0xf0, 0xaa]);
			return this._webBluetooth.writeValue(CONTROL_CHARACTERISTIC_UUID, value);
		};


		/**
		* set white level
		* @param {number} level - Brightness 0-255
		* @returns {Promise}
		*/
		setWhite(level) {
			const value = new Uint8Array([0x56, 0x00, 0x00, 0x00, level, 0x0f, 0xaa]);
			return this._webBluetooth.writeValue(CONTROL_CHARACTERISTIC_UUID, value);
		};


		/**
		* set preset mode
		* @param {number} modeId - number between 0x25 and 0x38 (37-56)
		* @param {number} speed - speed in seconds
		* @returns {Promise}
		*/
		setMode(modeId, speed) {
			const speedUnits = 1000 * speed / 200;// one speed unit is around 200 msec
			const value = new Uint8Array([0xbb, modeId, speedUnits, 0x44]);
			return this._webBluetooth.writeValue(CONTROL_CHARACTERISTIC_UUID, value);
		};
		
	}

	return MagicBlue;

})();
