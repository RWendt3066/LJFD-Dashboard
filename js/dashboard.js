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
	  loadDutyChief('DC');
  	loadOnDuty('120');
    loadOnDuty('140');
    loadEvents();
    loadUpcoming('120');
    loadUpcoming('140');
	}
	else
	{
    loadDutyChief('DC');
    loadOnDuty('120');
    loadOnDuty('140');
    loadEvents();
    loadUpcoming('120');
    loadUpcoming('140');
	}
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                          LOAD UPCOMING STAFF                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

function loadUpcoming(station)
{
    $.getJSON("php/upcomingLJFD.php5?station="+station, function(results)
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
				    stationSchedule = 'Station 120' ;
					break ;
				case '1' :
				case '16' :
				case '3' :
				    stationSchedule = 'Station 140' ;
					break ;
				case '14' :
				    stationSchedule = 'Duty Chief' ;
					break ;
				default :
				    stationSchedule = 'Station UNK' ;
			}
			upComing = upComing + '"station" : "' + stationSchedule + '",' ;


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

			/* IDENTIFY MEMBER ON DUTY */
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

		/* SORT TABLE AND PREP FOR DISPLAY */
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

		/* DISPLAY UPCOMING STAFF */
		var stationList ;
		var shiftTitle ;
		var shiftTitlePrev='FIRST SHIFT' ;
		var shiftCounter=0;

		$.each(upComingObj.upComingStaff, function(key,upComingStaff)
		{
			if ( key == 0 )
			{
			   $(".upcoming"+station).html('<tr>');
			   currentTime = upComingStaff.shiftTime.substring(0,5) ;
			}
			else
			{
			   $(".upcoming"+station).append('<tr>');
			}

			/* DISPLAY SHIFT TITLE */
			startTime = upComingStaff.shiftTime.substring(0,5) ;
			endTime = upComingStaff.shiftTime.substring(6) ;
			startHour = upComingStaff.shiftTime.substring(0,2) ;

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
			      if ( startHour < '06' )
			      {
			         shiftTitle = 'NIGHT SHIFT' ;
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
					    	// $(".upcoming"+station).append('<td colspan="4" class="scheduleRow shiftName">' + shiftTitle + '</td>');
			    	  	// $(".upcoming"+station).append('</tr><tr>');
							}
				    }

				    /* DISPLAY STAFF */
						if ( shiftCounter == 1 )
						{
				    	$(".upcoming"+station).append('<td class="scheduleRow Position">' + upComingStaff.position + '</td>');
				    	$(".upcoming"+station).append('<td class="scheduleRow Name">' + upComingStaff.name + '</td>');
				    	$(".upcoming"+station).append('<td class="scheduleRow Rank">' + upComingStaff.shiftTime + '</td>');
			      	$(".upcoming"+station).append('</tr>');
						}
			}
		});

	});
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                           LOAD DUTY CHIEF                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

function loadDutyChief(station)
{
	$.getJSON("php/onDutyLJFD.php5?station="+station, function(results)
	{

		$(".onDuty"+station).html('<tr>');
		$(".onDuty"+station).append('<td class="scheduleRow Position PositionOD">DUTY CHIEF</td>');

		/* IDENTIFY MEMBER ON DUTY */
		$.each(LJFDMembers.members.member, function(key, member)
    	{
        	 if ( results.ranges.range.member["@attributes"].id == member["@attributes"].id )
	    	 {
		         $(".onDuty"+station).append('<td class="scheduleRow Name NameOD">' + member.name + '</td>');
				 return false;
	    	 }
    	});

		$(".onDuty"+station).append('</tr>');

	});
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                           LOAD ON DUTY STAFF                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

function loadOnDuty(station)
{
	$.getJSON("php/onDutyLJFD.php5?station="+station, function(results)
	{
		var i = 0 ;
		var resource = new Array () ;
    	var onDuty ;

		if (results.ranges.range.length > 1 )
		{
		/* TRAVERSE THROUGH ON DUTY SCHEDULES */
		$.each(results.ranges.range,  function(key,range)
		{
			onDuty = '{' ;

			/* IDENTIFY POSITION ON DUTY */
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

			/* IDENTIFY MEMBER ON DUTY */
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

		$.each(onDutyObj.onDutyNow, function(key,onDutyNow)
		{
		    if ( key == 0 )
			{ $(".onDuty"+station).html('<tr>'); }
			else
			{ $(".onDuty"+station).append('<tr>'); }
			$(".onDuty"+station).append('<td class="scheduleRow Position PositionOD">' + onDutyNow.position + '</td>');
			$(".onDuty"+station).append('<td class="scheduleRow Name NameOD">' + onDutyNow.name + '</td>');
			$(".onDuty"+station).append('<td class="scheduleRow Rank RankOD">' + onDutyNow.ems + '</td>');
		    $(".onDuty"+station).append('</tr>');
		});
		}
		else
		{

			$(".onDuty"+station).html('<tr>');
			/* IDENTIFY POSITION ON DUTY */
			$.each(LJFDSchedules.schedules.schedule, function(key,schedule)
			{
			    if ( schedule["@attributes"].id == results.ranges.range.schedule["@attributes"].id )
				{
				    $.each(schedule.positions.position, function(key,position)
					{
					    if ( position["@attributes"].id == results.ranges.range.position["@attributes"].id )
						{
							$(".onDuty"+station).append('<td class="scheduleRow Position PositionOD">' + position.name + '</td>');
							return false;
						}
					});
					return false;
				}
			});

			/* IDENTIFY MEMBER ON DUTY */
			$.each(LJFDMembers.members.member, function(key, member)
    		{
        	    if ( range.member["@attributes"].id == member["@attributes"].id )
	    		{
			        $(".onDuty"+station).append('<td class="scheduleRow Name NameOD">' + member.name + '</td>');
			        $(".onDuty"+station).append('<td class="scheduleRow Rank RankOD">' + member.attributes.attribute[3].value + '</td>');
	    			return false;
	    		}
    		});

		    $(".onDuty"+station).append('</tr>');

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
	console.log(selectedEvent.order);
	switch (selectedEvent.order)
	{
		case "0": // Station Task
		case "1": // Station Task
			if (notificationCnt == 0)
			{
				notificationCnt = notificationCnt + 1;
				$(".notification").html('<tr>');
			}
			else
			{
				notificationCnt = notificationCnt + 1;
				$(".notification").append('<tr>');
			}
			$(".notification").append('<td class="scheduleRow Name">Station Task</td>');
			$(".notification").append('<td class="scheduleRow Name">' + selectedEvent.eventDescription + '</td>');
			$(".notification").append('</tr>');
			break;
		case "3": // PR Event
			if (selectedEvent.prCoverage120)
			{
				if (pr120Cnt == 0)
				{
					pr120Cnt = pr120Cnt + 1;
					$(".prEvents120").html('<tr>');
				}
				else
				{
					pr120Cnt = pr120Cnt + 1;
					$(".prEvents120").append('<tr>');
				}
				$(".prEvents120").append('<td class="scheduleRowTop eventTitle">' + selectedEvent.eventLocation + '</td>');
				$(".prEvents120").append('<td class="scheduleRowTop eventTime">' + selectedEvent.eventTime + '</td>');
				$(".prEvents120").append('</tr>');
				$(".prEvents120").append('<tr>');
				$(".prEvents120").append('<td colspan="2" class="scheduleRowBottom eventTitle">' + selectedEvent.eventDescription + '</td>');
				$(".prEvents120").append('</tr>');
			}
			if (selectedEvent.prCoverage140)
			{
				if (pr140Cnt == 0)
				{
					pr140Cnt = pr140Cnt + 1;
					$(".prEvents140").html('<tr>');
				}
				else
				{
					pr140Cnt = pr140Cnt + 1;
					$(".prEvents140").append('<tr>');
				}
				$(".prEvents140").append('<td class="scheduleRowTop eventTitle">' + selectedEvent.eventLocation + '</td>');
				$(".prEvents140").append('<td class="scheduleRowTop eventTime">' + selectedEvent.eventTime + '</td>');
				$(".prEvents140").append('</tr>');
				$(".prEvents140").append('<tr>');
				$(".prEvents140").append('<td colspan="2" class="scheduleRowBottom eventTitle">' + selectedEvent.eventDescription + '</td>');
				$(".prEvents140").append('</tr>');
			}
			if (selectedEvent.prCoverageStaff)
			{
				if (notificationCnt == 0)
				{
					notificationCnt = notificationCnt + 1;
					$(".notification").html('<tr>');
				}
				else
				{
					notificationCnt = notificationCnt + 1;
					$(".notification").append('<tr>');
				}
				$(".notification").append('<td class="scheduleRow Name">PR Event<br />' + selectedEvent.eventTime + '</td>');
				$(".notification").append('<td class="scheduleRow Name">' + selectedEvent.eventLocation + '<br />' + selectedEvent.eventDescription + '</td>');
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
			$(".notification").html('<tr><td class="scheduleRow Name">No Notifications</td></tr>')
		}
		if (pr120Cnt > 0)
		{
			$(".prEvents120").append('</tr>');
			pr120Cnt=0;
		}
		else
		{
			$(".prEvents120").html('<tr><td class="scheduleRow Name">No PR Events</td></tr>')
		}
		if (pr140Cnt > 0)
		{
			$(".prEvents140").append('</tr>');
			pr140Cnt=0;
		}
		else
		{
			$(".prEvents140").html('<tr><td class="scheduleRow Name">No PR Events</td></tr>')
		}
  });
}
