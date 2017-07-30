<?php

date_default_timezone_set("America/Chicago") ;
$daytimefrom = 63000;
$daytimeto = 170000;
$eveningtimefrom = 170000;
$eveningtimeto = 220000;

$currentTime = (int) date('Gis');

if ($currentTime >= $daytimefrom && $currentTime < $daytimeto)
{
    $shift = 'DAY';
}
else
{
    if ($currentTime >= $eveningtimefrom && $currentTime < $eveningtimeto)
	{
	   $shift = 'EVENING';
	}
	else
	{
	   $shift = 'NIGHT';
	}
} 

date_default_timezone_set('America/Chicago') ;
//$currentBT = date("Y-m-d") ;
//$currentET = date("Y-m-d") ;
$currentET = date("Y-m-d") ;
$currentBT = $currentET ;
$currentTime = date("H:i");
$userTZ = new DateTimeZone('America/Chicago') ;
$scheduleTZ = new DateTimeZone('UTC') ;
date_default_timezone_set("UTC") ;

$getEvents = array(
		   'accid' => 'sys-ljfd' ,
		   'acckey' => 'D06BADEC0995463B8D8A1D5B6DB9EF7CC67895C4D1DB4BCFA98DD05B51BD72D2' ,
		   'cmd' => 'getEvents' ,
		   'bd' => $currentBT ,
		   'ed' => $currentET
		   ) ;

Function getAladtecData ($post_vars)
{
   $cs = curl_init() ;

      curl_setopt( $cs, CURLOPT_URL, 'https://secure4.aladtec.com/ljfd/xmlapi.php' ) ;
	  curl_setopt( $cs, CURLOPT_POST, 1 ) ;
	  curl_setopt( $cs, CURLOPT_HEADER, 0 ) ;
	  curl_setopt( $cs, CURLOPT_SSL_VERIFYPEER, 0 ) ;
	  curl_setopt( $cs, CURLOPT_SSL_VERIFYHOST, 2 ) ;
	  curl_setopt( $cs, CURLOPT_FOLLOWLOCATION, 1 ) ;
	  curl_setopt( $cs, CURLOPT_RETURNTRANSFER, 1 ) ;
	  curl_setopt( $cs, CURLOPT_POSTFIELDS, $post_vars ) ;

   $curl_results = curl_exec( $cs ) ;

   // check http return code and save members scheduled Now
   $code = curl_getinfo( $cs, CURLINFO_HTTP_CODE ) ;
   curl_close( $cs ) ;

   if ( $code != '200' ){ die('Bad HTTP Code (' . $code . ')') ; }

   // return data from Aladtec
   return $curl_results;
}

$xmlEvents = new SimpleXMLElement ( getAladtecData ($getEvents) ) ;

//echo "Today is " . date("Y-m-d") . "<br />" ;
//echo "The time is " . date("H:i") . "<br />" ;
//echo "The time is " . $currentTime . "<br />" ;
//echo "The shift is " . $shift . "<br />" ;
//echo "Current BT is " . $currentBT . "<br />" ;
//echo "Current ET is " . $currentET . "<br />" ;
//echo "<br /><br />";
//echo '<h2>UPCOMING EVENTS</h2>' ;

//print_r($xmlEvents);

$i = 0 ;
$events = array() ;

foreach ( $xmlEvents->events->event as $event )
{
  switch (strval($event->title))
  {
   // Check for PR Events
   case 'PR' :

      // Past Start Time?
      $strBegin = substr(strval($event->begin),0,10) . ' ' . substr(strval($event->begin),11,5) ;
      $eventBegin = new DateTime($strBegin,$scheduleTZ) ;
      $eventBegin->setTimeZone($userTZ) ;
      if ( $eventBegin->format('H:i') >= $currentTime )
      {
      $nextEvent = '<event>' ;
   
      // Set Order
      $nextEvent = $nextEvent . '<order>3</order>' ;

      // Report Start Times
      $nextEvent = $nextEvent . '<eventTime>' . $eventBegin->format('H:i') ;
 
      // Report End Times
      $strEnd = substr(strval($event->end),0,10) . ' ' . substr(strval($event->end),11,5) ;
      $eventEnd = new DateTime($strEnd,$scheduleTZ) ;
      $eventEnd->setTimeZone($userTZ) ;
      $nextEvent = $nextEvent . '-' . $eventEnd->format('H:i') . '</eventTime>' ;

      // Report Event Location
      $nextEvent = $nextEvent . '<eventLocation>' . strval($event->location) . '</eventLocation>' ;
   
      // Report Event Description
      $nextEvent = $nextEvent . '<eventDescription>' . strval($event->description) . '</eventDescription>' ;
	  
	  // Report Coverage
	  $nextEvent = $nextEvent . '<eventCoverage>' ;
	  foreach ($event->schedules->schedule as $schedule)
	  {
	     if (strval($schedule['id']) != '4')
		 {
		    switch ($schedule['id'])
			{
			   case '13' :
			      $nextEvent = $nextEvent . '120-Day ' ;
				  break ;
			   case '1' :
			      $nextEvent = $nextEvent . '140-Day ' ;
				  break ;
			   case '15' :
			      $nextEvent = $nextEvent . '120-Evening ' ;
				  break ;
			   case '16' :
			      $nextEvent = $nextEvent . '140-Evening ' ;
				  break ;
			   case '2' :
			      $nextEvent = $nextEvent . '120-Night ' ;
				  break ;
			   case '3' :
			      $nextEvent = $nextEvent . '140-Night ' ;
				  break ;
			}
		 }
	  }
	  $nextEvent = $nextEvent . '</eventCoverage>' ;

      $nextEvent = $nextEvent . '</event>' ;
      $events[$i] = $nextEvent ;
      $i = $i + 1 ;
      }
	  break ;
   
   // Check for Road Construction
   case 'RC' :

      $nextEvent = '<event>' ;
   
      // Set Order
      $nextEvent = $nextEvent . '<order>2</order>' ;

      // Report Event Description
      $nextEvent = $nextEvent . '<eventDescription>' . strval($event->description) . '</eventDescription>' ;
	  
      $nextEvent = $nextEvent . '</event>' ;
      $events[$i] = $nextEvent ;
      $i = $i + 1 ;
      
	  break ;

   // Check for Station Tasks
   case 'ST' :
   
      foreach ($event->schedules->schedule as $schedule)
	  {
	     switch ($shift)
	     {
	        case 'DAY' :
		       if (strval($schedule['id']) == '13')
			   {
	              $nextEvent = '<event>' ;
                  $nextEvent = $nextEvent . '<order>0</order>' ;
                  $nextEvent = $nextEvent . '<eventDescription>' . strval($event->description) . '</eventDescription>' ;
                  $nextEvent = $nextEvent . '</event>' ;
                  $events[$i] = $nextEvent ;
                  $i = $i + 1 ;
			   } 
		       if (strval($schedule['id']) == '1')
			   {
	              $nextEvent = '<event>' ;
                  $nextEvent = $nextEvent . '<order>1</order>' ;
                  $nextEvent = $nextEvent . '<eventDescription>' . strval($event->description) . '</eventDescription>' ;
                  $nextEvent = $nextEvent . '</event>' ;
                  $events[$i] = $nextEvent ;
                  $i = $i + 1 ;
			   }
			   break ;
		    case 'EVENING' :
		       if (strval($schedule['id']) == '15')
			   {
	              $nextEvent = '<event>' ;
                  $nextEvent = $nextEvent . '<order>0</order>' ;
                  $nextEvent = $nextEvent . '<eventDescription>' . strval($event->description) . '</eventDescription>' ;
                  $nextEvent = $nextEvent . '</event>' ;
                  $events[$i] = $nextEvent ;
                  $i = $i + 1 ;
			   }
		       if (strval($schedule['id']) == '16')
			   {
	              $nextEvent = '<event>' ;
                  $nextEvent = $nextEvent . '<order>1</order>' ;
                  $nextEvent = $nextEvent . '<eventDescription>' . strval($event->description) . '</eventDescription>' ;
                  $nextEvent = $nextEvent . '</event>' ;
                  $events[$i] = $nextEvent ;
                  $i = $i + 1 ;
			   }
			   break ;
		    case 'NIGHT' :
		       if (strval($schedule['id']) == '2')
			   {
	              $nextEvent = '<event>' ;
                  $nextEvent = $nextEvent . '<order>0</order>' ;
                  $nextEvent = $nextEvent . '<eventDescription>' . strval($event->description) . '</eventDescription>' ;
                  $nextEvent = $nextEvent . '</event>' ;
                  $events[$i] = $nextEvent ;
                  $i = $i + 1 ;
			   }
		       if (strval($schedule['id']) == '3')
			   {
	              $nextEvent = '<event>' ;
                  $nextEvent = $nextEvent . '<order>1</order>' ;
                  $nextEvent = $nextEvent . '<eventDescription>' . strval($event->description) . '</eventDescription>' ;
                  $nextEvent = $nextEvent . '</event>' ;
                  $events[$i] = $nextEvent ;
                  $i = $i + 1 ;
			   }
			   break ;
	     }
	  }
      break;
  }
}

if ($i > 0) {
// Sort Event by Order, Title, Description
$xmlEventList = "<?xml version='1.0' encoding='UTF-8'?>" . "<dailyEvents>" ;
sort($events) ;
for ($i=0;$i<=count($events);$i++)
{
   $xmlEventList = $xmlEventList . $events[$i] ;
}
$xmlEventList = $xmlEventList . '</dailyEvents>' ;
$xmlObj=simplexml_load_string($xmlEventList) or die("Error: Cannot create object");

// Output Events Table
$shift120Tasks = 'N' ;
$shift140Tasks = 'N' ;
$prEventHeader = 'N' ;
$rcHeader = 'N' ;

// Station 120 Tasks
foreach ( $xmlObj->event as $event )
{
   if (strval($event->order) == '0')
   {
      if ($shift120Tasks == 'N')
      {
         echo '<tr><td colspan="2" class="scheduleRow stationName stationNameOD">STATION TASKS 120 - ' . $shift . '</td></tr>';
	     $shift120Tasks = 'Y';
         echo '<tr><td colspan="2" class="eventDesc">';
		 echo '<ul>' ;
      }
	  echo '<li>' . strval($event->eventDescription) . '</li>' ;
   }
}
if ($shift140Tasks == 'Y')
{
    echo '</ul>' ;
    echo '</td><tr>' ;
}

// Station 140 Tasks
foreach ( $xmlObj->event as $event )
{
   if (strval($event->order) == '1')
   {
      if ($shift140Tasks == 'N')
      {
         echo '<tr><td colspan="2" class="scheduleRow stationName stationNameOD">STATION TASKS 140 - ' . $shift . '</td></tr>';
	     $shift140Tasks = 'Y';
         echo '<tr><td colspan="2" class="eventDesc">';
		 echo '<ul>' ;
      }
	  echo '<li>' . strval($event->eventDescription) . '</li>' ;
   }
}
if ($shift140Tasks == 'Y')
{
    echo '</ul>' ;
    echo '</td><tr>' ;
}

// Road Construction
foreach ( $xmlObj->event as $event )
{
   if (strval($event->order) == '2')
   {
	      if ($rcHeader == 'N' )
		  {
			 echo '<tr><td colspan="2" class="scheduleRow stationName stationNameOD">ROAD CONSTRUCTION<br /></td></tr>';
			 $rcHeader = 'Y' ;
		     echo '<tr><td class="eventDesc">' ;
			 echo '<ul>' ;
		  }
		  
		  echo '<li>' . strval($event->eventDescription) . '</li>' ;
	}
}
if ($rcHeader == 'Y')
{
    echo '</ul>' ;
    echo '</td><tr>' ;
}

// PR Events
foreach ( $xmlObj->event as $event )
{
   if (strval($event->order) == '3')
   {
	      if ($prEventHeader == 'N' )
		  {
			 echo '<tr><td colspan="2" class="scheduleRow stationName stationNameOD">PR EVENTS</td></tr>';
			 $prEventHeader = 'Y' ;
		  }
		  echo '<tr><td class="eventDesc">' ;
	      echo '<span class="col-md-4">TITLE: </span><span class="col-md-8">' . strval($event->eventDescription) . '</span>' ;
	      echo '<span class="col-md-4">LOCATION: </span><span class="col-md-8">' . strval($event->eventLocation) . '</span>' ;
	      echo '<span class="col-md-4">TIME: </span><span class="col-md-8">' . strval($event->eventTime) . '</span>' ;
	      if (strval($event->eventCoverage) > ' ')
	         {echo '<span class="col-md-4">COVERAGE: </span><span class="col-md-8">' . strval($event->eventCoverage) . '</span>' ;}
	      else
	         {echo '<span class="col-md-4">COVERAGE: </span><span class="col-md-8">Staffed</span>' ;}
		  echo '</td><tr>' ;
	}
}
} else
{
// No Assigned Tasks
 echo '<tr><td colspan="2" class="eventDesc">';
 echo '<span>No Assigned Tasks</span><br />' ;
 echo '<br /></td></tr>' ;
}
?>