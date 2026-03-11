const express = require("express");
const path = require("path");

const app = express();

const API_KEY = "4e045393f0cd4f984be5368a93fe17fb";

app.use(express.static(path.join(__dirname,"public")));

const airports = {
GLA:{name:"Glasgow",lat:55.8719,lon:-4.43306},
DXB:{name:"Dubai",lat:25.2528,lon:55.3644},
BKK:{name:"Bangkok",lat:13.6900,lon:100.7501}
};

const routes = {
EK28:{from:"GLA",to:"DXB"},
EK376:{from:"DXB",to:"BKK"},
EK375:{from:"BKK",to:"DXB"},
EK27:{from:"DXB",to:"GLA"}
};

async function getFlight(flight){

try{

const res = await fetch(
`http://api.aviationstack.com/v1/flights?access_key=${API_KEY}&flight_iata=${flight}`
);

const data = await res.json();

if(data.data && data.data.length>0){
return data.data[0];
}

return null;

}catch(e){

console.log("API error",flight);
return null;

}

}

app.get("/api/flights",async(req,res)=>{

let result=[];

for(const flight in routes){

let api = await getFlight(flight);

let route = routes[flight];

let depAirport = airports[route.from];
let arrAirport = airports[route.to];

let status="Scheduled";
let depTime=null;
let arrTime=null;

if(api){

status = api.flight_status;

depTime = api.departure?.scheduled;
arrTime = api.arrival?.scheduled;

}

result.push({

number:flight,
status:status,

departure:{
airport:{
name:depAirport.name,
location:{
lat:depAirport.lat,
lon:depAirport.lon
}
},
scheduledTime:{local:depTime}
},

arrival:{
airport:{
name:arrAirport.name,
location:{
lat:arrAirport.lat,
lon:arrAirport.lon
}
},
scheduledTime:{local:arrTime}
}

});

}

res.json(result);

});

app.get("/nextflight",async(req,res)=>{

for(const flight of ["EK28","EK376","EK375","EK27"]){

let api = await getFlight(flight);

if(api){

return res.json({
flight:flight,
from:routes.from,
to:routes.to,
time:api.departure?.scheduled
});

}

}

res.json(null);

});

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
console.log("Leni's Flight Tracker running");
});
