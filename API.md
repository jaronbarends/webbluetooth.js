# WebBluetooth.js API #

## Methods



## `myWebBluetooth.connect(options)`

Connect to a bluetooth device

### Parameters

`options` An [`options`](https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice#Parameters) object as requested by `Bluetooth.requestDevice` (`requestDevice` had been abstracted away in webbluetooth.js's `connect` method)

### Returns

A `Promise` resolving to a `Boolean`

**Note** I think this should maybe return the device that was connected to, to make it possible to connect one instance to multiple devices at the same time

### Example
```javascript
await myWebBluetooth.connect(options);
```


## `myWebBluetooth.disconnect()`

Disconnect the bluetooth device

##### Parameters

None

##### Returns

`undefined`




## `myWebBluetooth.readValue(serviceUUID, characteristicUUID, [returnType])`

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
const value = await myWebBluetooth.readValue(serviceUUID, characteristicUUID);
console.log(value);// logs: DataView(6) {buffer: (...), byteLength: (...), byteOffset: (...)} <= The original DataView returned by the Web Bluetooth API
```

Getting a `Uint8Array` value:

```javascript
const serviceUUID = 'ef680300-9b35-4933-9b10-52ffa9740042';// Thingy User Interface Service
const characteristicUUID = 'ef680101-9b35-4933-9b10-52ffa9740042';// Thingy Name characteristic
const value = await myWebBluetooth.readValue(serviceUUID, characteristicUUID, Uint8Array);
console.log(value);// logs: Uint8Array(6) [84, 104, 105, 110, 103, 121] <= values representing name's characters
```

Getting a `String` value:

```javascript
const serviceUUID = 'ef680100-9b35-4933-9b10-52ffa9740042';// Thingy Configuration Service
const characteristicUUID = 'ef680101-9b35-4933-9b10-52ffa9740042';// Thingy Name characteristic
const value = await myWebBluetooth.readValue(serviceUUID, characteristicUUID, String);
console.log(value);// logs: Thingy <= The actual name of the device
```




## `myWebBluetooth.writeValue(serviceUUID, characteristicUUID, value)`

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
await myWebBluetooth.writeValue(serviceUUID, characteristicUUID, value);
```




## `myWebBluetooth.getService(serviceUUID)`

Get a bluetooth GATT service

### Returns

A `Promise` resolving to a `BluetoothGATTService` object

### Parameters

`{String}` **`serviceUUID`** The UUID of the service to get

### Examples

```javascript
const serviceUUID = 'ef680300-9b35-4933-9b10-52ffa9740042';// Thingy User Interface Service
const service = await myWebBluetooth.getService(serviceUUID);
```




## `myWebBluetooth.getCharacteristic(serviceUUID, characteristicUUID)`

Get a bluetooth GATT characteristic

### Returns

A `Promise` resolving to a `BluetoothGATTCharacteristic` object

### Parameters

`{String}` **`serviceUUID`** The UUID of the service the characteristic belongs to  
`{String}` **`characteristicUUID`** The UUID of the characteristic to get

### Examples

```javascript
const serviceUUID = 'ef680300-9b35-4933-9b10-52ffa9740042';// Thingy User Interface Service
const characteristicUUID = 'ef680301-9b35-4933-9b10-52ffa9740042';// Thingy Name characteristic
const characteristic = await myWebBluetooth.getCharacteristic(serviceUUID, characteristicUUID);
```

## Properties

## `myWebBluetooth.isConnected`

Checks if the device is connected

### Returns

A `Boolean`



## `myWebBluetooth.name`

Get the device's name

### Returns

A `String`