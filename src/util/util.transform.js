/*
* utility functions for transforming data
*/


/**
* convert the numbers in a dataView to text
* @returns {undefined}
*/
const dataViewToString = function(dataView) {
	const uint8Array = dataViewToUint8Array(dataView);
	const decoder = new TextDecoder('utf-8');
	return decoder.decode(uint8Array);
};


/**
* get the uint8 array for the dataView's on a buffer, taking byte offset and byte length into account
* @returns {undefined}
*/
const dataViewToUint8Array = function(dataView) {
	return new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
};

const transform = {
	dataViewToString,
	dataViewToUint8Array,
}

export default transform;