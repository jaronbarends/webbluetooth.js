# Magic-Blue.js

Control a Magic Blue lightbulb with Javascript using the Web Bluetooth API

## How to use

Include magicblue.js as a module in your page
```html
<script src="js/magicblue.js" type="module"></script>
```

in your javascript file (make sure it's specified as type `module`):
* import the MagicBlue class:
* instantiate it
* **In response to a user action** connect with it
* call one of its methods

```javascript
import {MagicBlue} from './magicblue.js';
const bulb = new MagicBlue();
document.getElementById('my-connect-button').addEventListener('click', (e) => {
	e.preventDefault();
	bulb.connect();
});
bulb.setRGB(255, 0, 0);
```

Web bluetooth only works on https or localhost. A simple Node webserver is included in the repo. Start it by doubleclicking START-WEBSERVER.bat, or type `node webserver.js`. You can then view the files at http://localhost:8000

### Example page
_http://localhost:8000/demo/index.html_ gives you a page with examples of all functionality.

## Methods

### `connect`
Connect to the bulb. Due to security restrictions, this method can only be called in response to a user action

```javascript
bulb.connect();
```
#### parameters
_none_
#### returns
`Promise` object


### `disconnect`
disconnect the bulb.

```javascript
bulb.disconnect();
```
#### parameters
_none_
#### returns
`undefined`


### `setRGB`
Set the bulb's color using rgb values

```javascript
bulb.setRGB(red, green, blue);
```
#### parameters
`red`, `green`, `blue`: numbers (0-255)
#### Returns
`Promise` object


### `setWhite`
Set the bulb's white led's brightness level

```javascript
bulb.setWhite(level);
```
#### parameters
`level`: bulb brightness - number (0-255)
#### Returns
`Promise` object


### `setMode`
Sets one of the bulb's preset [animation modes|#predefined-modes]

```javascript
bulb.setWhite(modeId, speed);
```
#### parameters
`modeId`: number (37-56 or 0x25-0x38) corresponding with one of the bulb's predefined  
`speed`: speed of animation in seconds
#### Returns
`Promise` object


### `switchOn`
Switches the bulb on

```javascript
bulb.switchOn();
```
#### parameters
_none_
#### Returns
`Promise` object


### `switchOff`
Switches the bulb off

```javascript
bulb.switchOff();
```
#### parameters
_none_
#### Returns
`Promise` object

### Predefined animation modes
37: all color fade  
38: red fade  
39: green fade  
40: blue fade  
41: yellow fade  
42: cyan blue fade  
43: magenta fade  
44: white fade  
45: red-green fade  
46: red-blue fade  
47: blue-green fade  
48: color flash  
49: red flash  
50: green flash  
51: blue flash  
52: yellow flash  
53: cyan flash  
54: magenta flash  
55: white flash  
56: color switch