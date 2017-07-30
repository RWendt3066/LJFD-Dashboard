<?php

/* Set out document type to text/javascript instead of tex/html */
header("Content-type: text/javascript"); 

$getMembers = array(
		   'accid' => 'sys-ljfd'
		   , 'acckey' => 'D06BADEC0995463B8D8A1D5B6DB9EF7CC67895C4D1DB4BCFA98DD05B51BD72D2'
		   , 'cmd' => 'getMembers'
		   , 'ia' => 'all'
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

/* Get Members from Aladtec */
$xmlMembers = new SimpleXMLElement ( getAladtecData ($getMembers) ) ;

/* Return LJFD Members List */
echo json_encode($xmlMembers);
// echo $xmlMembers;

?>