(function() {
	const thingy = {
		namePrefix: 'Thingy',
		optionalServices: [
			// SOMEHOW, ONLY TWO SERVICES WORK AT THE TIME?!
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
			// {
			// 	uuid: 'ef680200-9b35-4933-9b10-52ffa9740042', // Thingy Environment Service
			// 	description: 'environment service',
			// 	characteristics: [
			// 		{
			// 			uuid: 'ef680201-9b35-4933-9b10-52ffa9740042', // TES_TEMP_UUID
			// 			description: 'temperature'
			// 		}
			// 	]
			// },
			{
				uuid: 'ef680300-9b35-4933-9b10-52ffa9740042', //Thingy User Interface Service
				description: 'user interface service',
				characteristics: [
					{
						uuid: 'ef680301-9b35-4933-9b10-52ffa9740042',// led
						description: 'led characteristic',
						exampleValue: '02 02 4a d0 07',
						valueExplanation: 'mode color intensity delay delay<br>last two bytes are little endian'
					}
				]
			},
		]
	};

	window.devicePresets = window.devicePresets || {}
	window.devicePresets.thingy = thingy;
})();