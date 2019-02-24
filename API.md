# WebBluetooth.js API #

## Methods



## `myWebBluetooth.connect(options)`

Connect to a bluetooth device

### Parameters

`options` An [`options`](https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice#Parameters) object as requested by `Bluetooth.requestDevice` (`requestDevice` had been abstracted away in webbluetooth.js's `connect` method)

### Returns

A `Promise` resolving to a `WebBluetoothDevice` object



### Example
```javascript
const myDevice = await myWebBluetooth.connect(options);
```

---

## `myWebBluetooth.disconnect(device)`

Disconnect a bluetooth device

##### Parameters

None

##### Returns

`undefined`

---

## `myWebBluetooth.disconnectAll()`

Disconnect all bluetooth devices

##### Parameters

None

##### Returns

`undefined`

---

# WebBluetoothDevice API

The `WebBluetoothDevice` object isn't meant to be used on its own - it will be returned by `WebBluetooth` when calling its `connect` method.


## `myDevice.disconnect()`
Disconnect the device

### Returns

`undefined`

### Parameters
None

---

## `myDevice.readValue(serviceUUID, characteristicUUID, [returnType])`
Read a value from a characteristic

### Returns

A `Promise` resolving to a `DataView`, a `String` or a `Uint8Array`

### Parameters

`{String}` **`serviceUUID`** The UUID of the service the characteristic belongs to  
`{String}` **`characteristicUUID`** The UUID of the characteristic  
`{DataType object}` **`returnType`** (optional) The desired data type of the return value: `DataView`, `String` or a `Uint8Array`. You should pass in the dataType object itself, not a string representing it. Default value is `DataView`

### Examples

Getting a `DataView` value:

```javascript
const serviceUUID = 'ef680300-9b35-4933-9b10-52ffa9740042';// Thingy User Interface Service
const characteristicUUID = 'ef680101-9b35-4933-9b10-52ffa9740042';// Thingy Name characteristic
const value = await myDevice.readValue(serviceUUID, characteristicUUID);
console.log(value);// logs: DataView(6) {buffer: (...), byteLength: (...), byteOffset: (...)} <= The original DataView returned by the Web Bluetooth API
```

Getting a `Uint8Array` value:

```javascript
const serviceUUID = 'ef680300-9b35-4933-9b10-52ffa9740042';// Thingy User Interface Service
const characteristicUUID = 'ef680101-9b35-4933-9b10-52ffa9740042';// Thingy Name characteristic
const value = await myDevice.readValue(serviceUUID, characteristicUUID, Uint8Array);
console.log(value);// logs: Uint8Array(6) [84, 104, 105, 110, 103, 121] <= values representing name's characters
```

Getting a `String` value:

```javascript
const serviceUUID = 'ef680100-9b35-4933-9b10-52ffa9740042';// Thingy Configuration Service
const characteristicUUID = 'ef680101-9b35-4933-9b10-52ffa9740042';// Thingy Name characteristic
const value = await myDevice.readValue(serviceUUID, characteristicUUID, String);
console.log(value);// logs: Thingy <= The actual name of the device
```

---

## `myDevice.writeValue(serviceUUID, characteristicUUID, value)`

Read a value from a characteristic

### Returns

A `Promise` resolving to `undefined`

### Parameters

`{String}` **`serviceUUID`** The UUID of the service the characteristic belongs to  
`{String}` **`characteristicUUID`** The UUID of the characteristic  
`{Uint8Array}` **`value`** The data to write to the characteristic

### Examples

```javascript
const serviceUUID = 'ef680300-9b35-4933-9b10-52ffa9740042';// Thingy User Interface Service
const characteristicUUID = 'ef680301-9b35-4933-9b10-52ffa9740042';// Thingy Name characteristic
const value = new Uint8Array[2, 2, 74, 208, 7];
await myDevice.writeValue(serviceUUID, characteristicUUID, value);
```

---

## `myDevice.getService(serviceUUID)`

Get a bluetooth GATT service

### Returns

A `Promise` resolving to a `BluetoothGATTService` object

### Parameters

`{String}` **`serviceUUID`** The UUID of the service to get

### Examples

```javascript
const serviceUUID = 'ef680300-9b35-4933-9b10-52ffa9740042';// Thingy User Interface Service
const service = await myDevice.getService(serviceUUID);
```

---

## `myDevice.getCharacteristic(serviceUUID, characteristicUUID)`

Get a bluetooth GATT characteristic

### Returns

A `Promise` resolving to a `BluetoothGATTCharacteristic` object

### Parameters

`{String}` **`serviceUUID`** The UUID of the service the characteristic belongs to  
`{String}` **`characteristicUUID`** The UUID of the characteristic to get

### Example

```javascript
const serviceUUID = 'ef680300-9b35-4933-9b10-52ffa9740042';// Thingy User Interface Service
const characteristicUUID = 'ef680301-9b35-4933-9b10-52ffa9740042';// Thingy Name characteristic
const characteristic = await myDevice.getCharacteristic(serviceUUID, characteristicUUID);
```

---

## `myDevice.addEventListener(eventName, callback)`

Add an event listener to the device. At the moment only `gattserverdisconnected` is supported. The event listener will be added to the native `BluetoothDevice` object

### Returns

`undefined`

### Parameters

`{String}` **`eventName`** The name of the event to listened to. Only `gattserverdisconnected` is supported
`{Function}` **`callback`** The callback to be called

### Example

```javascript
myDevice.addEventListener('gattserverdisconnected', someFunction);
```


---

## Properties

## `myDevice.id`

This device's `BluetoothDevice` object's `id` property

---

## `myDevice.name`

Get the device's name

### Returns

A `String`

---

## `myDevice.gatt`

This device's `BluetoothGATTRemoteServer` object

---

## `myDevice.deviceObj`

This device's `BluetoothDevice` object

---

## `myDevice.isConnected`

Checks if the device is connected

### Returns

A `Boolean`