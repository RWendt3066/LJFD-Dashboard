<?php

/* Set out document type to text/javascript instead of tex/html */
/* header("Content-type: text/javascript"); */

/* Identify Schedules for Requested Station */
$ljfdStation = $_GET['station'] ;
switch ($ljfdStation) 
{
    case '120' :
	   $ljfdSchedules = '13,15,2' ;
	   break ;
	case '140' :
	   $ljfdSchedules = '1,16,3' ;
	   break ;
	case 'DC' :
	   $ljfdSchedules = '14' ;
	   break ;
	default :
	   $ljfdSchedules = '13,15,2,1,16,3,14' ;
}

/* Set Begin and End Times */
date_default_timezone_set("UTC") ;
$currentBT = date("Y-m-d") . "T" . date("H:i") . ":00Z" ;
$d=strtotime("+24 hours") ;
$currentET = date("Y-m-d", $d) . "T" . date("H", $d) . ":40:10Z" ;
$userTZ = new DateTimeZone('America/Chicago') ;
$scheduleTZ = new DateTimeZone('UTC') ;

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

/* Get Upcoming Staff from Aladtec */
$getScheduledTimeRanges = array(
		   'accid' => 'sys-ljfd' ,
		   'acckey' => 'D06BADEC0995463B8D8A1D5B6DB9EF7CC67895C4D1DB4BCFA98DD05B51BD72D2' ,
		   'cmd' => 'getScheduledTimeRanges' ,
		   'isp' => '1' ,
		   'sch' => $ljfdSchedules ,
		   'bt' => $currentBT ,
		   'et' => $currentET
		   ) ;
$xmlScheduledTimeRanges = new SimpleXMLElement ( getAladtecData ($getScheduledTimeRanges) ) ;

/* Return LJFD On Duty List for Requested Station */
echo json_encode($xmlScheduledTimeRanges);

?>