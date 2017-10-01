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
				h = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), (d.getMinutes() - (d.getMinutes() % 30)) + 30, 0, 0),
        e = h - d;
    window.setTimeout(loadDashboard, e);
		loadOnDuty();
		loadUpcoming();
    loadEvents();
//    loadUpcoming('120');
//    loadUpcoming('140');
	}
	else
	{
		loadOnDuty();
		loadUpcoming();
    loadEvents();
//    loadUpcoming('120');
//    loadUpcoming('140');
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
		moment.tz.setDefault("UTC") ;
		var now = moment() ;
		var now24 = moment().add(24,'h') ;
		var currentBT = moment(now).format("YYYY-MM-DD") + 'T' + moment(now).format("HH:mm") + ':00Z' ;
		var currentET = moment(now24).format("YYYY-MM-DD") + 'T' + moment(now24).format("HH:mm") + ':10Z' ;
		moment.tz.setDefault("America/Chicago") ;


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
		///  Display Updoming Staff on Dashboard  ////////////////////
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

			if ( (upComingStaff.upComingStation != stationList) && ((upComingStaff.upComingStation == '120') || (upComingStaff.upComingStation == '140')) )
			{
				stationList = upComingStaff.upComingStation;
				shiftCounter = 0;
				shiftTitlePrev = 'FIRST SHIFT' ;
				shiftStartPrev = startTime ;
				currentTime = upComingStaff.shiftTime.substring(0,5) ;
				$(".upcoming"+stationList).html('<tr class="scheduleRow">');
			}
			else
			{
				if (shiftStartPrev != startTime)
				{
					$(".upcoming"+stationList).append('<tr class="cheduleRow blueBreak">');
					shiftStartPrev = startTime ;
				}
				else
				{
					$(".upcoming"+stationList).append('<tr class="scheduleRow">');
					shiftStartPrev = startTime ;
				}
			}

			/* DISPLAY SHIFT TITLE */

			if (( startTime == currentTime ) || (( endTime.substring(3) != '00' ) && ( endTime.substring(3) != '30' )))
			{
			   shiftTitle = 'UNKNOWN' ;
			}
			else
			{
			   if ( startHour >= '06' )
			   {
			      shiftTitle = 'NIGHT SHIFT' ;
			      if ( startHour < '22' )
			      {
			         shiftTitle = 'EVENING SHIFT' ;
			      }
			      if ( startHour < '12' )
			      {
			         shiftTitle = 'DAY SHIFT' ;
			      }
			   }
			}

			if ( shiftTitle != 'UNKNOWN' )
			{
						if ( shiftTitle != shiftTitlePrev )
				    {
							shiftCounter = shiftCounter + 1 ;
							if ( shiftCounter == 1 )
							{
				      	shiftTitlePrev = shiftTitle ;
							}
				    }

				    /* DISPLAY STAFF */
						if ( shiftCounter == 1 )
						{
				    	$(".upcoming"+stationList).append('<td class="Position">' + upComingStaff.position + '</td>');
				    	$(".upcoming"+stationList).append('<td class="Name">' + upComingStaff.name + '</td>');
				    	$(".upcoming"+stationList).append('<td class="Rank">' + upComingStaff.shiftTime + '</td>');
			      	$(".upcoming"+stationList).append('</tr>');
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
			switch (onDutyNow.onDutyStation)
			{
				case "120":  // DISPLAY STATION 120 STAFF
					if ( header120OnDuty == 0 )
					{
						header120OnDuty = header120OnDuty + 1 ;
						$(".onDuty120").html('<tr class="scheduleRow">');
					}
					else
					{
						$(".onDuty120").append('<tr class="scheduleRow">');
					}
					$(".onDuty120").append('<td class="Position PositionOD">' + onDutyNow.position + '</td>');
					$(".onDuty120").append('<td class="Name NameOD">' + onDutyNow.name + '</td>');
					$(".onDuty120").append('<td class="Rank RankOD">' + onDutyNow.ems + '</td>');
				  $(".onDuty120").append('</tr>');
					break;
				case "140":  // DISPLAY STATION 140 STAFF
					if ( header140OnDuty == 0 )
					{
						header140OnDuty = header140OnDuty + 1 ;
						$(".onDuty140").html('<tr class="scheduleRow">');
					}
					else
					{
						$(".onDuty140").append('<tr class="scheduleRow">');
					}
					$(".onDuty140").append('<td class="Position PositionOD">' + onDutyNow.position + '</td>');
					$(".onDuty140").append('<td class="Name NameOD">' + onDutyNow.name + '</td>');
					$(".onDuty140").append('<td class="Rank RankOD">' + onDutyNow.ems + '</td>');
				  $(".onDuty140").append('</tr>');
					break;
				case "DC":  // DISPLAY DUTY CHIEF
					if ( headerDCOnDuty == 0 )
					{
						headerDCOnDuty = headerDCOnDuty + 1 ;
					}
					$(".onDutyDC").html('<p class="TitleDC">DUTY CHIEF</p>');
					$(".onDutyDC").append('<p class="NameDC">' + onDutyNow.name + '</p>');
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
			$(".onDuty120").html('<tr class="scheduleRow"><td class="Name NameOD">Not Staffed!!</td></tr>')
		}
		if (header140OnDuty > 0)
		{
			header140OnDuty=0;
		}
		else
		{
			$(".onDuty140").html('<tr class="scheduleRow"><td class="Name NameOD">Not Staffed!!</td></tr>')
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
			if (pr120Cnt == 0)
			{
				pr120Cnt = pr120Cnt + 1;
				$(".activities120").html('<tr class="scheduleRow">');
			}
			else
			{
				pr120Cnt = pr120Cnt + 1;
				$(".activities120").append('<tr class="scheduleRow">');
			}
			$(".activities120").append('<td class="Position PositionOD">STATION TASK</td>');
			$(".activities120").append('<td class="eventTitle">' + selectedEvent.eventDescription + '</td>');
			$(".activities120").append('</tr>');
			break;
		case "1": // STATION 140 TASKS
			if (pr140Cnt == 0)
			{
				pr140Cnt = pr140Cnt + 1;
				$(".activities140").html('<tr class="scheduleRow">');
			}
			else
			{
				pr140Cnt = pr140Cnt + 1;
				$(".activities140").append('<tr class="scheduleRow">');
			}
			$(".activities140").append('<td class="Position PositionOD">STATION TASK</td>');
			$(".activities140").append('<td class="eventTitle">' + selectedEvent.eventDescription + '</td>');
			$(".activities140").append('</tr>');
			break;
		case "2": // INFORMATION CENTER
			if (notificationCnt == 0)
			{
				notificationCnt = notificationCnt + 1;
				$(".notification").html('<tr class="scheduleRow">');
			}
			else
			{
				notificationCnt = notificationCnt + 1;
				$(".notification").append('<tr class="scheduleRow">');
			}
			$(".notification").append('<td class="Name">' + selectedEvent.eventDescription + '</td>');
			$(".notification").append('</tr>');
			break;
		case "3": // PR Event
			if (selectedEvent.prCoverage120)
			{
				if (pr120Cnt == 0)
				{
					pr120Cnt = pr120Cnt + 1;
					$(".activities120").html('<tr class="scheduleRowTop">');
				}
				else
				{
					pr120Cnt = pr120Cnt + 1;
					$(".activities120").append('<tr class="scheduleRowTop">');
				}
				$(".activities120").append('<td class="Position PositionOD">PR EVENT</td>');
				$(".activities120").append('<td class="eventTime">' + selectedEvent.eventTime + '</td>');
				$(".activities120").append('</tr>');
				$(".activities120").append('<tr class="scheduleRowBottom">');
				$(".activities120").append('<td colspan="2" class="eventTitle">' +  selectedEvent.eventLocation + '<br />' + selectedEvent.eventDescription + '</td>');
				$(".activities120").append('</tr>');
			}
			if (selectedEvent.prCoverage140)
			{
				if (pr140Cnt == 0)
				{
					pr140Cnt = pr140Cnt + 1;
					$(".activities140").html('<tr class="scheduleRowTop">');
				}
				else
				{
					pr140Cnt = pr140Cnt + 1;
					$(".activities140").append('<tr class="scheduleRowTop">');
				}
				$(".activities140").append('<td class="Position PositionOD">Staffed PR Event: ' + selectedEvent.eventTime + '</td>');
				$(".activities140").append('</tr>');
				$(".activities140").append('<tr class="scheduleRowBottom">');
				$(".activities140").append('<td colspan="2" class="eventTitle">' +  selectedEvent.eventLocation + '<br />' + selectedEvent.eventDescription + '</td>');
				$(".activities140").append('</tr>');
			}
			if (selectedEvent.prCoverageStaff)
			{
				if (notificationCnt == 0)
				{
					notificationCnt = notificationCnt + 1;
					$(".notification").html('<tr class="scheduleRow">');
				}
				else
				{
					notificationCnt = notificationCnt + 1;
					$(".notification").append('<tr class="scheduleRow">');
				}
				$(".notification").append('<td class="Name">PR EVENT<br />' + selectedEvent.eventTime + '</td>');
				$(".notification").append('<td class="Name">' + selectedEvent.eventLocation + '<br />' + selectedEvent.eventDescription + '</td>');
				$(".notification").append('</tr>');
			}
	}
}

function loadEvents ()
{
	$.getJSON("php/eventsToday.php5", function(results)
	{
		notificationCnt=0;
		pr120Cnt=0;
		pr140Cnt=0;
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
		if (notificationCnt > 0)
		{
			$(".notification").append('</tr>');
			notificationCnt=0;
		}
		else
		{
			$(".notification").html('<tr class="scheduleRow"><td class="Name">No Information to Report</td></tr>')
		}
		if (pr120Cnt > 0)
		{
			$(".activities120").append('</tr>');
			pr120Cnt=0;
		}
		else
		{
			$(".activities120").html('<tr class="scheduleRow"><td class="Name">No Scheduled Activities</td></tr>')
		}
		if (pr140Cnt > 0)
		{
			$(".activities140").append('</tr>');
			pr140Cnt=0;
		}
		else
		{
			$(".activities140").html('<tr class="scheduleRow"><td class=" Name">No Scheduled Activities</td></tr>')
		}
  });
}
