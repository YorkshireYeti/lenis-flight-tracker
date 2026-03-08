const express = require("express");
const fs = require("fs");

const app = express();

const API_KEY = "e5025315camshdc195fde2ccf1d8p179bc9jsn2d3f77b33509";

app.use(express.static("public"));

const flights = ["EK28","EK376","EK375","EK27"];

function loadHistory(){

if(!fs.existsSync("history.json")){
return [];
}

return JSON.parse(fs.readFileSync("history.json"));

}

function saveHistory(history){

fs.writeFileSync("history.json",JSON.stringify(history,null,2));

}

async function getFlight(flight){

const today = new Date().toISOString().split("T")[0];

try{

const res = await fetch(
`https://aerodatabox.p.rapidapi.com/flights/number/${flight}/${today}?withLocation=true`,
{
headers:{
"X-RapidAPI-Key":API_KEY,
"X-RapidAPI-Host":"aerodatabox.p.rapidapi.com"
}
}
);

const data = await res.json();

if(Array.isArray(data) && data.length>0){
return data[0];
}

return null;

}catch(e){

console.log("API error:",flight);
return null;

}

}

app.get("/api/flights", async (req,res)=>{

let results=[];

for(let flight of flights){

let f = await getFlight(flight);

if(f){
results.push(f);
}

}

res.json(results);

});

async function updateHistory(){

let history = loadHistory();

for(let flight of flights){

let f = await getFlight(flight);

if(!f) continue;

let status = f.status || "unknown";

let lastEntry = [...history].reverse().find(h => h.flight === f.number);

if(lastEntry && lastEntry.status === status){
continue;
}

history.push({

time:new Date().toISOString(),
flight:f.number,
status:status

});

console.log("Logged change:",f.number,status);

}

saveHistory(history);

}

app.get("/history",(req,res)=>{

res.json(loadHistory());

});

updateHistory();
setInterval(updateHistory,300000);

app.listen(3000,()=>{

console.log("Leni's Flight Tracker running");
console.log("http://localhost:3000");

});
