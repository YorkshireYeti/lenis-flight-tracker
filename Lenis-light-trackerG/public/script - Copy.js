const map = L.map("map").setView([45,10],4);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
maxZoom:10
}).addTo(map);

// airports
const GLA=[55.8719,-4.4331];
const DXB=[25.2532,55.3657];

let planeMarker=null;

// calculate route direction
function bearing(a,b){

let lat1=a[0]*Math.PI/180;
let lat2=b[0]*Math.PI/180;
let dLon=(b[1]-a[1])*Math.PI/180;

let y=Math.sin(dLon)*Math.cos(lat2);
let x=Math.cos(lat1)*Math.sin(lat2)-
Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);

let brng=Math.atan2(y,x);

return(brng*180/Math.PI+360)%360;

}

const direction=bearing(GLA,DXB)-90;

// large red aircraft icon
function planeIcon(flight){

return L.divIcon({
html:
"<div style='text-align:center'>" +

"<div style='font-size:18px;font-weight:bold;color:white;background:black;padding:4px 8px;border-radius:6px;margin-bottom:4px'>"+
flight+
"</div>"+

"<div style='font-size:60px;color:red;transform:rotate("+direction+"deg)'>✈</div>"+

"</div>",
iconSize:[120,100],
className:""
});

}

// interpolate position
function interpolate(a,b,p){

return[
a[0]+(b[0]-a[0])*p,
a[1]+(b[1]-a[1])*p
];

}

// calculate flight progress
function progress(dep,arr){

if(!dep||!arr) return 0;

let start=new Date(dep).getTime();
let end=new Date(arr).getTime();
let now=Date.now();

let duration=end-start;

if(duration<=0) return 0;

let p=(now-start)/duration;

if(p<0) p=0;
if(p>1) p=1;

return p;

}

async function updateFlights(){

const res=await fetch("/api/flights");
const flights=await res.json();

let html="";
let statusPanel="";
let result="IN PROGRESS";

flights.forEach(f=>{

let dep=f.departure?.scheduledTime?.local;
let arr=f.arrival?.scheduledTime?.local;

let status=f.status||"unknown";

let flightNumber=(f.number||"").replace(" ","");

statusPanel+=f.number+" — "+status+"<br>";

if(status==="Cancelled"||status==="Diverted"){
result="FAILED";
}

html+=
"<div class='flightCard'>"+
"<b>"+f.number+"</b><br>"+
(f.departure?.airport?.name||"Unknown")+" → "+
(f.arrival?.airport?.name||"Unknown")+"<br>"+
"Departure: "+dep+"<br>"+
"Arrival: "+arr+"<br>"+
"Status: "+status+
"</div>";

if(flightNumber==="EK28"){

let p=progress(dep,arr);
let pos=interpolate(GLA,DXB,p);

if(!planeMarker){

planeMarker=L.marker(pos,{
icon:planeIcon("EK28")
}).addTo(map);

map.setView(pos,4);

}else{

planeMarker.setLatLng(pos);

}

}

});

if(result!=="FAILED"){

let landed=flights.filter(f=>f.status==="Landed");

if(landed.length>=2){
result="SUCCESS";
}

}

document.getElementById("flights").innerHTML=html;

document.getElementById("journey").innerHTML=
"<b>GLA → DXB → BKK</b><br><br>"+
statusPanel+
"<br><b>Journey Result: "+result+"</b>";

}

async function loadHistory(){

const res=await fetch("/history");
const data=await res.json();

let html="<b>Journey Log</b><br><br>";

data.slice(-40).reverse().forEach(h=>{

if(h.event){

html+=
new Date(h.time).toLocaleString()+
" — "+h.flight+
" "+h.event+
"<br>";

}

});

document.getElementById("history").innerHTML=html;

}

updateFlights();
loadHistory();

setInterval(updateFlights,5000);
setInterval(loadHistory,300000);
