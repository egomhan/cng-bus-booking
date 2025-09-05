const API="http://localhost:4000/api";

function handleScan(decodedText){
  const [bookingId, seat]=decodedText.split(":");
  fetch(API+"/checkin",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({bookingId,seat})
  })
  .then(r=>r.json())
  .then(res=>{
    const resultDiv=document.getElementById("result");
    if(res.status==="success"){
      resultDiv.innerHTML=`✅ ${res.passenger.name} (Seat ${seat}) checked in`;
    } else if(res.status==="duplicate"){
      resultDiv.innerHTML=`❌ ${res.passenger.name} already boarded`;
    } else {
      resultDiv.innerHTML=`⚠️ ${res.message}`;
    }
  });
}

const qr=new Html5Qrcode("reader");
qr.start({facingMode:"environment"},{fps:10,qrbox:250},handleScan);

