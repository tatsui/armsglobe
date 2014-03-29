var controllers = {
	speed: 			3,							
	multiplier: 	0.5,
	backgroundColor:"#000000",
	zoom: 			1,
	spin: 			0,
	transitionTime: 2000,
};	

function buildGUI(){	
	var selection = new Selection();
	selectionData = selection;
	/*
	var updateVisualization = function(){
		selectVisualization( timeBins, selection.selectedTime, [selection.selectedCountry], selection.getUploadlogs(), selection.getDownloadlogs() );	
	}				

	var changeFunction = function(v){
		updateVisualization();
	}	

	var categoryFunction = function(v){
		updateVisualization();
	}

	var gui = new dat.GUI();
	var c = gui.add( selection, 'selectedTime', selectableTimes );
	c.onFinishChange( changeFunction );

	c = gui.add( selection, 'selectedCountry', selectableCountries );
	c.onFinishChange( changeFunction );		

	// c = gui.add( selection, 'showUploads' );
	// c.onFinishChange( filterFunction );

	// c = gui.add( selection, 'showDownloads' );
	// c.onFinishChange( filterFunction );

	var catFilterUploads = gui.addFolder('Uploads');
	for( var i in selection.uploadlogs ){
		var catSwitch = selection.uploadlogs[i];
		c = catFilterUploads.add( selection.uploadlogs, i );	
		c.onFinishChange( categoryFunction );
	}

	var catFilterDownloads = gui.addFolder('Downloads');
	for( var i in selection.downloadlogs ){
		var catSwitch = selection.downloadlogs[i];
		c = catFilterDownloads.add( selection.downloadlogs, i );	
		c.onFinishChange( categoryFunction );
	}	
	gui.close();
	*/
}
