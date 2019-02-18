/*
* set of utility functions for working with demo interface
*/
;(() => {
	'use strict';

	// tell jshint about globals (they should remain commented out)
	/* globals zup */ //Tell jshint zup exists as global var

	/**
	* get form row for a characteristic
	* @returns {undefined}
	*/
	const getCharRowByUUID = function(charUUID) {
		return getCharInputByUUID(charUUID).closest('[data-characteristic-row]');
	};


	/**
	* get references to the stuff a button is associated with
	* @returns {undefined}
	*/
	const getBtnAssociations = function(btn) {
		const charRow = btn.closest('[data-characteristic-row]');
		const charUUIDStr = charRow.querySelector('[data-characteristic-input]').value;
		const charValueStr = charRow.querySelector('[data-value-input]').value;
		const serviceRow = charRow.closest('[data-service-row]');
		const serviceUUIDStr = serviceRow.querySelector('[data-service-input]').value;
		const valueInput = charRow.querySelector('[data-value-input');
		const valueStr = valueInput.value;

		return {
			charUUIDStr,
			charValueStr,
			serviceUUIDStr,
			valueInput,
			valueStr,
		};
	};
	


	/**
	* get the input field for a characteristic
	* @returns {undefined}
	*/
	const getCharInputByUUID = function(charUUID) {
		let charInput;
		document.querySelectorAll('[data-characteristic-input]').forEach(input => {
			if (input.value === charUUID) {
				charInput = input;
			}
		});
		return charInput;
	};


	/**
	* get the value input corresponding to a characteristic
	* @returns {undefined}
	*/
	const getValueInputByCharUUID = function(charUUID) {
		return getCharRowByUUID(charUUID).querySelector('[data-value-input');
	};










	const decodeLedData = function(data) {
		try {
		  const mode = data.getUint8(0);
		  const littleEndian = true;
		  let status;
	
		  switch (mode) {
		  case 0:
			status = {
			  mode: mode,
			};
			break;
		  case 1:
			status = {
			  mode: mode,
			  r: data.getUint8(1),
			  g: data.getUint8(2),
			  b: data.getUint8(3),
			};
			break;
		  case 2:
			status = {
			  mode: mode,
			  color: data.getUint8(1),
			  intensity: data.getUint8(2),
			  delay: data.getUint16(3, littleEndian),
			};
			break;
		  case 3:
			status = {
			  mode: mode,
			  color: data.getUint8(1),
			  intensity: data.getUint8(2),
			};
			break;
		  }
		  return status;
		} catch (error) {
		  throw error;
		}
	  }
	

	window.interfaceUtil = {
		getCharRowByUUID,
		getCharInputByUUID,
		getValueInputByCharUUID,
		getBtnAssociations,
		decodeLedData
	};

})();