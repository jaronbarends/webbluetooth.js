// import the WebBluetooth class
import WebBluetooth from '../WebBluetooth.js';

// create an instance
const webBluetooth = new WebBluetooth();
let thingyDevice;
let bulbDevice;
let buttonCharacteristic;
let ledCharacteristic;

// define constants for the UUIDS of services and characteristics
const SERVICE_UUID_TUIS = 'ef680300-9b35-4933-9b10-52ffa9740042'; // UUID of Thingy User Interface Service
const CHAR_UUID_BUTTON = 'ef680302-9b35-4933-9b10-52ffa9740042';// UUID of Thingy button characteristic

const SERVICE_UUID_MAGIC_BLUE = 0xffe5; // UUID of MagicBlue bulb Service
const CHAR_UUID_LED = 0xffe9;// UUID of MagicBlue bulb led characteristic

// set request device options
const thingyOptions = {
	// acceptAllDevices: true,
	filters: [
		{namePrefix: 'Thingy'}
	],
	optionalServices: [SERVICE_UUID_TUIS]// you MUST specify services in filters or as optionalServices to be able to interact with them
};

const bulbOptions = {
	filters: [
		{services: [SERVICE_UUID_MAGIC_BLUE]}// you MUST specify services in filters or as optionalServices to be able to interact with them
	]
};


// add event listeners to all buttons - quite some repitition here, but that makes it easier to grasp ;)

//-- connecting with the device
document.getElementById(`connect-btn--thingy`).addEventListener('click', async function() {
	thingyDevice = await webBluetooth.connect(thingyOptions);
	console.log('connected to Thingy');
	console.log('fetch button characteristic');
	buttonCharacteristic = await thingyDevice.getCharacteristic(SERVICE_UUID_TUIS, CHAR_UUID_BUTTON);
	console.log('got button characteristic - start notifications');
	await buttonCharacteristic.startNotifications();
	console.log('button notifications started');
	buttonCharacteristic.addEventListener('characteristicvaluechanged', buttonchangeHandler);
});

//-- connecting with the device
document.getElementById(`connect-btn--magic-blue`).addEventListener('click', async function() {
	bulbDevice = await webBluetooth.connect(bulbOptions);
	console.log('connected to MagicBlue bulb');
	console.log('fetch led characteristic');
	ledCharacteristic = await bulbDevice.getCharacteristic(SERVICE_UUID_MAGIC_BLUE, CHAR_UUID_LED);
	console.log('got characteristic')
});


//-- disconnecting from the device
document.getElementById(`disconnect-btn`).addEventListener('click', function() {
	webBluetooth.disconnectAll();
	console.log('disconnected');
});



//-- handler for notifications
const buttonchangeHandler = function(e) {
	const characteristic = e.target;
	const dataView = characteristic.value;
	const uint8Array = webBluetooth.util.transform.dataViewToUint8Array(dataView);
	const pressed = uint8Array[0] === 1;
	if (pressed) {
		// write random value to bulb
		const r = Math.floor(256*Math.random());
		const g = Math.floor(256*Math.random());
		const b = Math.floor(256*Math.random());

		const writeValue = new Uint8Array([0x56, r, g, b, 0xbb, 0xf0, 0xaa]);
		bulbDevice.writeValue(SERVICE_UUID_MAGIC_BLUE, CHAR_UUID_LED, writeValue);
	}
}
