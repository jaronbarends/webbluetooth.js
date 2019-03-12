// import the WebBluetooth class
import WebBluetooth from '../WebBluetooth.js';

// create an instance
const webBluetooth = new WebBluetooth();
let device;

// define constants for the UUIDS of services and characteristics
const SERVICE_UUID_TUIS = 'ef680300-9b35-4933-9b10-52ffa9740042'; // UUID of Thingy User Interface Service
const CHAR_UUID_LED = 'ef680301-9b35-4933-9b10-52ffa9740042';// UUID of Thingy led characteristic
const SERVICE_UUID_TES = 'ef680200-9b35-4933-9b10-52ffa9740042'; // UUID of Thingy Environment Service
const CHAR_UUID_TEMP = 'ef680201-9b35-4933-9b10-52ffa9740042';// UUID of Thingy temperature characteristic

// set request device options
const options = {
	// acceptAllDevices: true,
	filters: [
		{namePrefix: 'Thingy'}
	],
	optionalServices: [SERVICE_UUID_TUIS, SERVICE_UUID_TES]// you MUST specify services in filters or as optionalServices to be able to interact with them
};

// add event listeners to all buttons - quite some repitition here, but that makes it easier to grasp ;)

//-- connecting with the device
document.getElementById(`connect-btn`).addEventListener('click', async function() {
	device = await webBluetooth.connect(options);
	console.log('connected to device');
});


//-- disconnecting from the device
document.getElementById(`disconnect-btn`).addEventListener('click', function() {
	webBluetooth.disconnect(device);
	console.log('disconnected');
});

//-- read led value
document.getElementById(`read-btn`).addEventListener('click', async function() {
	const value = await device.readValue(SERVICE_UUID_TUIS, CHAR_UUID_LED);
	const value2 = await device.readValue(SERVICE_UUID_TUIS, CHAR_UUID_LED, Uint8Array);
	console.log('value:', value);
	console.log('value2:', value2);
});


//-- write led value (red)
document.getElementById(`write-btn--red`).addEventListener('click', async function() {
	const value = new Uint8Array([2, 1, 74, 208, 7]);// the second array value represents color (1-7 allowed)
	await device.writeValue(SERVICE_UUID_TUIS, CHAR_UUID_LED, value);
	console.log('done writing');
});


//-- write led value (green)
document.getElementById(`write-btn--green`).addEventListener('click', async function() {
	const value = new Uint8Array([2, 2, 74, 208, 7]);// the second array value represents color (1-7 allowed)
	await device.writeValue(SERVICE_UUID_TUIS, CHAR_UUID_LED, value);
	console.log('done writing');
});


//-- handler for notifications
const notificationHandler = function(e) {
	const characteristic = e.target;
	const dataView = characteristic.value;
	const uint8Array = webBluetooth.util.transform.dataViewToUint8Array(dataView);
	console.log('value:', uint8Array);
}


//-- start notifications
document.getElementById(`start-notify-btn`).addEventListener('click', async function() {
	const characteristic = await device.getCharacteristic(SERVICE_UUID_TES, CHAR_UUID_TEMP);
	characteristic.addEventListener('characteristicvaluechanged', notificationHandler);// use named function instead of anonymous function here to be able to remove this event listener later
	characteristic.startNotifications();
});


//-- stop notifications
document.getElementById(`stop-notify-btn`).addEventListener('click', async function() {
	const characteristic = await device.getCharacteristic(SERVICE_UUID_TES, CHAR_UUID_TEMP);
	characteristic.removeEventListener('characteristicvaluechanged', notificationHandler);
	characteristic.stopNotifications();
});