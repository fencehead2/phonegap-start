var main = {
    table: null,
    maxItems: '10',
    suburbOrPostcode: null,
    resultsItems: [],
    resultsView: 'list',
    searchedAddress: null,
    networkConnection: false,
    baseUrl: null,
    clearInput: function () {
        if ($('#search').val() == '' || $('#search').val() == null) {
            _SELF.autoCompleteEvent($('#search'));
        }
    },
    checkNetworkStatus: function (callback) {
        $.ajaxSetup({
            async: true,
            cache: false,
            dataType: "json",
            error: function (req, status, ex) {
                //ToDo: Add!! Only commented for the sake of testing in a dev environment..
                //main.networkConnection = false;
                callback();
            },
            success: function (data, status, req) {
                //ToDo: Add!! Only commented for the sake of testing in a dev environment..
                //main.networkConnection = true;
                callback();
            },
            timeout: 5000,
            type: "GET",
            url: "Scripts/ping.js?" + Date.UTC(2012, 02, 30).toString()
        });
        $.ajax();
        
        //ToDo: Remove!! Only set for the sake of testing in a dev environment..
        main.networkConnection = true;

    },
    showResults: function () {
        var _SELF = this;
        $('#title').html('Results...');
        $('#title').show();
        $('#toggles').show();
        $('#toggles div').removeClass('selected');
        $('#accontainer').hide();
        if (_SELF.resultsView == 'map') {
            $('#mapToggle').addClass('selected');
            $('#rcontainer').hide();
            $('#map').show();
            google.maps.event.trigger(_SELF.map, 'resize');
            _SELF.map.fitBounds(_SELF.mapBounds);
        } else {
            $('#listToggle').addClass('selected');
            $('#map').hide();
            $('#rcontainer').show();
        }
        $('#backToAc').show();
        $('#backToRe').hide();
        $('#detail').hide();
        window.scrollTo(0, 1);
    },
    showAutocomplete: function () {
        $('#title').html('Select Suburb / Postcode...');
        $('#title').show();
        $('#accontainer').show();
        $('#rcontainer').hide();
        $('#map').hide();
        $('#backToAc').hide();
        $('#toggles').hide();
        $('#backToRe').hide();
        $('#detail').hide();
        window.scrollTo(0, 1);
    },
    displayDetail: function (id) {
        var _SELF = this;
        var resultItem = null;
        for (var i = 0; i < _SELF.resultsItems.length; i++) {
            if (_SELF.resultsItems[i].id == id) {
                resultItem = _SELF.resultsItems[i];
            }
        }
        if (resultItem != null) {

            var staticMapHtml = '';
            var directionsBtnHtml = '';

            if (navigator.onLine && main.networkConnection) {
                var smurl = 'http://maps.googleapis.com/maps/api/staticmap?center=' +
                '&zoom=19' +
                '&size=400x200' +
                '&markers=color:red%7C' + resultItem.lon + ',' + resultItem.lat +
                '&sensor=false';
                staticMapHtml = '<img src="' + smurl + '" alt="Map" title="Click to zoom..." />';

                var dirUrl = 'http://maps.google.com/maps?daddr=' + resultItem.lon + ',' + resultItem.lat;
                if (_SELF.searchedAddress != null) {
                    dirUrl += '&saddr=' + _SELF.searchedAddress;
                }
                directionsBtnHtml = '<div><a href="' + dirUrl + '" id="directionsBtn" target="_blank">Get Directions</a></div>';
            }

            var html = '<div><div id="staticMap">' + staticMapHtml + '</div><strong>Name:</strong> ' + resultItem.name + '</div><div><strong>Address:</strong>';
            html += (resultItem.street != '' ? resultItem.street + ' ' : '');
            html += (resultItem.suburb != '' ? resultItem.suburb + ' ' : '');
            html += (resultItem.state != '' ? resultItem.state + ' ' : '');
            html += (resultItem.postcode != '' ? resultItem.postcode : '');
            html += '</div>' + directionsBtnHtml;

            $('#title').html(resultItem.name);
            $('#title').show();
            $('#accontainer').hide();
            $('#rcontainer').hide();
            $('#map').hide();
            $('#toggles').hide();
            $('#backToAc').hide();
            $('#detail').html(html);
            $('#backToRe').show();
            $('#detail').show();

            if (navigator.onLine && main.networkConnection) {
                $('#staticMap').click(function () {
                    _SELF.resultsView = 'map';
                    _SELF.showResults();
                    _SELF.map.setCenter(new google.maps.LatLng(resultItem.lon, resultItem.lat));
                    _SELF.map.setZoom(20);
                });
            }

        }
        window.scrollTo(0, 1);
    },
    displayAutocomplete: function (results, column) {
        var _SELF = this;
        if (results.rows.length > 0) {
            _SELF.showAutocomplete();
            $('#accontainer').html('');
            var list = '<ul id="autocomplete">';
            for (var i = 0; i < results.rows.length; i++) {
                var resultItem = results.rows.item(i)[column.toLowerCase()];
                if (resultItem != null && resultItem != '') {
                    list += '<li class="acItem link" id="' + resultItem.replace(/ /gi, '_') + '">' + resultItem + '</li>';
                }
            }
            list += '</ul>';
            $('#accontainer').append(list);
            _SELF.initAutocompleteResultEvents();
        } else {
            $('#title').hide();
            $('#accontainer').html('<div class="error">Sorry, no results found...</div>');
        }
        $('#loadingIndicator').hide();
        window.scrollTo(0, 1);
    },
    displayResults: function (results) {
        var _SELF = this;
        _SELF.showResults();
        $('#rcontainer').html('');
        var list = '<ul id="results">';
        _SELF.resultsItems = [];
        for (var i = 0; i < results.rows.length; i++) {
            var resultItem = {};
            for (var x = 0; x < Features.data.length; x++) {
                if (Features.data[x].name == _SELF.table) {
                    for (var y = 0; y < Features.data[x].columns.length; y++) {
                        var key = Features.data[x].columns[y].name;
                        var val = results.rows.item(i)[Features.data[x].columns[y].name];
                        resultItem[key.toString()] = val.toString();
                    }
                }
            }
            _SELF.resultsItems.push(resultItem);
            list += '<li class="rItem link" id="' + resultItem.id + '">' + resultItem.name + '</li>';
        }
        list += '</ul>';
        $('#rcontainer').append(list);
        $('.rItem').click(function () {
            _SELF.displayDetail($(this).attr('id'));
            _SELF.resultsView = 'list';
        });

        _SELF.checkNetworkStatus(function () {
            if (navigator.onLine && main.networkConnection) {
                //load google maps
                if (_SELF.map == null) {
                    var s = document.createElement("script");
                    s.type = "text/javascript";
                    s.src = "http://maps.google.com/maps/api/js?v=3&sensor=true&callback=gmap_draw";
                    window.gmap_draw = function () {
                        $.extend(main, {
                            map: null,
                            startZoom: 3,
                            startCentre: new google.maps.LatLng(-25.274398, 133.775136),
                            mapBounds: new google.maps.LatLngBounds(),
                            mapMarkers: []
                        });
                        _SELF.initMap();
                        $('#toggles').show();
                    };
                    $("head").append(s);
                } else {
                    _SELF.initMapMarkers();
                    $('#toggles').show();
                }
            } else {
                $('#mapToggle').hide();
                $('#listToggle').hide();
                $('#map').hide();
            }
        });

        $('#loadingIndicator').hide();
        window.scrollTo(0, 1);
    },
    addMapMarker: function (lat, lon, displayName, id) {
        var _SELF = this;
        var ll = new google.maps.LatLng(lat, lon);
        var marker = new google.maps.Marker({
            position: ll,
            map: _SELF.map,
            title: displayName
        });
        _SELF.mapMarkers.push(marker);
        google.maps.event.addListener(marker, "click", function (e) {
            main.resultsView = 'map';
            main.displayDetail(id);
        });
        _SELF.mapBounds.extend(ll);
    },
    initMapMarkers: function () {
        _SELF.mapBounds = new google.maps.LatLngBounds();
        //remove current markers
        if (_SELF.mapMarkers.length > 0) {
            for (var x = 0; x < _SELF.mapMarkers.length; x++) {
                _SELF.mapMarkers[x].setMap(null);
            }
        }
        //add new markers to map      
        for (var i = 0; i < _SELF.resultsItems.length; i++) {
            _SELF.addMapMarker(_SELF.resultsItems[i].lon, _SELF.resultsItems[i].lat, _SELF.resultsItems[i].name, _SELF.resultsItems[i].id);
        }
        _SELF.map.fitBounds(_SELF.mapBounds);
    },
    initMap: function () {
        var _SELF = this;
        var opt = {
            center: _SELF.startCentre,
            zoom: _SELF.startZoom,
            streetViewControl: false,
            minZoom: 5,
            mapTypeControl: false,
            panControl: false,
            zoomControl: false,
            mapTypeControlOptions: {
                mapTypeIds: [google.maps.MapTypeId.ROADMAP]
            },
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        _SELF.map = new google.maps.Map(document.getElementById('map'), opt);
        $('#map').css('height', (screen.height - 200).toString() + 'px');
        _SELF.initMapMarkers();
    },
    initAutocompleteResultEvents: function () {
        _SELF = this;
        $('#backToAc').click(function () {
            _SELF.showAutocomplete();
        });
        $('.acItem').click(function () {
            main.resultsView = 'list';
            _SELF.searchedAddress = $(this).text();
            _SELF.showResults();
            var q = $(this).attr('id').replace(/_/gi, ' ');
            $('#search').val(q);
            var sql = '';
            if (_SELF.suburbOrPostcode.toLowerCase() == 'suburb') {
                sql = 'Suburb like \"' + q + '\"';
            } else {
                sql = 'Postcode like \"' + q + '\"';
            }
            Features.search(sql, _SELF.table, null, null, null, function (transaction, results) {
                _SELF.displayResults(results);
            });
        });
    },
    autoCompleteEvent: function (state) {
        _SELF = this;
        _SELF.showAutocomplete();
        var q = $(state).val();
        if (q != '') {
            var sql = '';
            var column = '';
            //determine if suburb or postcode
            if (q.match(/^[a-zA-Z ]/)) {
                sql = 'Suburb like \"%' + q + '%\"';
                _SELF.suburbOrPostcode = 'Suburb';
            } else {
                sql = 'Postcode like \"%' + q + '%\"';
                _SELF.suburbOrPostcode = 'Postcode';
            }
            if (sql != '') {
                $('#loadingIndicator').show();
                Features.search(sql, _SELF.table, _SELF.maxItems, _SELF.suburbOrPostcode, true, function (transaction, results) {
                    _SELF.displayAutocomplete(results, _SELF.suburbOrPostcode);
                });
            }
        } else {
            $('#title').hide();
            $('#accontainer').html('');
        }
    },
    initEvents: function () {
        _SELF = this;
        $('#clearSearch').click(function () {
            $('#search').val('');
            $('#search').trigger('keyup');
            $('#search').val('Enter Suburb / Postcode');
            $('#search').addClass('blur');
        });
        $('.title a').click(function () {
            $('#search').val('');
            $('#search').trigger('keyup');
            $('#search').val('Enter Suburb / Postcode');
            $('#search').addClass('blur');
        });
        $('#backToRe').click(function () {
            _SELF.showResults();
        });
        $('#mapToggle').click(function () {
            $('#toggles div').removeClass('selected');
            $(this).addClass('selected');
            $('#rcontainer').hide();
            $('#map').show();
            google.maps.event.trigger(_SELF.map, 'resize');
            _SELF.map.fitBounds(_SELF.mapBounds);
            window.scrollTo(0, 1);
        });
        $('#listToggle').click(function () {
            $('#toggles div').removeClass('selected');
            $(this).addClass('selected');
            $('#map').hide();
            $('#rcontainer').show();
            window.scrollTo(0, 1);
        });
        $('#search').keyup(function () { _SELF.autoCompleteEvent(this); });
        $('#search').blur(function () {
            if ($(this).val() == '') {
                $(this).addClass('blur');
                $(this).val('Enter Suburb / Postcode');
            }
        });
        $('#search').focus(function () {
            if ($(this).val() == 'Enter Suburb / Postcode') {
                $(this).val('');
                $(this).removeClass('blur');
                window.scrollTo(0, 1);
            }
        });
    },
    init: function (extendObject) {
        var _SELF = this;
        if (extendObject != null) {
            $.extend(this, extendObject);
        }
        $().ready(function () {
            if (_SELF.table != null) {
                _SELF.initEvents();
                window.scrollTo(0, 1);
            }
        });
    }
};
