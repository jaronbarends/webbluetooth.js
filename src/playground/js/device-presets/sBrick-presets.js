const sBrickPresets = {
	presetTitle: 'sBrick',
	services: [],
	namePrefix: 'SBrick',
	optionalServices: [
		{
			uuid: '4dc591b0-857c-41de-b5f1-15abda665b0c',// remote service
			description: 'remote control',
			characteristics: [
				{
					uuid: '02b8cbcc-0e25-4bda-8790-a15f53e6010f',// quick drive
					description: 'quick drive',
					exampleValue: '01 00 00 c0',
					valueExplanation: '01(drive) 00-03(port) 00-01(CW/CCW) 0-ff(power)'
				}
			],
		},
		{
			uuid: 'device_information',
			characteristics: [
				{
					uuid: 'firmware_revision_string'
				},
				{
					uuid: 'manufacturer_name_string'
				}
			]
		}
	],
};

export default sBrickPresets;