const API="http://localhost:4000/api";
let selectedSeats=[];

function renderSeatMap(){
  const seatMap=document.getElementById("seat-map");
  seatMap.innerHTML="";
  for(let r=1;r<=4;r++){
    const row=document.createElement("div");
    for(let c=1;c<=4;c++){
      const seat=r+"-"+c;
      const btn=document.createElement("button");
      btn.innerText=seat;
      btn.onclick=()=>toggleSeat(seat,btn);
      row.appendChild(btn);
    }
    seatMap.appendChild(row);
  }
}

function toggleSeat(seat,btn){
  if(selectedSeats.includes(seat)){
    selectedSeats=selectedSeats.filter(s=>s!==seat);
    btn.style.background="";
  } else {
    selectedSeats.push(seat);
    btn.style.background="#90ee90";
  }
}

async function confirmBooking(){
  const name=document.getElementById("name").value;
  const phone=document.getElementById("phone").value;
  const route=document.getElementById("route").value;
  const departure=document.getElementById("departure").value;

  const passengers=selectedSeats.map(seat=>({name, seat_label:seat}));

  const res=await fetch(API+"/book",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({name,phone,route,departure_time:departure,seats:selectedSeats,passengers})
  });
  const data=await res.json();
  alert("Booking confirmed! ID: "+data.bookingId);
  loadBookings();
}

async function loadBookings(){
  const res=await fetch(API+"/bookings");
  const bookings=await res.json();
  const div=document.getElementById("my-bookings");
  div.innerHTML="";
  bookings.forEach(b=>{
    const card=document.createElement("div");
    card.className="card";
    card.innerHTML=`<h4>Booking ${b.booking_id}</h4>
      <p>Route: ${b.route}</p>
      <p>Departure: ${b.departure_time}</p>`;
    b.passengers.forEach(p=>{
      const qrDiv=document.createElement("div");
      new QRCode(qrDiv,{
        text:b.booking_id+":"+p.seat_label,
        width:80,height:80
      });
      qrDiv.innerHTML+=`<p>${p.name} - Seat ${p.seat_label}</p>`;
      card.appendChild(qrDiv);
    });
    div.appendChild(card);
  });
}

renderSeatMap();
loadBookings();
