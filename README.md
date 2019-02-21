# webbluetooth.js

A wrapper around the Web Bluetooth API


## Prerequisites

The Web Bluetooth API is still experimental. Check the implementation status for your platform and browser: https://github.com/WebBluetoothCG/web-bluetooth/blob/gh-pages/implementation-status.md

The Web Bluetooth API requires an https connection or a localhost environment to run. A simple Node webserver is included in the repo, but feel free to use any other local webserver.

You'll need a bluetooth device to connect with. In this README I'm using a [Nordic Thingy:52](https://www.nordicsemi.com/Software-and-Tools/Development-Kits/Nordic-Thingy-52).



## Getting started

A very basic implementation is shown in _demo/index.html_.


### Connecting to a device

For security reasons, Web Bluetooth will only connect to a device upon a deliberate user action, i.e. a click.

In your html include a button to connect to your device.
```html
<button id="connect-btn">Connect</button>
```

In your main js file, import the `WebBluetooth` class and instantiate it:
```javascript
// import the WebBluetooth class
import WebBluetooth from '../webBluetooth.js';
// create an instance
const webBluetooth = new WebBluetooth();
```
Make sure that you also include the _util_ folder in your project - it has some modules with helper functions the `WebBluetooth` class imports.

Declare the connection options; this is the [`options`](https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice#Parameters) object that is expected by the Web Bluetooth API's `requestDevice` method. (`requestDevice` had been abstracted away in webbluetooth.js's `connect` method)
```javascript
const serviceUUID = 'ef680300-9b35-4933-9b10-52ffa9740042';// this particular UUID is from Thingy's UI Service
const options = {
	acceptAllDevices: true,
	optionalServices: [serviceUUID];
};
```
Note that when you're connecting to the device, you **must** specify the UUID(s) of the _service(s)_ you want to communicate with, otherwise you won't be allowed to access them later. You can pass them in the `options.optionalServices` property, or as an `array` in the `services` property of an object in the `options.filters` `array`. (If you declare `filters` in your `options` object, you must remove the `acceptAllDevices` property )

Add a listener to you connect button to trigger the connection
```javascript
document.getElementById(`connect-btn`).addEventListener('click', async function() {
	await webBluetooth.connect(options);
});
```

You're now connected to the device.




### Reading a characteristic value
Once you're connected to the device, so you can read a _characteristic_'s value:

```javascript
const CHARACTERISTIC_UUID = 'ef680301-9b35-4933-9b10-52ffa9740042';// this particular UUID is from Thingy's led characteristic
const readValue = await webBluetooth.readValue(SERVICE_UUID, CHARACTERISTIC_UUID);
```



### Writing a characteristic value
Once you're connected to the device, so you can write a _characteristic_'s value. Values need to be passed in as a `Uint8Array`.

```javascript
const CHARACTERISTIC_UUID = 'ef680301-9b35-4933-9b10-52ffa9740042';// this particular UUID is from Thingy's led characteristic
const writeValue = new Uint8Array([2, 2, 74, 208, 7]);// values for led: [mode, color, intensity, delay (LSB), delay (MSB)]
await webBluetooth.writeValue(SERVICE_UUID, CHARACTERISTIC_UUID, writeValue);
```


## Methods and properties

Can be found in the [API documentation](../../blob/master/API.md)
