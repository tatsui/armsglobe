/**
ui.control.js
Created by Pitch Interactive
Created on 6/26/2012
This code will control the primary functions of the UI in the ArmsGlobe app
**/
d3.selection.prototype.moveToFront = function() { 
	return this.each(function() { 
		this.parentNode.appendChild(this); 
	}); 
}; 

var d3Graphs = {
	barGraphWidth: 300,
	barGraphHeight: 800,
	barWidth: 14,
	barGraphTopPadding: 20,
	barGraphBottomPadding: 50,
	histogramWidth: 856,
	histogramHeight: 160,
	histogramLeftPadding:31,
	histogramRightPadding: 31,
	histogramVertPadding:20,
	barGraphSVG: d3.select("#wrapper").append("svg").attr('id','barGraph'),
	histogramSVG: null,
	histogramYScale: null,
	histogramXScale: null,
	cumDownloadY: 0,cumUploadY: 0,
	cumDownloadLblY: 0,cumUploadLblY: 0,
	inited: false,
	histogramOpen: false,
	handleLeftOffset: 12,
	handleInterval: 35,
	windowResizeTimeout: -1,
	histogramDownloads: null,
	histogramUploads: null,
	histogramAbsMax: 0,
	previousDownloadLabelTranslateY: -1,
	previousUploadLabelTranslateY: -1,
	zoomBtnInterval: -1,


	setCountry: function(country) {
		$("#hudButtons .countryTextInput").val(country);
		d3Graphs.updateViz();
	},
	initGraphs: function() {
		this.showHud();
		this.drawBarGraph();
		this.drawHistogram();
	},
	showHud: function() {
		if(this.inited) return;
		this.inited = true;
		d3Graphs.windowResize();
		$("#hudHeader, #hudButtons").show();
		$("#history").show();
		$("#graphIcon").show();
		$("#downloadUploadBtns").show();
		$("#graphIcon").click(d3Graphs.graphIconClick);
		$("#history .close").click(d3Graphs.closeHistogram);
		$("#history ul li").click(d3Graphs.clickTimeline);
		$("#handle").draggable({axis: 'x',containment: "parent",grid:[this.handleInterval, this.handleInterval],  stop: d3Graphs.dropHandle, drag: d3Graphs.dropHandle });
		$("#hudButtons .searchBtn").click(d3Graphs.updateViz);
		$("#downloadUploadBtns .imex>div").not(".label").click(d3Graphs.downloadUploadBtnClick);
		$("#downloadUploadBtns .imex .label").click(d3Graphs.downloadUploadLabelClick);
		$("#hudButtons .countryTextInput").autocomplete({ source:selectableCountries, autoFocus: true });
		$("#hudButtons .countryTextInput").keyup(d3Graphs.countryKeyUp);
		$("#hudButtons .countryTextInput").focus(d3Graphs.countryFocus);
		$("#hudButtons .aboutBtn").click(d3Graphs.toggleAboutBox);
		$(document).on("click",".ui-autocomplete li",d3Graphs.menuItemClick);
		$(window).resize(d3Graphs.windowResizeCB);
		$(".zoomBtn").mousedown(d3Graphs.zoomBtnClick);
		$(".zoomBtn").mouseup(d3Graphs.zoomBtnMouseup);
		
	},
	zoomBtnMouseup: function() {
		clearInterval(d3Graphs.zoomBtnInterval);
	},
	zoomBtnClick:function() {
		var delta;
		if($(this).hasClass('zoomOutBtn')) {
			delta = -0.5;
		} else {
			delta = 0.5;
		}
		d3Graphs.doZoom(delta);
		d3Graphs.zoomBtnInterval = setInterval(d3Graphs.doZoom,50,delta);
	},
	doZoom:function(delta) {
		camera.scale.z += delta * 0.1;
		camera.scale.z = constrain( camera.scale.z, 0.8, 5.0 );
	},
	toggleAboutBox:function() {
		$("#aboutContainer").toggle();
	},
	clickTimeline:function() {
		var time = $(this).html();
		var index = time;
		var leftPos = d3Graphs.handleLeftOffset + d3Graphs.handleInterval * index;
		$("#handle").css('left',leftPos+"px");
		d3Graphs.updateViz();
	},
	windowResizeCB:function() {
		clearTimeout(d3Graphs.windowResizeTimeout);
		d3Graphs.windowResizeTimeout = setTimeout(d3Graphs.windowResize, 50);
	},
	windowResize: function() {
		var windowWidth = $(window).width();
		var windowHeight = $(window).height();
		d3Graphs.positionHistory(windowWidth);
		var minWidth = 1280;
		var minHeight = 860;
		var w = windowWidth < minWidth ? minWidth : windowWidth;
		var hudButtonWidth = 489;
		$('#hudButtons').css('left',w - hudButtonWidth-20);		
		var downloadUploadButtonWidth = $("#downloadUploadBtns").width();
		$("#downloadUploadBtns").css('left',w-downloadUploadButtonWidth - 20);
		var barGraphHeight = 800;
		var barGraphBottomPadding = 10;
		console.log(windowHeight+ " " + barGraphHeight + " " + barGraphBottomPadding);
		var barGraphTopPos = (windowHeight < minHeight ? minHeight : windowHeight) - barGraphHeight - barGraphBottomPadding;
		console.log(barGraphTopPos);
		
		$("#barGraph").css('top',barGraphTopPos+'px');
		/*
		var hudHeaderLeft = $("#hudHeader").css('left');
		hudHeaderLeft = hudHeaderLeft.substr(0,hudHeaderLeft.length-2)
		console.log(hudHeaderLeft);
		var hudPaddingRight = 30;
		$("#hudHeader").width(w-hudHeaderLeft - hudPaddingRight);
		*/
	},
	positionHistory: function(windowWidth) {
		var graphIconPadding = 20;
		var historyWidth = $("#history").width();
		var totalWidth = historyWidth + $("#graphIcon").width() + graphIconPadding;
//		var windowWidth = $(window).width();
		var historyLeftPos = (windowWidth - totalWidth) / 2.0;
		var minLeftPos = 280;
		if(historyLeftPos < minLeftPos) {
			historyLeftPos = minLeftPos;
		}
		$("#history").css('left',historyLeftPos+"px");
		$("#graphIcon").css('left',historyLeftPos + historyWidth + graphIconPadding+'px');
	},
	countryFocus:function(event) {
		//console.log("focus");
		setTimeout(function() { $('#hudButtons .countryTextInput').select() },50);
	},
	menuItemClick:function(event) {
		d3Graphs.updateViz();
	},
	countryKeyUp: function(event) {
		if(event.keyCode == 13 /*ENTER */) {
			d3Graphs.updateViz();
		}
	},
	
	updateViz:function() {
		var timeOffset = $("#handle").css('left');
		timeOffset = timeOffset.substr(0,timeOffset.length-2);
		timeOffset -= d3Graphs.handleLeftOffset;
		timeOffset /= d3Graphs.handleInterval;
		var time = timeOffset;
		
		var country = $("#hudButtons .countryTextInput").val().toUpperCase();
		if(typeof countryData[country] == 'undefined') {
			return;
		}
		
		//uploads first
		var uploadArray = []
		var uploadBtns = $("#downloadUploadBtns .uploads>div").not(".label");
		for(var i = 0; i < uploadBtns.length; i++) {
			var btn = $(uploadBtns[i]);
			var weaponTypeKey = btn.attr('class');
			var weaponName = reverseWeaponLookup[weaponTypeKey];

			if(btn.find('.inactive').length == 0) {
				uploadArray.push(weaponName);
				selectionData.uploadlogs[weaponName] = true;
			} else {
				selectionData.uploadlogs[weaponName] = false;
			}
		}
		//downloads esecond
		var downloadArray = []
		var downloadBtns = $("#downloadUploadBtns .downloads>div").not(".label");
		for(var i = 0; i < downloadBtns.length; i++) {
			var btn = $(downloadBtns[i]);
			var weaponTypeKey = btn.attr('class');
			var weaponName = reverseWeaponLookup[weaponTypeKey];
			if(btn.find('.inactive').length == 0) {
				downloadArray.push(weaponName);
				selectionData.downloadlogs[weaponName] = true;
			} else {
				selectionData.downloadlogs[weaponName] = false;
			}
		}
		selectionData.selectedTime = time;
		selectionData.selectedCountry = country;
		selectVisualization(timeBins, time,[country],uploadArray, downloadArray);
	},
	dropHandle:function() {
		d3Graphs.updateViz();
	},
	downloadUploadLabelClick: function() {
		var btns = $(this).prevAll();
		var numInactive = 0;
		for(var i = 0; i < btns.length; i++) {
			if($(btns[i]).find('.inactive').length > 0) {
				numInactive++;
			}
		}
		if(numInactive <= 1) {
			//add inactive
			$(btns).find('.check').addClass('inactive');
		} else {
			//remove inactive
			$(btns).find('.check').removeClass('inactive');
		}
		d3Graphs.updateViz();
	},
	downloadUploadBtnClick:function() { 
		var check = $(this).find('.check');
		if(check.hasClass('inactive')) {
			check.removeClass('inactive');
		} else {
			check.addClass('inactive');
		}
		d3Graphs.updateViz();
	},
	graphIconClick: function() {
		if(!d3Graphs.histogramOpen) {
			d3Graphs.histogramOpen = true;
			$("#history .graph").slideDown();
		} else {
			d3Graphs.closeHistogram();
		}
	},
	closeHistogram: function() {
		d3Graphs.histogramOpen = false;
		$("#history .graph").slideUp();
	},
	line: d3.svg.line()
		// assign the X function to plot our line as we wish
	.x(function(d,i) { 
		if(d == null) {
			return null;
		}
		return d3Graphs.histogramXScale(d.x) + d3Graphs.histogramLeftPadding; 
	 })
	.y(function(d) { 
		if(d == null) {
			return null;
		}
		return d3Graphs.histogramYScale(d.y) + d3Graphs.histogramVertPadding; 
	}),
	setHistogramData:function() {
		var downloadArray = [];
		var uploadArray = [];
		var historical = selectedCountry.summary.historical;
		var numHistory = historical.length;
		var absMax = 0;
		var startingDownloadIndex = 0;
		var startingUploadIndex = 0;
		
		while(startingDownloadIndex < historical.length && historical[startingDownloadIndex].downloads == 0) {
			startingDownloadIndex++;
		}
		while(startingUploadIndex < historical.length && historical[startingUploadIndex].uploads == 0) {
			startingUploadIndex++;
		}
		for(var i = 0; i < startingDownloadIndex; i++) {
//			downloadArray.push({x:i, y:null});
		}
		if(startingDownloadIndex != numHistory) {
			downloadArray.push({x: startingDownloadIndex, y:0});
		}
		for(var i = startingDownloadIndex + 1; i < numHistory; i++) {
			var downloadPrev = historical[startingDownloadIndex].downloads;
			var downloadCur = historical[i].downloads;
			var downloadDiff = (downloadCur - downloadPrev) / downloadPrev * 100;
			downloadArray.push({x:i, y:downloadDiff});
			if(Math.abs(downloadDiff) > absMax) {
				absMax = Math.abs(downloadDiff);
			}
			
		}
		for(var i = 0; i < startingUploadIndex; i++) {
		//	uploadArray.push(null);
		}
		if(startingUploadIndex != numHistory) {
			uploadArray.push({x: startingUploadIndex, y: 0});
		}
		for(var i = startingUploadIndex + 1; i < numHistory; i++) {	
			var uploadPrev = historical[startingUploadIndex].uploads;
			var uploadCur = historical[i].uploads;
			var uploadDiff = (uploadCur - uploadPrev) / uploadPrev * 100;
			uploadArray.push({x: i, y: uploadDiff}); 
			if(Math.abs(uploadDiff) > absMax) {
				absMax = Math.abs(uploadDiff);
			}
			
		}
		this.histogramDownloadArray = downloadArray;
		this.histogramUploadArray = uploadArray;
		this.histogramAbsMax = absMax;
	},
	drawHistogram:function() {
		if(this.histogramSVG == null) {
			this.histogramSVG = d3.select('#history .container').append('svg');
			this.histogramSVG.attr('id','histogram').attr('width',this.histogramWidth).attr('height',this.histogramHeight);
		}
		this.setHistogramData();
		
		this.histogramYScale = d3.scale.linear().domain([this.histogramAbsMax,-this.histogramAbsMax]).range([0, this.histogramHeight - this.histogramVertPadding*2]);
		var maxX = selectedCountry.summary.historical.length - 1;
		this.histogramXScale = d3.scale.linear().domain([0,maxX]).range([0, this.histogramWidth - this.histogramLeftPadding - this.histogramRightPadding]);
		
		var tickData = this.histogramYScale.ticks(4);
		var containsZero = false;
		var numTicks = tickData.length;
		for(var i = 0; i < numTicks; i++) {
			if(tickData[i] == 0) {
				containsZero = true;
				break;
			}
		}
		if(!containsZero && numTicks != 0) {
			tickData.push(0);
		}
		//tick lines
		var ticks = this.histogramSVG.selectAll('line.tick').data(tickData);
		ticks.enter().append('svg:line').attr('class','tick');
		ticks.attr('y1',function(d) {
			return d3Graphs.histogramYScale(d) + d3Graphs.histogramVertPadding;
		}).attr('y2', function(d) {
			return d3Graphs.histogramYScale(d) + d3Graphs.histogramVertPadding;
		}).attr('x1',this.histogramLeftPadding).attr('x2',this.histogramWidth - this.histogramRightPadding)
		.attr('stroke-dasharray',function(d) {
			if(d == 0) {
			  return null;
			}
			return '3,1';
		}).attr('stroke-width',function(d) {
			if(d == 0) {
				return 2;
			}
			return 1;
		});
		//tick labels
		var tickLabels = this.histogramSVG.selectAll("text.tickLblLeft").data(tickData);
		tickLabels.enter().append('svg:text').attr('class','tickLbl tickLblLeft').attr('text-anchor','end');
		tickLabels.attr('x', d3Graphs.histogramLeftPadding-3).attr('y',function(d) {
			return d3Graphs.histogramYScale(d) + d3Graphs.histogramVertPadding + 4;
		}).text(function(d) { return Math.abs(d); }).attr('display', function(d) {
			if(d == 0) { return 'none'; }
			return null;
		});
		var tickLabelsRight = this.histogramSVG.selectAll("text.tickLblRight").data(tickData);
		tickLabelsRight.enter().append('svg:text').attr('class','tickLbl tickLblRight');
		tickLabelsRight.attr('x', d3Graphs.histogramWidth - d3Graphs.histogramRightPadding+3).attr('y',function(d) {
			return d3Graphs.histogramYScale(d) + d3Graphs.histogramVertPadding + 4;
		}).text(function(d) { return Math.abs(d); }).attr('display', function(d) {
			if(d == 0) { return 'none'; }
			return null;
		});
		ticks.exit().remove();
		tickLabels.exit().remove();
		tickLabelsRight.exit().remove();
		//+ and -
		var plusMinus = this.histogramSVG.selectAll("text.plusMinus").data(["+","—","+","—"]); //those are &mdash;s
		plusMinus.enter().append('svg:text').attr('class','plusMinus').attr('text-anchor',function(d,i) {
			if(i < 2) return 'end';
			return null;
		}).attr('x',function(d,i) {
			var plusOffset = 3;
			if(i < 2) return d3Graphs.histogramLeftPadding + (d == '+' ? -plusOffset : 0) -2;
			return d3Graphs.histogramWidth - d3Graphs.histogramRightPadding + (d == '+' ? plusOffset : 0)+2;
		}).attr('y',function(d,i) {
			var yOffset = 10;
			return d3Graphs.histogramYScale(0) + d3Graphs.histogramVertPadding +  6 + (d == '+' ? -yOffset : yOffset); 
		}).text(String);
		//lines
		var downloadsVisible = $("#downloadUploadBtns .downloads .check").not(".inactive").length != 0;
		var uploadsVisible = $("#downloadUploadBtns .uploads .check").not(".inactive").length != 0;
		$("#history .labels .uploads").css('display', uploadsVisible ? 'block' : 'none');
		$("#history .labels .downloads").css('display', downloadsVisible ? 'block' : 'none');
		
	
		var downloadLine = this.histogramSVG.selectAll("path.download").data([1]);
		downloadLine.enter().append('svg:path').attr('class','download');
		downloadLine.attr('d',
		function(){
			if(d3Graphs.histogramDownloadArray.length == 0) {
				return 'M 0 0';
			} else {
				return d3Graphs.line(d3Graphs.histogramDownloadArray);
			}
		}).attr('visibility',downloadsVisible ? 'visible' : 'hidden');
		var uploadLine = this.histogramSVG.selectAll("path.upload").data([1]);
		uploadLine.enter().append('svg:path').attr('class','upload');
		uploadLine.attr('d',function() {
			if(d3Graphs.histogramUploadArray.length == 0) {
				return 'M 0 0';
			} else {
				return d3Graphs.line(d3Graphs.histogramUploadArray);
			}
		}).attr('visibility', uploadsVisible ? 'visible' : 'hidden');
		downloadLine.moveToFront();
		uploadLine.moveToFront();
		//active time labels
		var timeOffset = $("#handle").css('left');
		timeOffset = timeOffset.substr(0,timeOffset.length-2);
		timeOffset -= d3Graphs.handleLeftOffset;
		timeOffset /= d3Graphs.handleInterval;
		var activeTimeDownloads = null;
		for(var i = 0; i < this.histogramDownloadArray.length; i++) {
			var curTimeData = this.histogramDownloadArray[i];
			if(curTimeData.x == timeOffset) {
				activeTimeDownloads = curTimeData;
				break;
			}
		}
		var activeTimeUploads = null;
		for(var i = 0; i < this.histogramUploadArray.length; i++) {
			var curTimeData = this.histogramUploadArray[i];
			if(curTimeData.x == timeOffset) {
				activeTimeUploads = curTimeData;
				break;
			}
		}
		var maxVal;
		if(activeTimeDownloads != null && activeTimeUploads!= null) {
			maxVal = activeTimeDownloads.y > activeTimeUploads.y ? activeTimeDownloads.y : activeTimeUploads.y;
		} else if(activeTimeDownloads != null) {
			maxVal = activeTimeDownloads.y;
		} else if(activeTimeUploads != null) {
			maxVal = activeTimeUploads.y;
		} else {
			maxVal = -1;
		}

		var activeTimeData = [{x:timeOffset, y: activeTimeDownloads != null ? activeTimeDownloads.y : -1, max: maxVal, show: activeTimeDownloads!=null, type:"downloads"},
			{x: timeOffset, y: activeTimeUploads != null ? activeTimeUploads.y : -1, max: maxVal, show:activeTimeUploads!=null, type:'uploads'}];
		var timeDots = this.histogramSVG.selectAll("ellipse.year").data(activeTimeData);
		var timeDotLabels = this.histogramSVG.selectAll("text.yearLabel").data(activeTimeData);
		timeDots.enter().append('ellipse').attr('class','year').attr('rx',4).attr('ry',4)
			.attr('cx',function(d) { return d3Graphs.histogramLeftPadding + d3Graphs.histogramXScale(d.x); })
			.attr('cy',function(d) { return d3Graphs.histogramVertPadding + d3Graphs.histogramYScale(d.y); });
		timeDotLabels.enter().append('text').attr('class','yearLabel').attr('text-anchor','middle');
		var downloadsVisible = $("#downloadUploadBtns .downloads .check").not(".inactive").length != 0;
		var uploadsVisible = $("#downloadUploadBtns .uploads .check").not(".inactive").length != 0;
		
		timeDots.attr('cx', function(d) { return d3Graphs.histogramLeftPadding + d3Graphs.histogramXScale(d.x); })
			.attr('cy',function(d) { return d3Graphs.histogramVertPadding + d3Graphs.histogramYScale(d.y); } )
			.attr('visibility', function(d) {
				if(d.show == false) {
					return 'hidden';
				}
				if(d.type == "downloads") {
					return downloadsVisible ? 'visible' : 'hidden';
				} else if(d.type == "uploads") {
					return uploadsVisible ? 'visible' : 'hidden';
				}
			});
		timeDotLabels.attr('x',function(d) { return d3Graphs.histogramLeftPadding + d3Graphs.histogramXScale(d.x); })
		.attr('y',function(d) {
			var yVal = d3Graphs.histogramYScale(d.y) + d3Graphs.histogramVertPadding;
			if(d.y == maxVal) {
				yVal -= 7;  
			} else {
				yVal += 19;
			}
			if(yVal > d3Graphs.histogramHeight + d3Graphs.histogramVertPadding) {
				yVal -= 26;
			}
			return yVal;
			
		}).text(function(d) {
			var numlbl = Math.round(d.y*10)/10;
			var lbl = "";
			if(d.y > 0) {
				lbl = "+";
			}
			lbl += ""+numlbl+"%";
			return lbl;

		}).attr('visibility', function(d) {
			if(d.show == false) {
				return 'hidden';
			}
			if(d.type == "downloads") {
				return downloadsVisible ? 'visible' : 'hidden';
			} else if(d.type == "uploads") {
				return uploadsVisible ? 'visible' : 'hidden';
			}
		});
		timeDots.moveToFront();
		timeDotLabels.moveToFront();

	},
	drawBarGraph: function() {
		this.barGraphSVG.attr('id','barGraph').attr('width',d3Graphs.barGraphWidth).attr('height',d3Graphs.barGraphHeight).attr('class','overlayCountries noPointer');
		var downloadArray = [];
		var uploadArray = [];
		var downloadTotal = selectedCountry.summary.downloaded.total;
		var uploadTotal = selectedCountry.summary.uploaded.total;
		var minImExAmount = Number.MAX_VALUE;
		var maxImExAmount = Number.MIN_VALUE;
		for(var type in reverseWeaponLookup) {
			var imAmnt = selectedCountry.summary.downloaded[type];
			var exAmnt = selectedCountry.summary.uploaded[type];
			if(imAmnt < minImExAmount) {
				minImExAmount = imAmnt;
			}
			if(imAmnt > maxImExAmount) {
				maxImExAmount = imAmnt;
			}
			if(exAmnt < minImExAmount) {
				minImExAmount = exAmnt;
			}
			if(exAmnt > maxImExAmount) {
				maxImExAmount = exAmnt;
			}
			downloadArray.push({"type":type, "amount": imAmnt});
			uploadArray.push({"type":type, "amount": exAmnt});
		}
		var max = downloadTotal > uploadTotal ? downloadTotal : uploadTotal;
		var yScale = d3.scale.linear().domain([0,max]).range([0,this.barGraphHeight - this.barGraphBottomPadding - this.barGraphTopPadding]);
		var downloadRects = this.barGraphSVG.selectAll("rect.download").data(downloadArray);
		var midX = this.barGraphWidth / 2;
		this.cumDownloadY = this.cumUploadY = 0;
		downloadRects.enter().append('rect').attr('class', function(d) {
			return 'download '+d.type;
		}).attr('x',midX - this.barWidth).attr('width',this.barWidth);
		
		downloadRects.attr('y',function(d) {
			var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumDownloadY - yScale(d.amount) ;
			d3Graphs.cumDownloadY += yScale(d.amount);
			return value;
		}).attr('height',function(d) { return yScale(d.amount); });
		var uploadRects = this.barGraphSVG.selectAll('rect.upload').data(uploadArray);
		uploadRects.enter().append('rect').attr('class',function(d) {
			return 'upload '+ d.type;
		}).attr('x',midX + 10).attr('width',this.barWidth);
		
		uploadRects.attr('y',function(d) {
			var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumUploadY - yScale(d.amount);
			d3Graphs.cumUploadY += yScale(d.amount);
			return value;
		}).attr('height',function(d) { return yScale(d.amount); });
		//bar graph labels
		this.cumDownloadLblY = 0;
		this.cumUploadLblY = 0;
		this.previousDownloadLabelTranslateY = 0;
		this.previousUploadLabelTranslateY = 0;
		var paddingFromBottomOfGraph = 00;
		var heightPerLabel = 25;
		var fontSizeInterpolater = d3.interpolateRound(10,28);
		var smallLabelSize = 22;
		var mediumLabelSize = 40;
		//download labels
		var downloadLabelBGs = this.barGraphSVG.selectAll("rect.barGraphLabelBG").data(downloadArray);
		downloadLabelBGs.enter().append('rect').attr('class',function(d) {
			return 'barGraphLabelBG ' + d.type; });
		var downloadLabels = this.barGraphSVG.selectAll("g.downloadLabel").data(downloadArray);
		downloadLabels.enter().append("g").attr('class',function(d) {
			return 'downloadLabel '+d.type;
		});
		downloadLabels.attr('transform',function(d) { 
			var translate = 'translate('+(d3Graphs.barGraphWidth / 2 - 25)+",";
			var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumDownloadLblY - yScale(d.amount)/2;
			d3Graphs.cumDownloadLblY += yScale(d.amount);
			translate += value+")";
			this.previousDownloadLabelTranslateY = value;
			return translate;
		}).attr('display',function(d) {
			if(d.amount == 0) { return 'none';}
			return null;
		});
		downloadLabels.selectAll("*").remove();
		var downloadLabelArray = downloadLabels[0];
		var downloadLabelBGArray = downloadLabelBGs[0];
		for(var i = 0; i < downloadLabelArray.length; i++) {
			var downloadLabelE = downloadLabelArray[i];
			var downloadLabel = d3.select(downloadLabelE);
			var data = downloadArray[i];
			downloadLabel.data(data);
			var pieceHeight = yScale(data.amount);
			var labelHeight = -1;
			var labelBGYPos = -1;
			var labelWidth = -1;
			var downloadLabelBG = d3.select(downloadLabelBGArray[i]);
			if(pieceHeight < smallLabelSize) {
				//just add number
				//console.log("small label");
				var numericLabel = downloadLabel.append('text').text(function(d) {
					return abbreviateNumber(d.amount);
				}).attr('text-anchor','end').attr('alignment-baseline','central')
				.attr('font-size',function(d) {
					return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
				});
				labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
				labelBGYPos = - labelHeight / 2;
				var numericLabelEle = numericLabel[0][0];
				labelWidth = numericLabelEle.getComputedTextLength();
			} else if(pieceHeight < mediumLabelSize || data.type == 'dbd') {
				//number and type
				//console.log('medium label');
				var numericLabel = downloadLabel.append('text').text(function(d) {
					return abbreviateNumber(d.amount);
				}).attr('text-anchor','end').attr('font-size',function(d) {
					return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
				});
				var textLabel = downloadLabel.append('text').text(function(d) {
					return reverseWeaponLookup[d.type].split(' ')[0].toUpperCase();
				}).attr('text-anchor','end').attr('y',15).attr('class',function(d) { return 'download '+d.type});
				labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
				labelBGYPos = -labelHeight;
				labelHeight += 16;
				var numericLabelEle = numericLabel[0][0];
				var textLabelEle = textLabel[0][0];
				labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
			} else {
				//number type and 'weapons'
				//console.log('large label');
				var numericLabel = downloadLabel.append('text').text(function(d) {
					return abbreviateNumber(d.amount);
				}).attr('text-anchor','end').attr('font-size',function(d) {
					return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
				}).attr('y',-7);
				var textLabel = downloadLabel.append('text').text(function(d) {
					return reverseWeaponLookup[d.type].split(' ')[0].toUpperCase();
				}).attr('text-anchor','end').attr('y',8).attr('class',function(d) { return 'download '+d.type});
				var weaponLabel  =downloadLabel.append('text').text('').attr('text-anchor','end').attr('y',21)
					.attr('class',function(d) { return'download '+d.type} );
				labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
				labelBGYPos = -labelHeight - 7;
				labelHeight += 16 +14;
				var numericLabelEle = numericLabel[0][0];
				var textLabelEle = textLabel[0][0];
				var weaponLabelEle = weaponLabel[0][0];
				labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
				if(weaponLabelEle.getComputedTextLength() > labelWidth) {
					labelWidth = weaponLabelEle.getComputedTextLength();
				}
			}
			if(labelHeight != -1 && labelBGYPos != -1 && labelWidth != -1) {
				downloadLabelBG.attr('x',-labelWidth).attr('y',labelBGYPos).attr('width',labelWidth).attr('height',labelHeight)
					.attr('transform',downloadLabel.attr('transform'));
			}
		}
		//upload labels
		var uploadLabelBGs = this.barGraphSVG.selectAll("rect.barGraphLabelBG.uploadBG").data(uploadArray);
		uploadLabelBGs.enter().append('rect').attr('class',function(d) {
			return 'barGraphLabelBG uploadBG ' + d.type; });
		var uploadLabels = this.barGraphSVG.selectAll("g.uploadLabel").data(uploadArray);
		uploadLabels.enter().append("g").attr('class',function(d) {
			return 'uploadLabel '+d.type;
		});
		uploadLabels.attr('transform',function(d) { 
			var translate = 'translate('+(d3Graphs.barGraphWidth / 2 + 35)+",";
			var value = d3Graphs.barGraphHeight - d3Graphs.barGraphBottomPadding - d3Graphs.cumUploadLblY - yScale(d.amount)/2;
			d3Graphs.cumUploadLblY += yScale(d.amount);
			translate += value+")";
			this.previousUploadLabelTranslateY = value;
			return translate;
		}).attr('display',function(d) {
			if(d.amount == 0) { return 'none';}
			return null;
		});
		uploadLabels.selectAll("*").remove();
		var uploadLabelArray = uploadLabels[0];
		var uploadLabelBGArray = uploadLabelBGs[0];
		for(var i = 0; i < uploadLabelArray.length; i++) {
			var uploadLabelE = uploadLabelArray[i];
			var uploadLabel = d3.select(uploadLabelE);
			var data = uploadArray[i];
			uploadLabel.data(data);
			var pieceHeight = yScale(data.amount);
			var labelHeight = -1;
			var labelBGYPos = -1;
			var labelWidth = -1;
			var uploadLabelBG = d3.select(uploadLabelBGArray[i]);
			if(pieceHeight < smallLabelSize) {
				//just add number
				//console.log("small label");
				var numericLabel = uploadLabel.append('text').text(function(d) {
					return abbreviateNumber(d.amount);
				}).attr('text-anchor','start').attr('alignment-baseline','central')
				.attr('font-size',function(d) {
					return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
				});
				labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
				labelBGYPos = - labelHeight / 2;
				var numericLabelEle = numericLabel[0][0];
				labelWidth = numericLabelEle.getComputedTextLength();
			} else if(pieceHeight < mediumLabelSize || data.type == 'dbd') {
				//number and type
				var numericLabel = uploadLabel.append('text').text(function(d) {
					return abbreviateNumber(d.amount);
				}).attr('text-anchor','start').attr('font-size',function(d) {
					return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
				});
				var textLabel = uploadLabel.append('text').text(function(d) {
					return reverseWeaponLookup[d.type].split(' ')[0].toUpperCase();
				}).attr('text-anchor','start').attr('y',15).attr('class',function(d) { return 'upload '+d.type});
				labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
				labelBGYPos = -labelHeight;
				labelHeight += 16;
				var numericLabelEle = numericLabel[0][0];
				var textLabelEle = textLabel[0][0];
				labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
			} else {
				//number type and 'weapons'
				var numericLabel = uploadLabel.append('text').text(function(d) {
					return abbreviateNumber(d.amount);
				}).attr('text-anchor','start').attr('font-size',function(d) {
					return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
				}).attr('y',-7);
				var textLabel = uploadLabel.append('text').text(function(d) {
					return reverseWeaponLookup[d.type].split(' ')[0].toUpperCase();
				}).attr('text-anchor','start').attr('y',8).attr('class',function(d) { return 'upload '+d.type});
				var weaponLabel  =uploadLabel.append('text').text('').attr('text-anchor','start').attr('y',21)
					.attr('class',function(d) { return'upload '+d.type} );
				labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
				labelBGYPos = -labelHeight - 7;
				labelHeight += 16 +14;
				var numericLabelEle = numericLabel[0][0];
				var textLabelEle = textLabel[0][0];
				var weaponLabelEle = weaponLabel[0][0];
				labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
				if(weaponLabelEle.getComputedTextLength() > labelWidth) {
					labelWidth = weaponLabelEle.getComputedTextLength();
				}
			}
			if(labelHeight != -1 && labelBGYPos != -1 && labelWidth != -1) {
				uploadLabelBG.attr('x',0).attr('y',labelBGYPos).attr('width',labelWidth).attr('height',labelHeight)
					.attr('transform',uploadLabel.attr('transform'));
			}
		}
		//over all numeric Total Download/Upload labels
		var downloadsVisible = $("#downloadUploadBtns .downloads .check").not(".inactive").length != 0;
		var uploadsVisible = $("#downloadUploadBtns .uploads .check").not(".inactive").length != 0;
		var downloadTotalLabel = this.barGraphSVG.selectAll('text.totalLabel').data([1]);
		downloadTotalLabel.enter().append('text').attr('x',midX).attr('text-anchor','end')
			.attr('class','totalLabel').attr('y',this.barGraphHeight- this.barGraphBottomPadding + 25);
		downloadTotalLabel.text(abbreviateNumber(downloadTotal)).attr('visibility',downloadsVisible ? "visible":"hidden");
		var uploadTotalLabel = this.barGraphSVG.selectAll('text.totalLabel.totalLabel2').data([1]);
		uploadTotalLabel.enter().append('text').attr('x',midX+10).attr('class','totalLabel totalLabel2').attr('y', this.barGraphHeight - this.barGraphBottomPadding+25);
		uploadTotalLabel.text(abbreviateNumber(uploadTotal)).attr('visibility',uploadsVisible ? "visible":"hidden");
		//Download label at bottom
		var downloadLabel = this.barGraphSVG.selectAll('text.downloadLabel').data([1]);
		downloadLabel.enter().append('text').attr('x',midX).attr('text-anchor','end').text('IN')
			.attr('class','downloadLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding + 45);
		downloadLabel.attr('visibility',downloadsVisible ? "visible":"hidden");
		//Upload label at bottom
		var uploadLabel = this.barGraphSVG.selectAll('text.uploadLabel').data([1]);
		uploadLabel.enter().append('text').attr('x',midX+10).text('OUT')
			.attr('class','uploadLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding + 45);
		uploadLabel.attr('visibility',uploadsVisible ? "visible":"hidden")		
	},
	dragHandleStart: function(event) {
		console.log('start');
		event.dataTransfer.setData('text/uri-list','timeHandle.png');
		event.dataTransfer.setDragImage(document.getElementById('handle'),0,0);
		event.dataTransfer.effectAllowed='move';
	}
}

/*
This is going to be a number formatter. Example of use:

var bigNumber = 57028715;
var formated = abbreviateNumber(57028715);
return formated; //should show 57B for 57 Billion

*/
function abbreviateNumber(value) {
	
	var newValue = value;
	if (value >= 1000) {
		var suffixes = ["", "K", "M", "G","T"];
		var suffixNum = Math.floor( (""+value).length/3 );
		var shortValue = '';
		for (var precision = 3; precision >= 1; precision--) {
			shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
			var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
			if (dotLessShortValue.length <= 3) { break; }
		}
		if (shortValue % 1 != 0)  shortNum = shortValue.toFixed(1);
		newValue = shortValue+suffixes[suffixNum];
	}
	return newValue;
}

