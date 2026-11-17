"use client";

import { useState } from "react";

export default function ContractLogo({src,alt,className}){
  const [failedSrc,setFailedSrc]=useState("");
  const url=!src||failedSrc===src?"/logo.png":src;
  return <img src={url} alt={alt} className={className} onError={()=>setFailedSrc(url)}/>;
}
