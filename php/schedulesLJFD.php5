<?php

/* Set out document type to text/javascript instead of tex/html */
header("Content-type: text/javascript"); 

$getSchedules = array(
		   'accid' => 'sys-ljfd'
		   , 'acckey' => 'D06BADEC0995463B8D8A1D5B6DB9EF7CC67895C4D1DB4BCFA98DD05B51BD72D2'
		   , 'cmd' => 'getSchedules'
		   , 'isp' => '1'
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

   /* check http return code and save members scheduled Now */
   $code = curl_getinfo( $cs, CURLINFO_HTTP_CODE ) ;
   curl_close( $cs ) ;

   if ( $code != '200' ){ die('Bad HTTP Code (' . $code . ')') ; }

   /* return data from Aladtec */
   return $curl_results;
}

/* Get Schedules from Aladtec */
$xmlSchedules = new SimpleXMLElement ( getAladtecData ($getSchedules) ) ;

/* Return LJFD Schedules */
echo json_encode($xmlSchedules);
// echo $xmlSchedules;

?>