const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const API_KEY = process.env.API_KEY;

app.use(express.static(path.join(__dirname,"public")));

const airports={
GLA:{name:"Glasgow",lat:55.8719,lon:-4.43306},
DXB:{name:"Dubai",lat:25.2528,lon:55.3644},
BKK:{name:"Bangkok",lat:13.6900,lon:100.7501}
};

const tracked=["EK27","EK28","EK375","EK376"];

async function getAirportBoard(iata){

try{

let start=new Date(Date.now()-6*60*60*1000).toISOString();
let end=new Date(Date.now()+24*60*60*1000).toISOString();

const res=await fetch(
`https://aerodatabox.p.rapidapi.com/flights/airports/iata/${iata}/${start}/${end}`,
{
headers:{
"X-RapidAPI-Key":API_KEY,
"X-RapidAPI-Host":"aerodatabox.p.rapidapi.com"
}
}
);

const data=await res.json();

return data.departures||[];

}catch(e){

console.log("Airport error",iata);

return[];

}

}

async function findFlights(){

let airportsToCheck=["GLA","DXB","BKK"];

let flights=[];

for(const airport of airportsToCheck){

let board=await getAirportBoard(airport);

for(const f of board){

if(tracked.includes(f.number)){
flights.push(f);
}

}

}

return flights;

}

function loadHistory(){

if(!fs.existsSync("history.json")) return[];

return JSON.parse(fs.readFileSync("history.json"));

}

function saveHistory(h){

fs.writeFileSync("history.json",JSON.stringify(h,null,2));

}

async function updateHistory(){

let history=loadHistory();

let flights=await findFlights();

for(const f of flights){

let last=[...history].reverse().find(h=>h.flight===f.number);

if(last && last.status===f.status) continue;

history.push({
time:new Date().toISOString(),
flight:f.number,
status:f.status
});

}

saveHistory(history);

}

app.get("/api/flights",async(req,res)=>{

let flights=await findFlights();

let result=[];

for(const f of flights){

let dep=airports[f.departure.airport.iata];
let arr=airports[f.arrival.airport.iata];

if(!dep||!arr) continue;

result.push({

number:f.number,
status:f.status,

departure:{
airport:{
name:dep.name,
location:{lat:dep.lat,lon:dep.lon}
},
scheduledTime:{local:f.departure.scheduledTime.local}
},

arrival:{
airport:{
name:arr.name,
location:{lat:arr.lat,lon:arr.lon}
},
scheduledTime:{local:f.arrival.scheduledTime.local}
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
