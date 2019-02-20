(function() {
	const thingy = {
		presetTitle: 'Thingy',
		namePrefix: 'Thingy',
		optionalServices: [
			{
				uuid: 'ef680100-9b35-4933-9b10-52ffa9740042', //Thingy Configuration Service
				description: 'configuration service',
				characteristics: [
					{
						uuid: 'ef680107-9b35-4933-9b10-52ffa9740042',// firmware version
						description: 'firmware version'
					}
				]
			},
			{
				uuid: 'ef680200-9b35-4933-9b10-52ffa9740042', // Thingy Environment Service
				description: 'environment service',
				characteristics: [
					{
						uuid: 'ef680201-9b35-4933-9b10-52ffa9740042', // TES_TEMP_UUID
						description: 'temperature'
					}
				]
			},
			{
				uuid: 'ef680300-9b35-4933-9b10-52ffa9740042', //Thingy User Interface Service
				description: 'user interface service',
				characteristics: [
					{
						uuid: 'ef680301-9b35-4933-9b10-52ffa9740042',// led
						description: 'led characteristic',
						exampleValue: '02 02 4a d0 07',
						exampleValueIsDecimal: false,
						valueExplanation: 'mode - color - intensity - delay LSB - delay MSB'
					}
				]
			},
		]
	};

	window.devicePresets = window.devicePresets || {}
	window.devicePresets.thingy = thingy;
})();