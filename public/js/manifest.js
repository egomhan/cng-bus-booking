const API="http://localhost:4000/api";
const bookingId=new URLSearchParams(window.location.search).get("id");

async function loadManifest(){
  const res=await fetch(API+"/booking/"+bookingId+"/passengers");
  const data=await res.json();
  if(data.error){
    document.getElementById("booking-info").textContent=data.error;
    return;
  }

  const b=data.booking;
  document.getElementById("booking-info").innerHTML=`
    <h2>${b.route}</h2>
    <p>Booking ID: ${b.booking_id}</p>
    <p>Departure: ${b.departure_time}</p>
  `;

  const tbody=document.querySelector("#manifest-table tbody");
  tbody.innerHTML="";
  data.passengers.forEach(p=>{
    const row=document.createElement("tr");
    row.innerHTML=`
      <td>${p.name}</td>
      <td>${p.seat_label}</td>
      <td>${p.checked_in?"✅ Checked-in":"❌ Not checked-in"}</td>
      <td><button onclick="toggleCheckin(${p.id})">${p.checked_in?"Undo":"Check-in"}</button></td>
    `;
    tbody.appendChild(row);
  });
}

async function toggleCheckin(pid){
  await fetch(API+`/booking/${bookingId}/passengers/${pid}/checkin`,{method:"POST"});
  loadManifest();
}

loadManifest();

