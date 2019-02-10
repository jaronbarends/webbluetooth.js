(function() {
	const magicBlue = {
		connection: {
			services: '0xffe5'
		},
		operations: {
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
			]
		}
	};

	window.devicePresets = window.devicePresets || {}
	window.devicePresets.magicBlue = magicBlue;
})();