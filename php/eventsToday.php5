<?php
/* Set out document type to text/javascript instead of tex/html */
header("Content-type: text/javascript");
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
$i = 0 ;
$events = array() ;
foreach ( $xmlEvents->events->event as $event )
{
  switch (strval($event->title))
  {
    ///////////////////////////////////////////////////////////////////////////
    // CHECK FOR PR EVENTS
    ///////////////////////////////////////////////////////////////////////////
    case 'PR' :
      // Determine Event Start and End Times
      $strBegin = substr(strval($event->begin),0,10) . ' ' . substr(strval($event->begin),11,5) ;
      $eventBegin = new DateTime($strBegin,$scheduleTZ) ;
      $eventBegin->setTimeZone($userTZ) ;
      $strEnd = substr(strval($event->end),0,10) . ' ' . substr(strval($event->end),11,5) ;
      $eventEnd = new DateTime($strEnd,$scheduleTZ) ;
      $eventEnd->setTimeZone($userTZ) ;
      // Past Start Time?
      if ( $eventEnd->format('H:i') >= $currentTime )
      {
        $nextEvent = '<event>' ;
        // Set Order
        $nextEvent = $nextEvent . '<order>3</order>' ;
        // Report Event Start and End Times
        $nextEvent = $nextEvent . '<eventTime>' . $eventBegin->format('H:i') ;
        $nextEvent = $nextEvent . '-' . $eventEnd->format('H:i') . '</eventTime>' ;
        // Report Event Location
        $nextEvent = $nextEvent . '<eventLocation>' . strval($event->location) . '</eventLocation>' ;
        // Report Event Description
        $nextEvent = $nextEvent . '<eventDescription>' . strval($event->description) . '</eventDescription>' ;
  	    // Report Coverage
	      foreach ($event->schedules->schedule as $schedule)
	      {
	        if (strval($schedule['id']) != '4')
		      {
  	        switch ($schedule['id'])
  		      {
              case '13': // 120-Day
              case '15': // 120-Evening
              case '2':  // 120-Night
                $nextEvent = $nextEvent . '<prCoverage120>' ;
                $nextEvent = $nextEvent . 'Y' ;
                $nextEvent = $nextEvent . '</prCoverage120>' ;
                break;
              case '1':  // 140-Day
              case '16': // 140-Evening
              case '13': // 140-Night
                $nextEvent = $nextEvent . '<prCoverage140>' ;
                $nextEvent = $nextEvent . 'Y' ;
                $nextEvent = $nextEvent . '</prCoverage140>' ;
                break;
              default :
                $nextEvent = $nextEvent . '<prCoverageStaff>' ;
                $nextEvent = $nextEvent . 'Y' ;
                $nextEvent = $nextEvent . '</prCoverageStaff>' ;
  		      }
          }
	      }
//	      $nextEvent = $nextEvent . '</eventCoverage>' ;
        $nextEvent = $nextEvent . '</event>' ;
        $events[$i] = $nextEvent ;
        $i = $i + 1 ;
      }
	    break ;
    // Check for Road Construction
    case 'IC' :
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
$xmlEventList = "<?xml version='1.0' encoding='UTF-8'?>" . "<dailyEvents>" ;
if ($i > 0)
{
  // Sort Event by Order, Title, Description
  sort($events) ;
  for ($i=0;$i<=count($events);$i++)
  {
    $xmlEventList = $xmlEventList . $events[$i] ;
  }
}
else
{
  $xmlEventList = $xmlEventList . '<event><order>99</order><eventDescription>Nothing to Report</eventDescription></event>';
}
$xmlEventList = $xmlEventList . '</dailyEvents>' ;
// $xmlObj=simplexml_load_string($xmlEventList) or die("Error: Cannot create object");
$xmlEvents = new SimpleXMLElement ( $xmlEventList ) ;
/* Return LJFD On Duty List for Requested Station */
echo json_encode($xmlEvents);
// echo $xmlEvents ;
?>
