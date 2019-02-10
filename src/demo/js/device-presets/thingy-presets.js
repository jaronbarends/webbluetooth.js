(function() {
	const thingy = {
		connection: {
			namePrefix: 'Thingy',
			optionalServices: [
				'ef680100-9b35-4933-9b10-52ffa9740042',
				'ef680200-9b35-4933-9b10-52ffa9740042'
			]
		},
		operations: {
			services: [
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
				}
			]
		}
	};

	window.devicePresets = window.devicePresets || {}
	window.devicePresets.thingy = thingy;
})();