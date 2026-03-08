const map = L.map("map").setView([40,10],3);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
maxZoom:8
}).addTo(map);

let markers=[];

function clearMarkers(){
markers.forEach(m=>map.removeLayer(m));
markers=[];
}

function formatTime(t){

if(!t) return "Unknown";

let d=new Date(t);

return d.toLocaleString("en-GB",{
day:"numeric",
month:"short",
hour:"2-digit",
minute:"2-digit"
});

}

function createPlaneIcon(flightNumber){

return L.divIcon({
className:"",
html:`

<div style="text-align:center">
<div style="
background:#111;
color:white;
padding:4px 10px;
border-radius:4px;
font-size:14px;
margin-bottom:4px;
display:inline-block;">
${flightNumber}
</div>
<div style="color:red;font-size:36px;line-height:32px;">
✈
</div>
</div>
`,
iconSize:[70,70],
iconAnchor:[35,35]
});

}

function calculateProgress(depTime,arrTime){

if(!depTime || !arrTime) return 0;

let now=Date.now();
let dep=new Date(depTime).getTime();
let arr=new Date(arrTime).getTime();

if(now<=dep) return 0;
if(now>=arr) return 100;

let progress=((now-dep)/(arr-dep))*100;

return Math.round(progress);

}

async function updateFlights(){

const res = await fetch("/api/flights");
const flights = await res.json();

clearMarkers();

let html="";

flights.forEach(f=>{

let depAirport=f.departure?.airport?.name||"?";
let arrAirport=f.arrival?.airport?.name||"?";

let depLat=f.departure?.airport?.location?.lat;
let depLon=f.departure?.airport?.location?.lon;

let arrLat=f.arrival?.airport?.location?.lat;
let arrLon=f.arrival?.airport?.location?.lon;

let depTime=f.departure?.scheduledTime?.local;
let arrTime=f.arrival?.scheduledTime?.local;

let dep=formatTime(depTime);
let arr=formatTime(arrTime);

let status=f.status||"unknown";

let progress=calculateProgress(depTime,arrTime);

html+=
"<div class='flightCard'>"+
"<b>"+f.number+"</b><br>"+
depAirport+" → "+arrAirport+
"<br><br>"+
"<b>Departure:</b> "+dep+"<br>"+
"<b>Arrival:</b> "+arr+"<br>"+
"<b>Status:</b> "+status+"<br>"+
"<b>Journey:</b> "+progress+"% complete"+
"</div>";

if(depLat && arrLat){

let now=Date.now();
let depMs=new Date(depTime).getTime();
let arrMs=new Date(arrTime).getTime();

let lat,lon;

if(now<=depMs){

lat=depLat;
lon=depLon;

}else if(now>=arrMs){

lat=arrLat;
lon=arrLon;

}else{

let routeProgress=(now-depMs)/(arrMs-depMs);

lat=depLat+(arrLat-depLat)*routeProgress;
lon=depLon+(arrLon-depLon)*routeProgress;

}

let marker=L.marker(
[lat,lon],
{icon:createPlaneIcon(f.number)}
).addTo(map);

markers.push(marker);

}

});

document.getElementById("flights").innerHTML=html;

}

async function loadHistory(){

const res=await fetch("/history");
const data=await res.json();

let html="";

data.slice(-20).reverse().forEach(h=>{

html+=h.time+" — "+h.flight+" — "+h.status+"<br>";

});

document.getElementById("history").innerHTML=html;

}

updateFlights();
loadHistory();

setInterval(updateFlights,5000);
setInterval(loadHistory,300000);
