
(function(){
	Array.prototype.contains = function(obj) {
	    var i = this.length;
	    while (i--) {
	        if (this[i] === obj) {
	            return true;
	        }
	    }
	    return false;
	}

	console.log('nope');
	$(".listing_sfm").remove(); //delete ads
	$('body').append('<div id="newResults" class="c-newResults"></div>');
	$('#spareroom').children().wrap("<div class='u-hide'>");		
	var lists = [];
	var nextPageLink;

	var rooms = [];
	var imagesLoaded = 0;
	var hiddenRooms = [];
	var pages = 4;


	showLoader();
	loadLocalStorage();
	getPages(pages, setRooms);


	function showLoader(){
		$("#spareroom").css("visibility", "visible");
		$("#spareroom").prepend('<div id="loader" class="c-loader__wrap">\
				<svg class="circular">\
    				<circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/>\
  				</svg></div>');
	}

	function getPages(pages, cb){
		var count = 0;
		var nextLink = $(".navnext").find("a")[0].href;
		var searchItems = $('.listing-results li');
		lists.push(searchItems);
		count++;

		function _getPage(link, cb){
			count++;
			$.get(link, function(data) {	
				$(data).find(".listing_sfm").remove();	
				var items = $(data).find('.listing-results li');
				lists.push(items);

				if(count == pages){
					nextPageLink = $(data).find(".navnext").find("a")[0].href;
					cb();					
				} else{ //recursivley call function
					if($(data).find(".navnext").find("a").length){
						var nextLink = $(data).find(".navnext").find("a")[0].href;
					} else{
						var nextLink = '';
					}
					_getPage(nextLink, cb);
				}

			});
		}

		_getPage(nextLink, cb);
	}

	function saveLocalStorage(){
		localStorage.setItem( 'hiddenRooms', JSON.stringify(hiddenRooms));
	}

	function loadLocalStorage(){
		var data =  JSON.parse( localStorage.getItem( 'hiddenRooms' ) );
		if(data){
			hiddenRooms = data;
		}
	}


	$(document).on('click', '.c-hideButton', function(){
		var id = $(this).data('id');
		if($(this).html().trim() === 'show'){
			$('#'+id).removeClass('c-hiddenResult').removeClass('u-hidden');
			hiddenRooms.splice(hiddenRooms.indexOf(id), 1);
			$(this).html('hide');
		}else{
			hiddenRooms.push(id);
			$('#'+id).addClass('c-hiddenResult').addClass('u-hidden');
			$(this).html("show");
		}
		
		saveLocalStorage();
	});


	$(document).on('click', "#showHidden", function(){
		$(".c-hiddenResult").toggleClass('u-showHidden');
	});

	$(document).on("change", "#perPage", function(){
		showLoader();
		rooms = [];
		lists = [];
		$("#newResults")[0].innerHTML = '';
		pages = parseInt($(this).find(":selected").html()) / 10;
		getPages(pages, setRooms);
	});

	function setRooms(){
		lists.forEach(function(searchItems){

			searchItems.each(function(i){
				if(!$(this).hasClass("listing_sfm")){
					var room = {};
					var typeLocation = $(this).find('h1')[0].innerHTML.trim().split(',');

					room.title = $(this).find('h2').find("a")[0].innerHTML.trim();
					room.link = 'http://www.spareroom.co.uk'+$(this).find('a').attr('href');
					room.area = typeLocation[1].trim();
					room.available = $(this).find('.description').find('em:first-child')[0].innerHTML.trim();
					room.type = typeLocation[0].trim();
					room.pricing = $(this).find('strong')[0].innerHTML.trim();
					room.summary = $(this).find('.listing-results-content').find('p')[0].innerHTML.trim();
					room.imgs = [];
					room.hidden = false;
					room.newness = false;
					room.id;

					if($(this).find('article').hasClass('listing-free')){
						room.listingType = 'early';
					}

					if($(this).find('article').hasClass('listing-bold')){
						room.listingType = 'normal';
					}

					if($(this).find('article').hasClass('listing-featured')){
						room.listingType = 'featured';
					}

					if($(this).find('.listing-price').html().toLowerCase() === 'bills inc.'){
						room.billsIncluded = 'true';						
					} 

					if($(this).find(".new-today").length){
						room.newness = "New Today ";
					}

					if($(this).find(".new").length){
						room.newness = "New ";
					}


					getImages(room, function(){				
						showItems();
						$("#loader").remove();
					})

					rooms.push(room);
				}				
			});
		});
	}


	function getImages(room, callback){
		$.get(room.link, function(data) {			
	   		var photoElm = $(data).find('.photos');

	   		if(!$(data).find(".no_image_uploaded").length){
		   		var imgs = photoElm.find('a');
		   		imgs.each(function(){
		   			room.imgs.push($(this).attr('href'));
		   		});
	   		}

	   		var id;	   		
	   		if($(data).find('#listing_ref').children().length){
	   			id = parseInt($(data).find('#listing_ref').children().html().trim().split("ref#").pop().trim());	
	   		} else{
	   			id = parseInt($(data).find('#listing_ref').html().trim().split("ref#").pop().trim());	 
	   		}	   		
	   		room.id = id;

	   		
	   		if(hiddenRooms.contains(room.id)){
	   			//console.log(room.id, hiddenRooms);
	   			room.hidden = true;
	   		}
	   		callback();
		});
	}


	var resultsHeader = _.template('\
		<div id="newResultsHeader" class="c-newResults__header">\
			<h1 class="c-resultsHeader__title"><%= query %></h1>\
			<div class="c-resultsHeader__options">\
				<div><label for="perPage">Results Per Page:</label> <select id="perPage"><option id="option-2" value="2">20</option><option id="option-4" selected value="4">40</option><option id="option-8" value="8">80</option><option id="option-16" value="16">160</option></select></div>\
				<span class="resultCount">Results <%= countFrom %> to <%= countTo %>  (<%= hiddenCount %> results hidden)</span>\
				<div><input type="checkbox" id="showHidden" /> <label for="showHidden" class="c-checkbox__label">Show Hidden</label></div>\
			</div>\
		</div>');

	var resultsTemplate = _.template('\
		<div id="<%= id %>" class="c-result c-result--<%= resultType %> <%= hidden %>">\
			<div class="c-area"><span class="c-new"><%= newness %></span><%= area %> <button class="c-hideButton" data-id="<%= id %>""><%= hideText %></button></div>\
			<header class="c-result__header">\
				<div class="c-infoPane">\
					<div class="c-resultBody">\
						<div class="c-resultBody__section">\
							<h1 class="c-title"><%= title %></h1>\
							<p class="c-summary">\
								<%= summary %>\
							</p>\
						</div>\
						<div class="c-resultBody__section">\
							<b class="c-type"><%= roomType %></b>\
							<strong class="c-price"><%= price %></strong>\
							<%= bills %>\
							<a class="c-view o-linkButton" href="<%= link %>" target="_blank">View</a>\
						</div>\
					</div>\
				</div>\
				<%= leadImage %>\
			</header>\
			<div class="c-photos">\
				<%= images %>\
			</div>\
		</div>');

	function showHeader(elm, hiddenCount){
		var countFrom = parseInt($("#results_header").find("strong")[0].innerHTML.split("-")[0]);
		var countTo = (pages * 10) + countFrom - 1;

		var rh = resultsHeader({
			countFrom: countFrom,
			countTo: countTo,
			hiddenCount: hiddenCount,
			query: $("#mainheader").find("h1")[0].innerHTML
		});
		elm.prepend(rh);

		var sort = $(".sort_by");
		//$("#newResultsHeader").append(sort);
		//$("#perPage").val([]);

		document.getElementById('perPage').value=pages;
	}

	function showItems(){
		var newResults = $("#newResults");
		newResults[0].innerHTML = '';
		


		rooms.forEach(function(room){
			var leadImage;
			var images = "";
			
			room.imgs.forEach(function(img, i){
				var image = //'<div class="u-flexPhoto">
					'<img src="'+img+'" class="o-image c-result__image" width="auto" height="200" />';
					//</div>';
					if(i == 0){ //main image
						leadImage = image;
					} else{
						images += image;		
					}				
			});
			var bills = '';
			if(room.billsIncluded){
				bills = "<span class='c-bills'>Bills inc.</span>";
			}

			var hidden = '';
			var hideText = 'hide';
			if(room.hidden){
				
				hidden = "c-hiddenResult u-hidden";
				hideText = 'show';
			}

			var tempy = resultsTemplate({
				title: room.title,
				area: room.area,
				link: room.link,
				summary: room.summary,
				price: room.pricing,
				roomType: room.type,
				resultType: room.listingType,
				leadImage: leadImage,
				images: images,
				bills: bills,
				newness: room.newness,
				id: room.id,
				roomid: room.id,
				hidden: hidden,
				hideText: hideText,
			});
					
			newResults.append(tempy);
		});

		
		showHeader(newResults, $(".c-hiddenResult").length);
		
		var nextButton = '<a href="'+nextPageLink+'" class="c-pagination__next o-linkButton">Next Page</a>';
		newResults.append(nextButton);
		$('#spareroom').prepend(newResults);



		imageClasses();

	}


	function imageClasses(){
		var loaded = 0;
		var imageCount = $(".o-image").length;

		$(".o-image").load(function() {
	    	var w = $(this).width();
	    	$(this)[0].setAttribute('width', w);

			var h = $(this).height();
			if(w > h){
				$(this).parent().addClass('u-landscapeImage');
			} else{
				$(this).parent().addClass('u-portraitImage');
			}

			$(this).attr('img-loaded');
			
		});
	}


	//RUN once AFTER ALL IMAGES HAVE BEEN FULL LOADED
	function resizeImages(){
		$(".c-photos").each(function(){
			var images = $(this).children();
			var totalW = 0;
			//var containerW = $(this).width();
//			var conversion = 0;
			
			images.each(function(){
				totalW+= $(this).width();
			});
			
				
			images.each(function(){
				//set width to cenverions * total widht;
				//height ==== auto;
				var newWidth = $(this).width() / totalW * 100;
				newWidth+="%";
				$(this)[0].setAttribute('height', 'auto');
				$(this).height('auto');
				$(this).width(newWidth);
			});
		});
	}



})();