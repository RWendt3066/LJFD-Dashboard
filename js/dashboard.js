//
// JavaScript for Populating LJFD Duty Crew Dashboard
//
var LJFDMembers = {} ;
var LJFDSchedules = {} ;

$(document).ready(function()
{
	/* LOAD LJFD MEMBERS */
	$.getJSON('php/membersLJFD.php5', function(data)
	{
		LJFDMembers = data;

    /* LOAD LJFD SCHEDULES */
		$.getJSON('php/schedulesLJFD.php5', function(data)
		{
			LJFDSchedules = data;

			/* LOAD LJFD DASHBOARD */
      loadDashboard();
    });
  });
});

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                               LOAD DASHBOARD                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

function loadDashboard()
{
  if ( !isMobile.any )
	{
		var d = new Date(),
				h = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), (d.getMinutes() - (d.getMinutes() % 30)) + 32, 0, 0),
        e = h - d;
    window.setTimeout(loadDashboard, e);
		loadBanner ();
		loadOnDuty();
		loadUpcoming();
    loadEvents();
	}
	else
	{
		notificationCnt=0;
		loadBanner ();
		loadOnDuty();
		loadUpcoming();
    loadEvents();
	}
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                          LOAD UPCOMING STAFF                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

function loadUpcoming()
{
  $.getJSON("php/upcomingLJFD.php5", function(results)
	{
		var i = 0 ;
		var resource = new Array () ;
    var upComing ;
		moment.tz.setDefault("America/Chicago") ;

		/* GET ACCESS TIME */
		tempAccess = results["@attributes"].accessTime ;
		strAccess = tempAccess.substr(0,10) + ' ' + tempAccess.substr(11,5) ;
		shiftAccess = moment.tz(strAccess,'UTC') ;
		shiftAccess.tz('America/Chicago') ;
		accessTime = shiftAccess.format('HH:mm') ;

		/////////////////////////////////////////////////////////////
		///  Cleanup JSON Structure and Assign Values  //////////////
		/////////////////////////////////////////////////////////////

		/* TRAVERSE THROUGH UPCOMING SCHEDULES */
		$.each(results.ranges.range,  function(key,range)
		{

			upComing = '{' ;

			/* IDENTIFY STATION BEING STAFFED */
			switch ( range.schedule["@attributes"].id )
			{
			  case '13' :
				case '15' :
				case '2' :
				    stationSchedule = '120' ;
					break ;
				case '1' :
				case '16' :
				case '3' :
				    stationSchedule = '140' ;
					break ;
				case '14' :
				    stationSchedule = 'DC' ;
					break ;
				default :
				    stationSchedule = 'UNK' ;
			}
			upComing = upComing + '"upComingStation" : "' + stationSchedule + '",' ;

			/* GET START TIME */
			tempBegin = range.begin ;
			strBegin = tempBegin.substr(0,10) + ' ' + tempBegin.substr(11,5) ;
			shiftBegin = moment.tz(strBegin,'UTC') ;
			shiftBegin.tz('America/Chicago') ;
			upComing = upComing + '"shift" : "' + shiftBegin.format('YYYY-MM-DD HH:mm') + '",' ;
			upComing = upComing + '"shiftTime" : "' + shiftBegin.format('HH:mm') + '-' ;

			/* GET END TIME */
			tempEnd = range.end ;
			strEnd = tempEnd.substr(0,10) + ' ' + tempEnd.substr(11,5) ;
			shiftEnd = moment.tz(strEnd,'UTC') ;
			shiftEnd.tz('America/Chicago') ;
			upComing = upComing + shiftEnd.format('HH:mm') + '",' ;

			/* IDENTIFY POSITION BEING STAFFED */
			$.each(LJFDSchedules.schedules.schedule, function(key,schedule)
			{
			    if ( schedule["@attributes"].id == range.schedule["@attributes"].id )
				{
				    $.each(schedule.positions.position, function(key,position)
					{
					    if ( position["@attributes"].id == range.position["@attributes"].id )
						{
						    switch ( position.name )
							{
							    case 'Officer' :
								    upComing = upComing + '"order" : "0",' ;
									break ;
							    case 'Lead FF' :
								    upComing = upComing + '"order" : "1",' ;
									break ;
							    case 'FF/Operator' :
								    upComing = upComing + '"order" : "2",' ;
									break ;
							    case 'FF' :
								    upComing = upComing + '"order" : "3",' ;
									break ;
							    case 'Probationary FF' :
								    upComing = upComing + '"order" : "4",' ;
									break ;
							    default :
								    upComing = upComing + '"order" : "5",' ;
									break ;
							}
							upComing = upComing + '"position" : "' + position.name + '",' ;
							return false;
						}
					});
					return false;
				}
			});

			/* IDENTIFY MEMBER AND EMS LEVEL */
			$.each(LJFDMembers.members.member, function(key, member)
    		{
        	    if ( range.member["@attributes"].id == member["@attributes"].id )
	    		{
	        	    upComing = upComing + '"name" : "' + member.name + '",'  ;
		    		upComing = upComing + '"ems" : "' + member.attributes.attribute[3].value + '"' ;
					return false;
	    		}
    		});

		    upComing = upComing + '}' ;
			resource[i] = upComing ;
			i = i + 1 ;

		});

		/////////////////////////////////////////////////////////////
		///  Organize Data for Display  /////////////////////////////
		/////////////////////////////////////////////////////////////

		resource.sort() ;
		var upComingJSON = '{ "upComingStaff" : [' ;
		for ( i=0; i<resource.length; i++ )
		{
		    if ( i>0 )
			{
			    upComingJSON = upComingJSON + ',' ;
		    }
			upComingJSON = upComingJSON + resource[i];

		}
		upComingJSON = upComingJSON + ']}' ;
		var upComingObj = JSON.parse(upComingJSON) ;

		/////////////////////////////////////////////////////////////
		///  Display Updoming Staff on Dashboard  ///////////////////
		/////////////////////////////////////////////////////////////

		var stationList='NONE' ;
		var shiftTitle ;
		var shiftTitlePrev='FIRST SHIFT' ;
		var shiftStartPrev='FIRST SHIFT' ;
		var shiftCounter=0 ;

		$.each(upComingObj.upComingStaff, function(key,upComingStaff)
		{
			startTime = upComingStaff.shiftTime.substring(0,5) ;
			endTime = upComingStaff.shiftTime.substring(6) ;
			startHour = upComingStaff.shiftTime.substring(0,2) ;

			/* IDENTIFY SHIFT TITLE */
			if ( startTime != accessTime )
			{
				if (( endTime.substring(3) == '00' ) || ( endTime.substring(3) == '30' ))
				{
					upcomingRow = '<div class="col-xs-4 Position">' + upComingStaff.position + '</div>' ;
					upcomingRow = upcomingRow + '<div class="col-xs-5 Name">' + upComingStaff.name + '</div>' ;
					upcomingRow = upcomingRow + '<div class="col-xs-3 Rank">' + upComingStaff.shiftTime + '</div>' ;
					upcomingRow = upcomingRow + '</div>' ;
					if ( (upComingStaff.upComingStation != stationList) && ((upComingStaff.upComingStation == '120') || (upComingStaff.upComingStation == '140')) )
					{
						stationList = upComingStaff.upComingStation;
						shiftCounter = 0;
						shiftTitlePrev = 'FIRST SHIFT' ;
						shiftStartPrev = startTime ;
						$(".upcoming"+stationList).html('<div class="row scheduleRow">' + upcomingRow);
					}
					else
					{
						if (shiftStartPrev != startTime)
						{
							$(".upcoming"+stationList).append('<div class="row scheduleRow blueBreak">' + upcomingRow);
							shiftStartPrev = startTime ;
						}
						else
						{
							$(".upcoming"+stationList).append('<div class="row scheduleRow">' + upcomingRow);
							shiftStartPrev = startTime ;
						}
					}
				}
			}

		});
	});
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                           LOAD ON DUTY STAFF                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

function loadOnDuty()
{
	$.getJSON("php/onDutyLJFD.php5", function(results)
	{
		var i = 0 ;
		var resource = new Array () ;
    var onDuty ;
		var header120OnDuty = 0 ;
		var header140OnDuty = 0 ;
		var headerDCOnDuty = 0 ;

		/////////////////////////////////////////////////////////////
		///  Cleanup JSON Structure and Assign Values  //////////////
		/////////////////////////////////////////////////////////////

		/* TRAVERSE THROUGH ON DUTY SCHEDULES */
		$.each(results.ranges.range,  function(key,range)
		{
			onDuty = '{' ;

			/* IDENTIFY SCHEDULED STATION AND POSITION ON DUTY */
			$.each(LJFDSchedules.schedules.schedule, function(key,schedule)
			{
			  if ( schedule["@attributes"].id == range.schedule["@attributes"].id )
				{
					/* IDENTIFY STATION BEING STAFFED */
					switch ( range.schedule["@attributes"].id )
					{
					  case '13' :
						case '15' :
						case '2' :
								stationSchedule = '120' ;
							break ;
						case '1' :
						case '16' :
						case '3' :
						    stationSchedule = '140' ;
							break ;
						case '14' :
						    stationSchedule = 'DC' ;
							break ;
						default :
						    stationSchedule = 'UNK' ;
					}
					onDuty = onDuty + '"onDutyStation" : "' + stationSchedule + '",' ;

				  $.each(schedule.positions.position, function(key,position)
					{
					  if ( position["@attributes"].id == range.position["@attributes"].id )
						{
							/* IDENTIFY POSITION BEING STAFFED */
						  switch ( position.name )
							{
							  case 'Officer' :
								    onDuty = onDuty + '"order" : "0",' ;
									break ;
							  case 'Lead FF' :
								    onDuty = onDuty + '"order" : "1",' ;
									break ;
							  case 'FF/Operator' :
								    onDuty = onDuty + '"order" : "2",' ;
									break ;
							  case 'FF' :
								    onDuty = onDuty + '"order" : "3",' ;
									break ;
							  case 'Probationary FF' :
								    onDuty = onDuty + '"order" : "4",' ;
									break ;
							  default :
								    onDuty = onDuty + '"order" : "5",' ;
									break ;
							}
							onDuty = onDuty + '"position" : "' + position.name + '",' ;
							return false;
						}
					});
					return false;
				}
			});

			/* IDENTIFY MEMBER NAME AND EMS LEVEL */
			$.each(LJFDMembers.members.member, function(key, member)
    		{
        	if ( range.member["@attributes"].id == member["@attributes"].id )
	    		{
	        	onDuty = onDuty + '"name" : "' + member.name + '",'  ;
		    		onDuty = onDuty + '"ems" : "' + member.attributes.attribute[3].value + '"' ;
						return false;
	    		}
    		});

		  onDuty = onDuty + '}' ;
			resource[i] = onDuty ;
			i = i + 1 ;
		});

		/////////////////////////////////////////////////////////////
		///  Organize Data for Display  /////////////////////////////
		/////////////////////////////////////////////////////////////

		resource.sort() ;

		var onDutyJSON = '{ "onDutyNow" : [' ;
		for ( i=0; i<resource.length; i++ )
		{
		    if ( i>0 )
			{
			    onDutyJSON = onDutyJSON + ',' ;
		    }
			onDutyJSON = onDutyJSON + resource[i];
		}
		onDutyJSON = onDutyJSON + ']}' ;

		var onDutyObj = JSON.parse(onDutyJSON) ;

		/////////////////////////////////////////////////////////////
		///  Display On Duty Staff on Dashboard  ////////////////////
		/////////////////////////////////////////////////////////////

		$.each(onDutyObj.onDutyNow, function(key,onDutyNow)
		{
			onDutyRow = '<div class="row scheduleRowOD">' ;
			onDutyRow = onDutyRow + '<div class="col-xs-4 Position PositionOD">' + onDutyNow.position + '</div>' ;
			onDutyRow = onDutyRow + '<div class="col-xs-5 Name NameOD">' + onDutyNow.name + '</div>' ;
			onDutyRow = onDutyRow + '<div class="col-xs-3 Rank RankOD">' + onDutyNow.ems + '</div>' ;
			onDutyRow = onDutyRow + '</div>' ;
			switch (onDutyNow.onDutyStation)
			{
				case "120":  // DISPLAY STATION 120 STAFF
					if ( header120OnDuty == 0 )
					{
						header120OnDuty = header120OnDuty + 1 ;
						$(".onDuty120").html(onDutyRow);
					}
					else
					{
						$(".onDuty120").append(onDutyRow);
					}
					break;
				case "140":  // DISPLAY STATION 140 STAFF
					if ( header140OnDuty == 0 )
					{
						header140OnDuty = header140OnDuty + 1 ;
						$(".onDuty140").html(onDutyRow);
					}
					else
					{
						$(".onDuty140").append(onDutyRow);
					}
					break;
				case "DC":  // DISPLAY DUTY CHIEF
					if ( headerDCOnDuty == 0 )
					{
						headerDCOnDuty = headerDCOnDuty + 1 ;
					}
					$(".onDutyDC").html('<div class="TitleDC">DUTY CHIEF</div>');
					$(".onDutyDC").append('<div class="NameDC">' + onDutyNow.name + '</div>');
					break;
				default:
			}
		});

		/////////////////////////////////////////////////////////////
		///  Reset and Display No Staff Warnings  ///////////////////
		/////////////////////////////////////////////////////////////

		if (header120OnDuty > 0)
		{
			header120OnDuty=0;
		}
		else
		{
			$(".onDuty120").html('<div class="row scheduleRowOD"><div class="col-xs-6 Name NameOD">Not Staffed!!</div></div>')
		}
		if (header140OnDuty > 0)
		{
			header140OnDuty=0;
		}
		else
		{
			$(".onDuty140").html('<div class="row scheduleRowOD"><div class="col-xs-6 Name NameOD">Not Staffed!!</div></div>')
		}
		if (headerDCOnDuty > 0)
		{
			headerDCOnDuty=0;
		}
		else
		{
			$(".onDutyDC").html('<p class="TitleDC">DUTY CHIEF</p><p class="NameDC">Not Staffed!!</p>');
		}

	});
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                            LOAD EVENTS TABLE                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
function displayEvent (selectedEvent)
{
	switch (selectedEvent.order)
	{
		case "0": // STATION 120 TASKS
			st120Task = '<div class="col-xs-2 Position PositionOD">TASK</div>' ;
			st120Task = st120Task + '<div class="col-xs-10 eventDesc eventDescOD">' + selectedEvent.eventDescription + '</div></div>' ;
			if (pr120Cnt == 0)
			{
				pr120Cnt = pr120Cnt + 1;
				st120Task = '<div class="row scheduleRowOD redBreak">' + st120Task;
				$(".activities120").html(st120Task);
			}
			else
			{
				pr120Cnt = pr120Cnt + 1;
				st120Task = '<div class="row scheduleRowOD">' + st120Task;
				$(".activities120").append(st120Task);
			}
			break;
		case "1": // STATION 140 TASKS
			st140Task = '<div class="col-xs-2 Position PositionOD">TASK</div>' ;
			st140Task = st140Task + '<div class="col-xs-10 eventDesc eventDescOD">' + selectedEvent.eventDescription + '</div></div>' ;
			if (pr140Cnt == 0)
			{
				pr140Cnt = pr140Cnt + 1;
				st140Task = '<div class="row scheduleRowOD redBreak">' + st140Task;
				$(".activities140").html(st140Task);
			}
			else
			{
				pr140Cnt = pr140Cnt + 1;
				st140Task = '<div class="row scheduleRowOD">' + st140Task;
				$(".activities140").append(st140Task);
			}
			break;
		case "2": // INFORMATION CENTER
		  icNotice = '<div class="row scheduleRowIC">';
			icNotice = icNotice + '<div class="col-xs-3 Position">' + selectedEvent.eventTime + '</div>';
			icNotice = icNotice + '<div class="col-xs-9 Position">' + selectedEvent.eventDescription + '</div>';
			icNotice = icNotice + '</div>';
			if (notificationCnt == 0)
			{
				notificationCnt = notificationCnt + 1;
				$(".notification").html(icNotice);
			}
			else
			{
				notificationCnt = notificationCnt + 1;
				$(".notification").append(icNotice);
			}
			break;
		case "3": // PR Event
			switch (selectedEvent.prCoverage)
			{
				case '120':
						st120PR = '<div class="col-xs-8 Position PositionOD">' +  selectedEvent.eventLocation + '</div>';
						st120PR = st120PR + '<div class="col-xs-4 eventTime eventTimeOD">' + selectedEvent.eventTime + '</div>';
						st120PR = st120PR + '</div>';
						st120PR = st120PR + '<div class="row scheduleRowBottomOD">';
						st120PR = st120PR + '<div class="col-xs-12 eventDesc eventDescOD">' + selectedEvent.eventDescription + '</div>';
						st120PR = st120PR + '</div>';
						if (pr120Cnt == 0)
						{
							pr120Cnt = pr120Cnt + 1;
							st120PR = '<div class="row scheduleRowTopOD redBreak">' + st120PR
							$(".activities120").html(st120PR);
						}
						else
						{
							pr120Cnt = pr120Cnt + 1;
							st120PR = '<div class="row scheduleRowTopOD">' + st120PR
							$(".activities120").append(st120PR);
						}
					break;
				case '140':
						st140PR = '<div class="col-xs-8 Position PositionOD">' +  selectedEvent.eventLocation + '</div>';
						st140PR = st140PR + '<div class="col-xs-4 eventTime eventTimeOD">' + selectedEvent.eventTime + '</div>';
						st140PR = st140PR + '</div>';
						st140PR = st140PR + '<div class="row scheduleRowBottomOD">';
						st140PR = st140PR + '<div class="col-xs-12 eventDesc eventDescOD">' + selectedEvent.eventDescription + '</div>';
						st140PR = st140PR + '</div>';
						if (pr140Cnt == 0)
						{
							pr140Cnt = pr140Cnt + 1;
							st140PR = '<div class="row scheduleRowTopOD redBreak">' + st140PR
							$(".activities140").html(st140PR);
						}
						else
						{
							pr140Cnt = pr140Cnt + 1;
							st140PR = '<div class="row scheduleRowTopOD">' + st140PR
							$(".activities140").append(st140PR);
						}
					break;
				default:
						icNotice = '<div class="row scheduleRowTop">';
						icNotice = icNotice + '<div class="col-xs-3 Position">PR Event</div>';
						icNotice = icNotice + '<div class="col-xs-9 Position">' +  selectedEvent.eventLocation + '</div>';
						icNotice = icNotice + '</div>';
						icNotice = icNotice + '<div class="row scheduleRowBottom">';
						icNotice = icNotice + '<div class="col-xs-3 Position">' + selectedEvent.eventTime + '</div>';
						icNotice = icNotice + '<div class="col-xs-9 Position">' + selectedEvent.eventDescription + '</div>';
						icNotice = icNotice + '</div>';
						if (notificationCnt == 0)
						{
							notificationCnt = notificationCnt + 1;
							$(".notification").html(icNotice);
						}
						else
						{
							notificationCnt = notificationCnt + 1;
							$(".notification").append(icNotice);
						}
			}
	}
}

function loadEvents ()
{
	$.getJSON("php/eventsToday.php5", function(results)
	{
		pr120Cnt=0;
		pr140Cnt=0;
		notificationCnt = 0;
		if (results.event.length)
		{
			$.each(results.event, function(key, event)
			{
				displayEvent(event);
			});
		}
		else
		{
			if (results.event.order)
			{
				displayEvent(results.event);
			}
		}
		if (pr120Cnt > 0)
		{
			pr120Cnt=0;
		}
		else
		{
			$(".activities120").html('<div class="row scheduleRowOD redBreak"><div class="col-xs-12 Name NameOD">No Scheduled Activities</div></div>');
		}
		if (pr140Cnt > 0)
		{
			pr140Cnt=0;
		}
		else
		{
			$(".activities140").html('<div class="row scheduleRowOD redBreak"><div class="col-xs-12 Name NameOD">No Scheduled Activities</div></div>');
		}
		if (notificationCnt > 0)
		{
			notificationCnt = 0;
		}
		else
		{
			$(".notification").html('<div class="row scheduleRow"><div class="col-xs-12 Name">No Information to Report</div></div>');
		}
  });
}

function loadBanner ()
{
	$.getJSON('http://api.wunderground.com/api/a591dbd544b9dcee/conditions/forecast/q/55126.json',
			function(data)
			{
				var dateNow = new Date();
				var hours = dateNow.getHours();
			  var minutes = dateNow.getMinutes();
				var currTemp = data.current_observation.temp_f;
				var feelsLike = data.current_observation.feelslike_f;
				var flNoDec = feelsLike.length - 2;
				var weather = data.current_observation.weather;
				var highTemp = data.forecast.simpleforecast.forecastday[0].high.fahrenheit;
				var lowTemp = data.forecast.simpleforecast.forecastday[0].low.fahrenheit;
				var forecastTxt = data.forecast.txt_forecast.forecastday[0].fctext;

				shift = 'NIGHT SHIFT';
				if (hours < 22)
				{
					shift = 'EVENING SHIFT';
					if (hours < 17)
					{
						shift = 'DAY SHIFT';
						if (((hours == 6) && (minutes < 30)) || (hours < 6))
						{
							shift = 'NIGHT SHIFT';
						}
					}
				}
				shiftTitle = '<div class="shiftLabel">' + shift + '</div>'

				forecast3day = '<div class="row forecastTemp">' + data.forecast.simpleforecast.forecastday[1].date.weekday;
				forecast3day = forecast3day + ' <img class="forecastCondIcon" src=' + data.forecast.simpleforecast.forecastday[1].icon_url + '>';
				forecast3day = forecast3day + ' ' + data.forecast.simpleforecast.forecastday[1].high.fahrenheit;
				forecast3day = forecast3day + ' | ' + data.forecast.simpleforecast.forecastday[1].low.fahrenheit;
				forecast3day = forecast3day + '</div>';
				forecast3day = forecast3day + '<div class="row forecastTemp">' + data.forecast.simpleforecast.forecastday[2].date.weekday;
				forecast3day = forecast3day + ' <img class="forecastCondIcon" src=' + data.forecast.simpleforecast.forecastday[2].icon_url + '>';
				forecast3day = forecast3day + ' ' + data.forecast.simpleforecast.forecastday[2].high.fahrenheit;
				forecast3day = forecast3day + ' | ' + data.forecast.simpleforecast.forecastday[2].low.fahrenheit;
				forecast3day = forecast3day + '</div>';
				forecast3day = forecast3day + '<div class="row forecastTemp">' + data.forecast.simpleforecast.forecastday[3].date.weekday;
				forecast3day = forecast3day + ' <img class="forecastCondIcon" src=' + data.forecast.simpleforecast.forecastday[3].icon_url + '>';
				forecast3day = forecast3day + ' ' + data.forecast.simpleforecast.forecastday[3].high.fahrenheit;
				forecast3day = forecast3day + ' | ' + data.forecast.simpleforecast.forecastday[3].low.fahrenheit;
				forecast3day = forecast3day + '</div>';

				condTemp = '<div class="row">';
				condTemp = condTemp + '<img class="weatherCondIcon" src=' + data.current_observation.icon_url + '>';
				condTemp = condTemp + '&nbsp&nbsp<span class="weatherTemp">' + currTemp.toFixed(0) + '<span class="fahrenheitSS">&#x2109;</span></span>';
				condTemp = condTemp + '</div>';

				weatherTempRange = '<div class="row wtrTop">' + weather + '</div>';
				weatherTempRange = weatherTempRange + '<div class="row wtrBottom">' + highTemp + '<span class="fahrenheitFCSS">&#x2109;</span> | ' + lowTemp + '<span class="fahrenheitFCSS">&#x2109;</span></div>'

				$('.shiftTitleBlock').html(shiftTitle);
				$('.conditions').html(condTemp);
				$('.tempRange').html(weatherTempRange);
				$('.forecast').html(forecast3day);
				$('.wuLogo').html('<img class="weatherLogo" src=https://www.wunderground.com/logos/images/wundergroundLogo_4c_rev.jpg>');

				icNotice = '<div class="row scheduleRowIC">';
				icNotice = icNotice + '<div class="col-xs-3 Position">Forecast</div>';
				icNotice = icNotice + '<div class="col-xs-9 Position">' + data.forecast.txt_forecast.forecastday[0].fcttext + '</div>';
				icNotice = icNotice + '</div>';
				$(".icForecast").html(icNotice);

			});
}
