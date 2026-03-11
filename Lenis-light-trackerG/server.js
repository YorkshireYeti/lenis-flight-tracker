const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const API_KEY = "e5025315camshdc195fde2ccf1d8p179bc9jsn2d3f77b33509";

app.use(express.static(path.join(__dirname,"public")));

const airports={
GLA:{name:"Glasgow",lat:55.8719,lon:-4.43306},
DXB:{name:"Dubai",lat:25.2528,lon:55.3644},
BKK:{name:"Bangkok",lat:13.6900,lon:100.7501}
};

const trackedFlights=["EK27","EK28","EK375","EK376"];

async function getAirportFlights(iata){

try{

let now=new Date();

let start=new Date(now.getTime()-6*60*60*1000).toISOString();
let end=new Date(now.getTime()+24*60*60*1000).toISOString();

const res=await fetch(
`https://aerodatabox.p.rapidapi.com/flights/airports/iata/${iata}/${start}/${end}?withLocation=false`,
{
headers:{
"X-RapidAPI-Key":API_KEY,
"X-RapidAPI-Host":"aerodatabox.p.rapidapi.com"
}
}
);

const data=await res.json();

return data.departures || [];

}catch(e){

console.log("Airport API error:",iata);

return [];

}

}

async function findTrackedFlights(){

let airportsToCheck=["GLA","DXB","BKK"];

let found=[];

for(const airport of airportsToCheck){

let flights=await getAirportFlights(airport);

for(const f of flights){

if(trackedFlights.includes(f.number)){
found.push(f);
}

}

}

return found;

}

function loadHistory(){

if(!fs.existsSync("history.json")) return [];

return JSON.parse(fs.readFileSync("history.json"));

}

function saveHistory(history){

fs.writeFileSync("history.json",JSON.stringify(history,null,2));

}

async function updateHistory(){

let history=loadHistory();

let flights=await findTrackedFlights();

for(const f of flights){

let last=[...history].reverse().find(h=>h.flight===f.number);

if(last && last.status===f.status) continue;

history.push({
time:new Date().toISOString(),
flight:f.number,
status:f.status
});

console.log("Logged:",f.number,f.status);

}

saveHistory(history);

}

app.get("/api/flights",async(req,res)=>{

let flights=await findTrackedFlights();

let result=[];

for(const f of flights){

let depAirport=airports[f.departure.airport.iata];
let arrAirport=airports[f.arrival.airport.iata];

if(!depAirport || !arrAirport) continue;

result.push({

number:f.number,
status:f.status,

departure:{
airport:{
name:depAirport.name,
location:{
lat:depAirport.lat,
lon:depAirport.lon
}
},
scheduledTime:{
local:f.departure.scheduledTime.local
}
},

arrival:{
airport:{
name:arrAirport.name,
location:{
lat:arrAirport.lat,
lon:arrAirport.lon
}
},
scheduledTime:{
local:f.arrival.scheduledTime.local
}
}

});

}

res.json(result);

});

app.get("/history",(req,res)=>{
res.json(loadHistory());
});

updateHistory();
setInterval(updateHistory,60000);

const PORT=process.env.PORT||3000;

app.listen(PORT,()=>{
console.log("Flight tracker running");
});
