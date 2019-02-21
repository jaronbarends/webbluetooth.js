/*
* object with presets for pre-populating the form fields in the playground interface
* for connecting with a magic blue light bulb
*/
const magicBluePresets = {
	presetTitle: 'MagicBlue bulb',
	services: [
		{
			uuid: '0xffe5',
			characteristics: [
				{
					uuid: '0xffe9',
					exampleValue: '56 00 ff 00 bb f0 aa',
					valueExplanation: '56 RR GG BB bb f0 aa'
				}
			]
		}
	],
};

export default magicBluePresets;