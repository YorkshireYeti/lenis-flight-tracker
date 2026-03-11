const express = require("express");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname,"public")));

const airports = {
GLA:{name:"Glasgow",lat:55.8719,lon:-4.43306},
DXB:{name:"Dubai",lat:25.2528,lon:55.3644},
BKK:{name:"Bangkok",lat:13.6900,lon:100.7501}
};

const flights = {
EK28:{from:"GLA",to:"DXB",dep:"14:35",arr:"21:00"},
EK376:{from:"DXB",to:"BKK",dep:"22:35",arr:"07:40"},
EK375:{from:"BKK",to:"DXB",dep:"09:30",arr:"13:30"},
EK27:{from:"DXB",to:"GLA",dep:"14:15",arr:"18:45"}
};

function createTime(time){

let p=time.split(":");

let now=new Date();

let d=new Date(Date.UTC(
now.getUTCFullYear(),
now.getUTCMonth(),
now.getUTCDate(),
parseInt(p[0]),
parseInt(p[1]),
0
));

return d;

}

function getTimes(dep,arr){

let depTime=createTime(dep);
let arrTime=createTime(arr);

if(arrTime<depTime){
arrTime.setUTCDate(arrTime.getUTCDate()+1);
}

return{depTime,arrTime};

}

function getStatus(dep,arr){

let now=Date.now();
let t=getTimes(dep,arr);

if(now<t.depTime) return "Scheduled";
if(now>=t.depTime && now<=t.arrTime) return "In Progress";

return "Completed";

}

app.get("/api/flights",(req,res)=>{

let result=[];

for(const f in flights){

let s=flights[f];
let times=getTimes(s.dep,s.arr);

result.push({

number:f,
status:getStatus(s.dep,s.arr),

departure:{
airport:{
name:airports.name,
location:{
lat:airports.lat,
lon:airports.lon
}
},
scheduledTime:{local:times.depTime}
},

arrival:{
airport:{
name:airports.name,
location:{
lat:airports.lat,
lon:airports.lon
}
},
scheduledTime:{local:times.arrTime}
}

});

}

res.json(result);

});

app.get("/nextflight",(req,res)=>{

let now=Date.now();
let next=null;

for(const f in flights){

let s=flights[f];
let t=getTimes(s.dep,s.arr);

if(t.depTime>now){

if(!next || t.depTime<next.time){
next={flight:f,from:s.from,to:s.to,time:t.depTime};
}

}

}

res.json(next);

});

app.get("/history",(req,res)=>{
res.json([]);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
console.log("Flight tracker running");
});
