import { useState, useEffect, useRef } from "react";
import { supabase, adminLogin, getAllRides, getAllDrivers, updateDriverStatus, getPricing } from "./lib/supabase.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600;700&display=swap');`;

/* ── Themes ─────────────────────────────────────────── */
const mk = (bg,surface,card,border,text,textSub,textMuted,input,accent,accentSoft,accentGlow,green,greenSoft,blue,blueSoft,yellow,red,redSoft,map1,map2,mapRoad,mapRoadMain,overlay,phoneBorder,notchBg) =>
  ({bg,surface,card,border,text,textSub,textMuted,input,accent,accentSoft,accentGlow,green,greenSoft,blue,blueSoft,yellow,red,redSoft,map1,map2,mapRoad,mapRoadMain,overlay,phoneBorder,notchBg});

const D = mk("#0B0B0D","#141416","#1A1A1E","#252528","#F2EEE8","#8A8A96","#454550","#111113","#FF4D00","rgba(255,77,0,0.12)","rgba(255,77,0,0.22)","#00C566","rgba(0,197,102,0.12)","#3D7BFF","rgba(61,123,255,0.12)","#F5B301","#FF3B3B","rgba(255,59,59,0.1)","#111114","#161619","#222226","#2A2A30","rgba(11,11,13,0.93)","#1C1C20","#0B0B0D");
const L = mk("#F4F2EE","#FFFFFF","#FFFFFF","#E6E2D8","#111111","#666","#AAAAAA","#F0EDE6","#FF4D00","rgba(255,77,0,0.08)","rgba(255,77,0,0.18)","#00A855","rgba(0,168,85,0.1)","#2B6BE8","rgba(43,107,232,0.1)","#D99400","#E83030","rgba(232,48,48,0.08)","#E6E2D8","#EDE9E1","#F8F6F2","#FFFFFF","rgba(244,242,238,0.94)","#D8D4CC","#F4F2EE");

/* ── Mock Data ──────────────────────────────────────── */
const RIDES_H = [
  {id:1,from:"Sitabuldi",to:"Nagpur Airport",fare:245,dist:"12.4 km",date:"Today, 9:30 AM",vtype:"car",status:"done",driver:"Ramesh K.",rating:5,payment:"UPI"},
  {id:2,from:"Civil Lines",to:"Dharampeth",fare:78,dist:"4.1 km",date:"Yesterday, 6:15 PM",vtype:"auto",status:"done",driver:"Suresh M.",rating:4,payment:"Cash"},
  {id:3,from:"Ramdaspeth",to:"Wardha Road",fare:52,dist:"3.8 km",date:"Mar 19",vtype:"erick",status:"cancelled",driver:"—",rating:0,payment:"—"},
  {id:4,from:"Itwari",to:"Sadar Bazar",fare:61,dist:"2.9 km",date:"Mar 18",vtype:"auto",status:"done",driver:"Vijay P.",rating:5,payment:"UPI"},
];
const VEHICLES = [
  {id:"car",icon:"🚗",name:"Premier",type:"Sedan AC",eta:"3",price:"₹245",priceNum:245,desc:"Comfortable · 4 seats",tag:null},
  {id:"auto",icon:"🛺",name:"Auto",type:"3-Wheeler",eta:"2",price:"₹78",priceNum:78,desc:"Quick · 3 seats",tag:"POPULAR"},
  {id:"erick",icon:"⚡",name:"E-Ride",type:"Electric",eta:"4",price:"₹52",priceNum:52,desc:"Eco-friendly · 3 seats",tag:"CHEAPEST"},
];
const PROMOS = [
  {code:"FIRST50",desc:"50% off on first ride",discount:50,type:"percent",max:100,used:false,expiry:"Apr 30"},
  {code:"NAGPUR20",desc:"₹20 off in Nagpur",discount:20,type:"flat",max:20,used:false,expiry:"Mar 31"},
  {code:"WELCOME",desc:"Welcome bonus ₹30",discount:30,type:"flat",max:30,used:true,expiry:"Expired"},
];
const CHAT_INIT = [
  {from:"driver",text:"Namaste! I'm on my way 🚗",time:"9:31 AM"},
  {from:"user",text:"Ok bhai, main gate pe hun",time:"9:32 AM"},
  {from:"driver",text:"2 minutes mein pahunch raha hoon",time:"9:33 AM"},
];
const DRIVERS = [
  {id:1,name:"Ramesh Kumar",vehicle:"Maruti Swift",plate:"MH31-AB-1234",type:"car",rating:4.8,rides:342,earn:"₹24,600",status:"approved",phone:"98765-00001",joined:"Jan 2024",avatar:"RK",docsVerified:true},
  {id:2,name:"Suresh Mandal",vehicle:"Bajaj RE Auto",plate:"MH31-CD-5678",type:"auto",rating:4.5,rides:210,earn:"₹15,300",status:"pending",phone:"97654-00002",joined:"Mar 2024",avatar:"SM",docsVerified:false},
  {id:3,name:"Vijay Patil",vehicle:"Hero E-Rickshaw",plate:"MH31-EF-9012",type:"erick",rating:4.7,rides:156,earn:"₹11,200",status:"approved",phone:"96543-00003",joined:"Feb 2024",avatar:"VP",docsVerified:true},
  {id:4,name:"Dinesh Yadav",vehicle:"Maruti Dzire",plate:"MH31-GH-3456",type:"car",rating:3.9,rides:89,earn:"₹6,800",status:"rejected",phone:"95432-00004",joined:"Mar 2024",avatar:"DY",docsVerified:false},
  {id:5,name:"Pradeep Singh",vehicle:"Bajaj RE Auto",plate:"MH31-IJ-7890",type:"auto",rating:4.6,rides:198,earn:"₹14,700",status:"pending",phone:"94321-00005",joined:"Apr 2024",avatar:"PS",docsVerified:false},
];
const ADMIN_RIDES = [
  {id:"MC-001",user:"Priya S.",driver:"Ramesh K.",from:"Sitabuldi",to:"Airport",fare:245,status:"Completed",time:"9:30",vehicle:"🚗"},
  {id:"MC-002",user:"Amit T.",driver:"Vijay P.",from:"Dharampeth",to:"Civil Lines",fare:78,status:"Active",time:"10:15",vehicle:"⚡"},
  {id:"MC-003",user:"Neha M.",driver:"Suresh M.",from:"Wardha Rd",to:"Ramdaspeth",fare:61,status:"Completed",time:"8:45",vehicle:"🛺"},
  {id:"MC-004",user:"Ravi K.",driver:"—",from:"Sadar",to:"Itwari",fare:40,status:"Cancelled",time:"7:30",vehicle:"🚗"},
  {id:"MC-005",user:"Sneha D.",driver:"Ramesh K.",from:"Airport",to:"Civil Lines",fare:310,status:"Active",time:"10:50",vehicle:"🚗"},
  {id:"MC-006",user:"Kiran B.",driver:"Vijay P.",from:"AIIMS",to:"Sadar",fare:95,status:"Completed",time:"9:10",vehicle:"⚡"},
];

/* ── Atoms ──────────────────────────────────────────── */
const F = "'Bricolage Grotesque',sans-serif";
const FB = "'Instrument Sans',sans-serif";

function Pill({T,color,children,small}){
  const c=color||T.accent;
  return <span style={{padding:small?"2px 8px":"3px 11px",borderRadius:100,fontSize:small?9.5:10.5,fontWeight:700,background:`${c}18`,color:c,fontFamily:FB,letterSpacing:0.3,display:"inline-block"}}>{children}</span>;
}
function Av({text,size=44,color,T}){
  return <div style={{width:size,height:size,borderRadius:size*0.28,background:color||T.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:800,fontSize:size*0.33,color:color?T.text:T.accent,flexShrink:0,border:`1px solid ${T.border}`}}>{text}</div>;
}
function Btn({T,primary,full,danger,green:isGreen,children,onClick,disabled,small}){
  const bg = disabled?"#333":primary?T.accent:isGreen?T.green:danger?T.red:T.card;
  const sh = primary?`0 10px 28px ${T.accentGlow}`:isGreen?`0 10px 28px ${T.greenSoft}`:"none";
  return <button onClick={disabled?undefined:onClick} style={{width:full?"100%":"auto",padding:small?"9px 16px":"15px 22px",borderRadius:14,border:`1.5px solid ${disabled?"#333":primary||isGreen||danger?"transparent":T.border}`,cursor:disabled?"not-allowed":"pointer",background:bg,color:primary||isGreen||danger?"#fff":T.textSub,fontFamily:F,fontWeight:700,fontSize:small?13:15,boxShadow:sh,opacity:disabled?0.45:1,transition:"all 0.18s",letterSpacing:-0.2}}>{children}</button>;
}
function SBar({T}){
  return <div style={{padding:"13px 22px 0",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,color:T.textMuted,fontWeight:600}}>
    <span style={{fontFamily:F,fontWeight:700,fontSize:12}}>9:41</span>
    <div style={{display:"flex",gap:4,alignItems:"center",fontSize:10}}>▲▲▲ WiFi 🔋</div>
  </div>;
}
function PhoneShell({T,children}){
  return <div style={{width:375,minHeight:780,background:T.bg,borderRadius:48,border:`2px solid ${T.phoneBorder}`,overflow:"hidden",position:"relative",boxShadow:`0 60px 120px rgba(0,0,0,0.5),0 0 0 1px ${T.phoneBorder}`,margin:"0 auto"}}>
    <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:110,height:28,background:T.notchBg,borderRadius:"0 0 18px 18px",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
      <div style={{width:9,height:9,borderRadius:"50%",background:T.textMuted,opacity:0.4}}/>
      <div style={{width:38,height:4,borderRadius:3,background:T.textMuted,opacity:0.25}}/>
    </div>
    {children}
  </div>;
}
function BNav({T,tabs,active,onChange}){
  return <div style={{position:"absolute",bottom:0,left:0,right:0,background:T.overlay,backdropFilter:"blur(20px)",borderTop:`1px solid ${T.border}`,display:"flex",padding:"10px 0 26px",zIndex:50}}>
    {tabs.map(t=><button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
      <div style={{width:34,height:34,borderRadius:11,background:active===t.id?T.accentSoft:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
        <span style={{fontSize:17,filter:active===t.id?"none":"grayscale(1)",opacity:active===t.id?1:0.45}}>{t.icon}</span>
      </div>
      <span style={{fontSize:9,fontWeight:700,color:active===t.id?T.accent:T.textMuted,fontFamily:FB,letterSpacing:0.3,textTransform:"uppercase"}}>{t.label}</span>
    </button>)}
  </div>;
}
function BackBtn({T,onBack,title}){
  return <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px 10px"}}>
    <button onClick={onBack} style={{width:36,height:36,borderRadius:12,background:T.card,border:`1px solid ${T.border}`,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:T.text}}>←</button>
    <span style={{fontFamily:F,fontWeight:800,fontSize:19,letterSpacing:-0.4}}>{title}</span>
  </div>;
}

/* ── GPS Map ─────────────────────────────────────────── */
function GPSMap({T,showDriver=false,progress=0,compact=false,surge=1}){
  const [pulse,setPulse]=useState(0);
  const [car,setCar]=useState({x:80,y:165});
  const [surgeRings,setSurgeRings]=useState(0);
  useEffect(()=>{const i=setInterval(()=>setPulse(p=>(p+1)%100),50);return()=>clearInterval(i);},[]);
  useEffect(()=>{
    if(surge>1){const i=setInterval(()=>setSurgeRings(p=>(p+1)%60),60);return()=>clearInterval(i);}
  },[surge]);
  useEffect(()=>{
    if(showDriver){
      const path=[{x:80,y:165},{x:105,y:150},{x:135,y:135},{x:162,y:120},{x:185,y:106},{x:212,y:90},{x:242,y:74},{x:268,y:59},{x:290,y:50}];
      const idx=Math.min(Math.floor((progress/100)*path.length),path.length-1);
      setCar(path[idx]);
    }
  },[progress,showDriver]);
  const h=compact?195:238;
  return <svg viewBox={`0 0 375 ${h}`} style={{width:"100%",height:"100%",display:"block"}}>
    <defs>
      <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={T.map1}/><stop offset="100%" stopColor={T.map2}/></linearGradient>
      <radialGradient id="sg" cx="50%" cy="50%"><stop offset="0%" stopColor={T.yellow} stopOpacity="0.18"/><stop offset="100%" stopColor={T.yellow} stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="375" height={h} fill="url(#mg)"/>
    {[30,60,90,120,150,180].filter(y=>y<h).map(y=><line key={y} x1="0" y1={y} x2="375" y2={y} stroke={T.border} strokeWidth="0.5" opacity="0.35"/>)}
    {[40,80,120,160,200,240,280,320,360].map(x=><line key={x} x1={x} y1="0" x2={x} y2={h} stroke={T.border} strokeWidth="0.5" opacity="0.35"/>)}
    <rect x="0" y="96" width="375" height="20" fill={T.mapRoadMain}/>
    <rect x="0" y="49" width="375" height="11" fill={T.mapRoad}/>
    {!compact&&<rect x="0" y="165" width="375" height="9" fill={T.mapRoad}/>}
    <rect x="176" y="0" width="20" height={h} fill={T.mapRoadMain}/>
    <rect x="281" y="0" width="11" height={h} fill={T.mapRoad}/>
    <rect x="73" y="0" width="9" height={h} fill={T.mapRoad}/>
    {[20,65,115,165,215,265,315].map(x=>[0,1].map(o=><line key={x+o} x1={x+5} y1={100+o*6} x2={x+20} y2={100+o*6} stroke={T.textMuted} strokeWidth="1.1" opacity="0.25"/>))}
    {[[10,30,28,48],[36,20,21,60],[112,28,36,50],[222,28,26,48],[242,18,23,58],[312,26,40,50],[322,16,23,60],[10,128,23,40],[42,122,17,48],[117,126,30,43],[222,130,26,40],[316,126,36,43]].filter(([,y,,ht])=>y+ht<h+8).map(([x,y,w,ht],i)=><rect key={i} x={x} y={y} width={w} height={ht} fill={T.map1} rx="2" stroke={T.border} strokeWidth="0.5" opacity="0.7"/>)}
    <text x="22" y="24" fontSize="6.5" fill={T.textMuted} fontFamily={FB} fontWeight="600" opacity="0.55">SITABULDI</text>
    <text x="200" y="24" fontSize="6.5" fill={T.textMuted} fontFamily={FB} fontWeight="600" opacity="0.55">DHARAMPETH</text>
    {/* Surge overlay */}
    {surge>1&&<>
      <rect width="375" height={h} fill="url(#sg)" opacity="0.7"/>
      {[0,1,2].map(i=><circle key={i} cx="187" cy={h/2} r={40+i*30+(surgeRings%60)*0.8} fill="none" stroke={T.yellow} strokeWidth="1.2" opacity={0.12-i*0.03}/>)}
      <text x="12" y={h-10} fontSize="11" fontWeight="700" fill={T.yellow} fontFamily={FB} opacity="0.9">⚡ {surge.toFixed(1)}x Surge Active</text>
    </>}
    <path d="M 80 165 C 112 144 152 128 185 106 C 220 83 252 66 290 50" stroke={T.accent} strokeWidth="2.8" fill="none" strokeDasharray="7,4" opacity="0.88"/>
    {/* Pickup */}
    <circle cx="80" cy="165" r={10+(pulse%40)*0.35} fill={T.green} opacity="0.07"/>
    <circle cx="80" cy="165" r="18" fill={T.green} opacity="0.12"/>
    <circle cx="80" cy="165" r="7" fill={T.green}/>
    <circle cx="80" cy="165" r="3" fill="#fff"/>
    {/* Drop */}
    <circle cx="290" cy="50" r="10" fill={T.accent}/>
    <polygon points="290,62 284,52 296,52" fill={T.accent}/>
    <circle cx="290" cy="50" r="4" fill="#fff"/>
    {!showDriver&&[[140,142],[212,86],[157,58],[264,136]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="11" fill={T.accent} opacity="0.07"/><circle cx={x} cy={y} r="6" fill={T.card} stroke={T.accent} strokeWidth="1.5"/><text x={x} y={y+4} textAnchor="middle" fontSize="7" fill={T.accent}>▲</text></g>)}
    {showDriver&&<g><circle cx={car.x} cy={car.y} r="20" fill={T.accent} opacity="0.1"/><circle cx={car.x} cy={car.y} r="13" fill={T.card} stroke={T.accent} strokeWidth="2.5"/><text x={car.x} y={car.y+5} textAnchor="middle" fontSize="12">🚗</text></g>}
    <circle cx="80" cy="165" r={13+(pulse%50)*0.36} fill="none" stroke={T.green} strokeWidth="1" opacity={0.13-(pulse%50)*0.002}/>
  </svg>;
}

/* ══════════════════════════════════════════════════════
   SOS Modal
══════════════════════════════════════════════════════ */
function SOSModal({T,onClose}){
  const [phase,setPhase]=useState("confirm"); // confirm | counting | sent
  const [count,setCount]=useState(5);
  useEffect(()=>{
    if(phase==="counting"){
      if(count<=0){setPhase("sent");return;}
      const t=setTimeout(()=>setCount(c=>c-1),1000);
      return()=>clearTimeout(t);
    }
  },[phase,count]);
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
    <div style={{background:T.card,borderRadius:24,padding:"28px 24px",width:"100%",maxWidth:340,border:`2px solid ${T.red}`,textAlign:"center",boxShadow:`0 0 60px rgba(255,59,59,0.3)`}}>
      {phase==="confirm"&&<>
        <div style={{width:72,height:72,borderRadius:"50%",background:"rgba(255,59,59,0.15)",border:`3px solid ${T.red}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 18px"}}>🆘</div>
        <div style={{fontFamily:F,fontWeight:800,fontSize:22,color:T.red,marginBottom:8}}>Emergency SOS</div>
        <div style={{color:T.textSub,fontSize:13,fontFamily:FB,lineHeight:1.6,marginBottom:24}}>
          This will alert:<br/>
          <span style={{color:T.text,fontWeight:600}}>Police · Ambulance · Emergency Contact</span><br/>
          <span style={{color:T.textMuted,fontSize:12}}>Your location will be shared</span>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"13px",borderRadius:13,background:T.surface,border:`1px solid ${T.border}`,color:T.textSub,cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:14}}>Cancel</button>
          <button onClick={()=>{setPhase("counting");setCount(5);}} style={{flex:2,padding:"13px",borderRadius:13,background:T.red,border:"none",color:"#fff",cursor:"pointer",fontFamily:F,fontWeight:800,fontSize:14,boxShadow:`0 8px 24px rgba(255,59,59,0.35)`}}>🆘 Send SOS</button>
        </div>
      </>}
      {phase==="counting"&&<>
        <div style={{width:100,height:100,borderRadius:"50%",background:"rgba(255,59,59,0.12)",border:`3px solid ${T.red}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",flexDirection:"column"}}>
          <div style={{fontFamily:F,fontWeight:800,fontSize:42,color:T.red,lineHeight:1}}>{count}</div>
          <div style={{fontSize:10,color:T.textMuted,fontFamily:FB}}>seconds</div>
        </div>
        <div style={{fontFamily:F,fontWeight:700,fontSize:18,marginBottom:6}}>Sending SOS...</div>
        <div style={{color:T.textSub,fontSize:13,fontFamily:FB,marginBottom:24}}>Tap cancel to stop</div>
        <button onClick={onClose} style={{width:"100%",padding:"13px",borderRadius:13,background:T.surface,border:`1px solid ${T.border}`,color:T.red,cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:14}}>Cancel SOS</button>
      </>}
      {phase==="sent"&&<>
        <div style={{fontSize:52,marginBottom:14}}>✅</div>
        <div style={{fontFamily:F,fontWeight:800,fontSize:20,color:T.green,marginBottom:8}}>SOS Sent!</div>
        <div style={{color:T.textSub,fontSize:13,fontFamily:FB,lineHeight:1.7,marginBottom:22}}>
          Emergency services alerted<br/>
          <span style={{color:T.text,fontWeight:600}}>Current location shared</span><br/>
          Help is on the way!
        </div>
        <div style={{background:T.greenSoft,borderRadius:12,padding:"12px 14px",marginBottom:16,border:`1px solid ${T.green}30`}}>
          <div style={{fontSize:12,color:T.green,fontWeight:600,fontFamily:FB}}>Emergency Contacts Notified:</div>
          <div style={{fontSize:12,color:T.textSub,marginTop:4,fontFamily:FB}}>📞 Police: 100 · Ambulance: 108</div>
        </div>
        <button onClick={onClose} style={{width:"100%",padding:"13px",borderRadius:13,background:T.green,border:"none",color:"#fff",cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:14}}>Close</button>
      </>}
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════════
   In-App Chat
══════════════════════════════════════════════════════ */
function ChatScreen({T,onBack,driverName="Ramesh Kumar",isDriver=false}){
  const [msgs,setMsgs]=useState(CHAT_INIT);
  const [input,setInput]=useState("");
  const [typing,setTyping]=useState(false);
  const endRef=useRef();
  const QUICK = isDriver
    ? ["On my way!","2 min away","Arrived, please come","Cash only please"]
    : ["Ok coming","Wait 1 min","Where are you?","Please call me"];

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const send=(text)=>{
    if(!text.trim())return;
    const me=isDriver?"driver":"user";
    const them=isDriver?"user":"driver";
    const newMsg={from:me,text:text.trim(),time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})};
    setMsgs(m=>[...m,newMsg]);
    setInput("");
    setTyping(true);
    setTimeout(()=>{
      setTyping(false);
      const replies=isDriver
        ?["Ok bhai!","Theek hai","Samajh gaya","Aa raha hoon"]
        :["Haan bhai, 2 min","Ok coming","Wait kar raho","Pahunch gaya"];
      setMsgs(m=>[...m,{from:them,text:replies[Math.floor(Math.random()*replies.length)],time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}]);
    },1400);
  };

  return <div style={{display:"flex",flexDirection:"column",height:748}}>
    {/* Header */}
    <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${T.border}`,background:T.surface}}>
      <button onClick={onBack} style={{width:34,height:34,borderRadius:11,background:T.card,border:`1px solid ${T.border}`,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:T.text,flexShrink:0}}>←</button>
      <div style={{width:40,height:40,borderRadius:14,background:T.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
        {isDriver?"👩":"👨"}
      </div>
      <div style={{flex:1}}>
        <div style={{fontFamily:F,fontWeight:700,fontSize:15}}>{isDriver?"Priya Sharma":driverName}</div>
        <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:T.green}}/>
          <span style={{fontSize:11,color:T.green,fontFamily:FB,fontWeight:600}}>Online</span>
        </div>
      </div>
      <button style={{width:36,height:36,borderRadius:12,background:T.greenSoft,border:`1px solid ${T.green}30`,cursor:"pointer",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center"}}>📞</button>
    </div>

    {/* Messages */}
    <div style={{flex:1,overflowY:"auto",overflowX:"hidden",scrollbarWidth:"none",padding:"14px 14px 0"}}>
      <div style={{textAlign:"center",marginBottom:14}}>
        <span style={{background:T.surface,borderRadius:100,padding:"4px 14px",fontSize:11,color:T.textMuted,fontFamily:FB,border:`1px solid ${T.border}`}}>Today</span>
      </div>
      {msgs.map((m,i)=>{
        const isMe=(isDriver&&m.from==="driver")||(!isDriver&&m.from==="user");
        return <div key={i} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",marginBottom:10}}>
          {!isMe&&<div style={{width:28,height:28,borderRadius:10,background:T.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,marginRight:8,flexShrink:0,alignSelf:"flex-end"}}>
            {isDriver?"👩":"👨"}
          </div>}
          <div style={{maxWidth:"72%"}}>
            <div style={{background:isMe?T.accent:T.card,borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"10px 14px",border:isMe?"none":`1px solid ${T.border}`}}>
              <div style={{fontSize:14,color:isMe?"#fff":T.text,fontFamily:FB,lineHeight:1.4}}>{m.text}</div>
            </div>
            <div style={{fontSize:10,color:T.textMuted,fontFamily:FB,marginTop:3,textAlign:isMe?"right":"left"}}>{m.time}</div>
          </div>
        </div>;
      })}
      {typing&&<div style={{display:"flex",gap:8,marginBottom:10}}>
        <div style={{width:28,height:28,borderRadius:10,background:T.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{isDriver?"👩":"👨"}</div>
        <div style={{background:T.card,borderRadius:"18px 18px 18px 4px",padding:"12px 16px",border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",gap:4}}>
            {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:T.textMuted,animation:`bounce 1s ${i*0.2}s infinite`}}/>)}
          </div>
        </div>
      </div>}
      <div ref={endRef}/>
    </div>

    {/* Quick replies */}
    <div style={{padding:"8px 12px 4px",display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none"}}>
      {QUICK.map(q=><button key={q} onClick={()=>send(q)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:100,padding:"6px 13px",fontSize:11,color:T.textSub,cursor:"pointer",whiteSpace:"nowrap",fontFamily:FB,fontWeight:600,flexShrink:0}}>{q}</button>)}
    </div>

    {/* Input */}
    <div style={{padding:"8px 12px 28px",display:"flex",gap:8,borderTop:`1px solid ${T.border}`}}>
      <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send(input)}
        placeholder="Type a message..." style={{flex:1,background:T.input,border:`1.5px solid ${T.border}`,borderRadius:14,padding:"12px 14px",color:T.text,fontSize:14,outline:"none",fontFamily:FB}}/>
      <button onClick={()=>send(input)} style={{width:44,height:44,borderRadius:13,background:input.trim()?T.accent:T.card,border:`1px solid ${input.trim()?T.accent:T.border}`,cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,transition:"all 0.15s"}}>
        ➤
      </button>
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════════
   Promo Codes Screen
══════════════════════════════════════════════════════ */
function PromoScreen({T,onBack,onApply,applied}){
  const [input,setInput]=useState("");
  const [msg,setMsg]=useState(null);
  const tryCode=()=>{
    const found=PROMOS.find(p=>p.code===input.trim().toUpperCase()&&!p.used);
    if(found){setMsg({ok:true,text:`✅ "${found.code}" applied! Save ${found.type==="percent"?found.discount+"%":"₹"+found.discount}`});onApply(found);}
    else setMsg({ok:false,text:"❌ Invalid or expired code"});
  };
  return <div style={{padding:"0 0 32px"}}>
    <BackBtn T={T} onBack={onBack} title="Promo Codes"/>
    <div style={{padding:"0 18px"}}>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <input value={input} onChange={e=>setInput(e.target.value.toUpperCase())} placeholder="Enter promo code"
          style={{flex:1,background:T.input,border:`1.5px solid ${T.border}`,borderRadius:14,padding:"14px 16px",color:T.text,fontSize:15,outline:"none",fontFamily:FB,textTransform:"uppercase",letterSpacing:1,fontWeight:700}}/>
        <Btn T={T} primary onClick={tryCode}>Apply</Btn>
      </div>
      {msg&&<div style={{background:msg.ok?T.greenSoft:T.redSoft,border:`1px solid ${msg.ok?T.green+"30":T.red+"30"}`,borderRadius:12,padding:"11px 14px",marginBottom:16,fontSize:13,color:msg.ok?T.green:T.red,fontFamily:FB,fontWeight:600}}>{msg.text}</div>}
      <div style={{fontFamily:F,fontWeight:700,fontSize:15,marginBottom:12}}>Available Offers</div>
      {PROMOS.map(p=><div key={p.code} style={{background:T.card,borderRadius:16,border:`1.5px dashed ${p.used?T.border:T.accent}`,padding:"16px",marginBottom:10,opacity:p.used?0.5:1,display:"flex",gap:14,alignItems:"flex-start"}}>
        <div style={{width:44,height:44,borderRadius:14,background:p.used?T.surface:T.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
          {p.used?"❌":"🎫"}
        </div>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <span style={{fontFamily:F,fontWeight:800,fontSize:15,letterSpacing:0.5,color:T.accent}}>{p.code}</span>
            <Pill T={T} color={p.used?T.textMuted:T.green} small>{p.used?"Used":"Active"}</Pill>
          </div>
          <div style={{fontSize:13,color:T.text,fontFamily:FB,marginBottom:3}}>{p.desc}</div>
          <div style={{fontSize:11,color:T.textMuted,fontFamily:FB}}>Expires: {p.expiry}</div>
        </div>
        {!p.used&&<button onClick={()=>{setInput(p.code);}} style={{padding:"7px 14px",background:T.accentSoft,border:`1px solid ${T.accent}30`,borderRadius:10,color:T.accent,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:FB,flexShrink:0}}>Use</button>}
      </div>)}
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════════
   Schedule Ride Screen
══════════════════════════════════════════════════════ */
function ScheduleScreen({T,onBack,onSchedule}){
  const [date,setDate]=useState("");
  const [time,setTime]=useState("");
  const [from,setFrom]=useState("Sitabuldi, Nagpur");
  const [to,setTo]=useState("");
  const [selV,setSelV]=useState("auto");
  const [done,setDone]=useState(false);
  const today=new Date();
  const minDate=today.toISOString().split("T")[0];
  const minTime=`${today.getHours().toString().padStart(2,"0")}:${today.getMinutes().toString().padStart(2,"0")}`;

  if(done) return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:680,padding:40,textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:20}}>📅</div>
    <div style={{fontFamily:F,fontWeight:800,fontSize:24,marginBottom:10,letterSpacing:-0.4}}>Ride Scheduled!</div>
    <div style={{color:T.textSub,fontSize:14,fontFamily:FB,lineHeight:1.7,marginBottom:28}}>
      Your ride is booked for<br/>
      <span style={{color:T.text,fontWeight:700}}>{date} at {time}</span><br/>
      {from} → {to||"Airport"}<br/>
      <span style={{color:T.accent,fontWeight:700}}>{VEHICLES.find(v=>v.id===selV)?.price}</span>
    </div>
    <div style={{background:T.card,borderRadius:16,border:`1px solid ${T.border}`,padding:"14px 20px",marginBottom:24,width:"100%"}}>
      <div style={{fontSize:12,color:T.textMuted,fontFamily:FB,marginBottom:8}}>You'll get a notification 30 min before</div>
      <div style={{display:"flex",gap:6,justifyContent:"center"}}>
        {["📱 SMS","📧 Email","🔔 App"].map(n=><Pill key={n} T={T} color={T.blue} small>{n}</Pill>)}
      </div>
    </div>
    <Btn T={T} primary full onClick={onBack}>Back to Home</Btn>
  </div>;

  return <div style={{padding:"0 0 32px",height:748,overflowY:"auto",scrollbarWidth:"none"}}>
    <BackBtn T={T} onBack={onBack} title="Schedule a Ride"/>
    <div style={{padding:"0 18px"}}>
      {/* Route */}
      <div style={{background:T.card,border:`1.5px solid ${T.border}`,borderRadius:16,overflow:"hidden",marginBottom:14}}>
        {[["🟢","Pickup",from,setFrom],["🟧","Drop to","Where are you going?",setTo]].map(([ic,label,ph,setter],i)=>(
          <div key={i} style={{padding:"13px 16px",borderBottom:i===0?`1px solid ${T.border}`:"none",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:12}}>{ic}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:T.textMuted,fontFamily:FB,fontWeight:700,textTransform:"uppercase",letterSpacing:0.4,marginBottom:2}}>{label}</div>
              <input value={i===0?from:to} onChange={e=>setter(e.target.value)} placeholder={ph}
                style={{background:"transparent",border:"none",outline:"none",color:T.text,fontSize:14,width:"100%",fontFamily:FB}}/>
            </div>
          </div>
        ))}
      </div>
      {/* Date & Time */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[["📅","Date","date",date,setDate,minDate],["⏰","Time","time",time,setTime,minTime]].map(([ic,lb,type,val,setter,min])=>(
          <div key={lb} style={{background:T.card,border:`1.5px solid ${T.border}`,borderRadius:14,padding:"14px 14px"}}>
            <div style={{fontSize:10,color:T.textMuted,fontFamily:FB,fontWeight:700,textTransform:"uppercase",letterSpacing:0.4,marginBottom:8}}>{ic} {lb}</div>
            <input type={type} value={val} min={min} onChange={e=>setter(e.target.value)}
              style={{background:"transparent",border:"none",outline:"none",color:T.text,fontSize:13,width:"100%",fontFamily:FB,fontWeight:600}}/>
          </div>
        ))}
      </div>
      {/* Vehicle */}
      <div style={{fontFamily:FB,fontSize:11,fontWeight:700,color:T.textMuted,letterSpacing:0.8,textTransform:"uppercase",marginBottom:10}}>Choose Vehicle</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
        {VEHICLES.map(v=><div key={v.id} onClick={()=>setSelV(v.id)} style={{background:selV===v.id?T.card:T.input,border:`1.5px solid ${selV===v.id?T.accent:T.border}`,borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",boxShadow:selV===v.id?`0 0 0 3px ${T.accentSoft}`:"none",transition:"all 0.15s"}}>
          <span style={{fontSize:26,width:32,textAlign:"center"}}>{v.icon}</span>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontFamily:F,fontWeight:700,fontSize:14}}>{v.name}</span>
              {v.tag&&<span style={{fontSize:9,fontWeight:800,background:T.accent,color:"#fff",padding:"2px 6px",borderRadius:4}}>{v.tag}</span>}
            </div>
            <div style={{fontSize:11,color:T.textSub,marginTop:1,fontFamily:FB}}>{v.desc} · {v.eta} min</div>
          </div>
          <span style={{fontFamily:F,fontWeight:800,fontSize:16,color:selV===v.id?T.accent:T.text}}>{v.price}</span>
        </div>)}
      </div>
      <Btn T={T} primary full disabled={!date||!time||!to} onClick={()=>setDone(true)}>
        Schedule Ride — {VEHICLES.find(v=>v.id===selV)?.price}
      </Btn>
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════════
   USER APP
══════════════════════════════════════════════════════ */
function UserApp({T}){
  const [screen,setScreen]=useState("login");
  const [tab,setTab]=useState("home");
  const [phone,setPhone]=useState("");
  const [otpSent,setOtpSent]=useState(false);
  const [otp,setOtp]=useState(["","","",""]);
  const [selV,setSelV]=useState("auto");
  const [toInput,setToInput]=useState("");
  const [finding,setFinding]=useState(false);
  const [rideProgress,setRideProgress]=useState(0);
  const [ridePhase,setRidePhase]=useState("arriving");
  const [showSOS,setShowSOS]=useState(false);
  const [appliedPromo,setAppliedPromo]=useState(null);
  const [surge]=useState(1.4);
  const refs=[useRef(),useRef(),useRef(),useRef()];

  const handleOtp=(i,v)=>{if(!/^\d*$/.test(v))return;const n=[...otp];n[i]=v.slice(-1);setOtp(n);if(v&&i<3)refs[i+1].current?.focus();};

  useEffect(()=>{if(finding){const t=setTimeout(()=>{setFinding(false);setScreen("tracking");setRideProgress(0);setRidePhase("arriving");},3000);return()=>clearTimeout(t);}});
  useEffect(()=>{
    if(screen==="tracking"){
      setRideProgress(0);
      const i=setInterval(()=>setRideProgress(p=>{if(p>=100){clearInterval(i);setRidePhase("done");return 100;}if(p>=40)setRidePhase("riding");return p+0.7;}),110);
      return()=>clearInterval(i);
    }
  },[screen]);

  const scrollRef=useRef();
  const selVehicle=VEHICLES.find(v=>v.id===selV);
  const basePrice=selVehicle?.priceNum||78;
  const discountAmt=appliedPromo?(appliedPromo.type==="percent"?Math.min(Math.round(basePrice*appliedPromo.discount/100),appliedPromo.max):appliedPromo.discount):0;
  const finalPrice=Math.max(basePrice-discountAmt,0);

  // Sub-screens
  if(screen==="chat") return <PhoneShell T={T}><SBar T={T}/><div style={{height:748,overflowY:"auto",scrollbarWidth:"none"}}><ChatScreen T={T} onBack={()=>setScreen("tracking")}/></div></PhoneShell>;
  if(screen==="promo") return <PhoneShell T={T}><SBar T={T}/><div style={{height:748,overflowY:"auto",scrollbarWidth:"none"}}><PromoScreen T={T} onBack={()=>setScreen("home")} onApply={setAppliedPromo} applied={appliedPromo}/></div></PhoneShell>;
  if(screen==="schedule") return <PhoneShell T={T}><SBar T={T}/><div style={{height:748,overflowY:"auto",scrollbarWidth:"none"}}><ScheduleScreen T={T} onBack={()=>setScreen("home")} onSchedule={()=>setScreen("home")}/></div></PhoneShell>;

  return <PhoneShell T={T}>
    <SBar T={T}/>
    {showSOS&&<SOSModal T={T} onClose={()=>setShowSOS(false)}/>}
    <div ref={scrollRef} style={{height:748,overflowY:"auto",overflowX:"hidden",scrollbarWidth:"none",paddingBottom:["home","history","profile"].includes(screen)&&!finding?80:0}}>

      {/* LOGIN */}
      {screen==="login"&&<div style={{padding:"28px 22px 32px"}}>
        <div style={{marginBottom:38}}>
          <div style={{width:56,height:56,borderRadius:18,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,marginBottom:18,boxShadow:`0 12px 28px ${T.accentGlow}`}}>🚕</div>
          <div style={{fontFamily:F,fontSize:30,fontWeight:800,letterSpacing:-0.7,lineHeight:1.15}}>
            {!otpSent?"What's your number?":"Enter the code"}
          </div>
          <div style={{color:T.textSub,fontSize:13,marginTop:8,fontFamily:FB,lineHeight:1.5}}>
            {!otpSent?"We'll send you a verification code":`Sent to +91 ${phone} · `}
            {otpSent&&<span style={{color:T.accent,cursor:"pointer",fontWeight:600}} onClick={()=>{setOtpSent(false);setOtp(["","","",""]);setPhone("");}}>Change</span>}
          </div>
        </div>
        {!otpSent?<>
          <div style={{background:T.input,border:`1.5px solid ${T.border}`,borderRadius:16,display:"flex",alignItems:"center",overflow:"hidden",marginBottom:14}}>
            <div style={{padding:"17px 14px",borderRight:`1px solid ${T.border}`,color:T.textSub,fontSize:14,fontWeight:600,whiteSpace:"nowrap"}}>🇮🇳 +91</div>
            <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="10-digit mobile number"
              style={{background:"transparent",border:"none",outline:"none",padding:"17px 14px",color:T.text,fontSize:16,flex:1,fontFamily:FB}}/>
          </div>
          <Btn T={T} primary full disabled={phone.length!==10} onClick={()=>setOtpSent(true)}>Continue →</Btn>
        </>:<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:18}}>
            {otp.map((d,i)=><input key={i} ref={refs[i]} value={d} onChange={e=>handleOtp(i,e.target.value)} maxLength={1}
              style={{width:"100%",height:64,background:d?T.accentSoft:T.input,border:`2px solid ${d?T.accent:T.border}`,borderRadius:15,textAlign:"center",fontSize:26,fontWeight:800,color:T.text,outline:"none",fontFamily:F,transition:"all 0.15s",boxSizing:"border-box"}}/>)}
          </div>
          <Btn T={T} primary full disabled={otp.join("").length!==4} onClick={()=>setScreen("home")}>Verify & Continue →</Btn>
          <div style={{textAlign:"center",marginTop:14,color:T.textSub,fontSize:13,fontFamily:FB}}>Didn't get it? <span style={{color:T.accent,fontWeight:600,cursor:"pointer"}}>Resend code</span></div>
        </>}
        <div style={{marginTop:28,background:T.input,borderRadius:12,border:`1px solid ${T.border}`,padding:"14px 16px"}}>
          <div style={{fontSize:10,color:T.textMuted,fontWeight:700,letterSpacing:0.5,marginBottom:6,textTransform:"uppercase",fontFamily:FB}}>Demo Login</div>
          <div style={{fontSize:13,color:T.textSub,fontFamily:FB,lineHeight:1.7}}>
            Phone: <b style={{color:T.text}}>9876500001</b>&nbsp;&nbsp;OTP: <b style={{color:T.accent}}>Any 4 digits</b>
          </div>
        </div>
      </div>}

      {/* HOME */}
      {screen==="home"&&!finding&&<div>
        <div style={{height:238,position:"relative",overflow:"hidden"}}>
          <GPSMap T={T} surge={surge}/>
          <div style={{position:"absolute",top:10,left:14,right:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{background:T.overlay,backdropFilter:"blur(12px)",borderRadius:11,padding:"7px 13px",border:`1px solid ${T.border}`}}>
              <div style={{fontFamily:F,fontWeight:800,fontSize:14}}>MyCity<span style={{color:T.accent}}>Ride</span></div>
            </div>
            <div style={{display:"flex",gap:8}}>
              {surge>1&&<div style={{background:"rgba(245,179,1,0.9)",borderRadius:11,padding:"6px 12px",fontSize:11,fontWeight:700,color:"#000"}}>⚡ {surge}x Surge</div>}
              <div style={{background:T.overlay,backdropFilter:"blur(12px)",borderRadius:11,padding:"7px 12px",border:`1px solid ${T.border}`,fontSize:11,color:T.textSub,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
                <span style={{color:T.green,fontSize:9}}>⬤</span> Nagpur
              </div>
            </div>
          </div>
          <div style={{position:"absolute",bottom:10,left:14,display:"flex",gap:8}}>
            <div style={{background:T.overlay,backdropFilter:"blur(12px)",borderRadius:9,padding:"5px 11px",border:`1px solid ${T.border}`,fontSize:11,color:T.textSub,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
              <span style={{color:T.green,fontSize:9,animation:"pulse 1.5s infinite"}}>⬤</span> Sitabuldi, Nagpur
            </div>
          </div>
        </div>

        <div style={{padding:"14px 16px 0"}}>
          {/* Quick actions */}
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <div onClick={()=>setScreen("schedule")} style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"12px 10px",textAlign:"center",cursor:"pointer",transition:"all 0.15s"}}>
              <div style={{fontSize:20,marginBottom:4}}>📅</div>
              <div style={{fontSize:10,fontWeight:700,color:T.textSub,fontFamily:FB}}>Schedule</div>
            </div>
            <div onClick={()=>setScreen("promo")} style={{flex:1,background:appliedPromo?T.greenSoft:T.card,border:`1.5px solid ${appliedPromo?T.green:T.border}`,borderRadius:14,padding:"12px 10px",textAlign:"center",cursor:"pointer",position:"relative"}}>
              <div style={{fontSize:20,marginBottom:4}}>🎫</div>
              <div style={{fontSize:10,fontWeight:700,color:appliedPromo?T.green:T.textSub,fontFamily:FB}}>Promo</div>
              {appliedPromo&&<div style={{position:"absolute",top:-5,right:-5,width:16,height:16,borderRadius:"50%",background:T.green,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800}}>✓</div>}
            </div>
            <div onClick={()=>setShowSOS(true)} style={{flex:1,background:T.redSoft,border:`1px solid ${T.red}30`,borderRadius:14,padding:"12px 10px",textAlign:"center",cursor:"pointer"}}>
              <div style={{fontSize:20,marginBottom:4}}>🆘</div>
              <div style={{fontSize:10,fontWeight:700,color:T.red,fontFamily:FB}}>SOS</div>
            </div>
          </div>

          {/* Where to */}
          <div style={{background:T.input,border:`1.5px solid ${T.border}`,borderRadius:14,padding:"14px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
            <div style={{width:9,height:9,borderRadius:3,background:T.accent,flexShrink:0}}/>
            <span style={{color:toInput?T.text:T.textMuted,fontSize:14,fontFamily:FB,flex:1}}>{toInput||"Where are you going?"}</span>
            <span style={{fontSize:17,opacity:0.4}}>🔍</span>
          </div>
          <div style={{display:"flex",gap:7,marginBottom:14,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
            {[["🏢","Office"],["🏠","Home"],["✈️","Airport"],["🏥","AIIMS"],["🛍️","Mall"]].map(([ic,lb])=>(
              <div key={lb} onClick={()=>setToInput(lb)} style={{background:toInput===lb?T.accentSoft:T.card,border:`1px solid ${toInput===lb?T.accent:T.border}`,borderRadius:100,padding:"7px 14px",display:"flex",alignItems:"center",gap:5,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s"}}>
                <span style={{fontSize:13}}>{ic}</span>
                <span style={{fontSize:11,fontWeight:600,color:toInput===lb?T.accent:T.textSub,fontFamily:FB}}>{lb}</span>
              </div>
            ))}
          </div>

          {/* Vehicles */}
          <div style={{fontSize:10,color:T.textMuted,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",marginBottom:9,fontFamily:FB}}>Choose a ride</div>
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:13}}>
            {VEHICLES.map(v=>{
              const sPrice=surge>1?Math.round(v.priceNum*surge):v.priceNum;
              return <div key={v.id} onClick={()=>setSelV(v.id)} style={{background:selV===v.id?T.card:T.input,border:`1.5px solid ${selV===v.id?T.accent:T.border}`,borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:11,cursor:"pointer",transition:"all 0.15s",boxShadow:selV===v.id?`0 0 0 3px ${T.accentSoft}`:"none"}}>
                <span style={{fontSize:28,width:34,textAlign:"center"}}>{v.icon}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <span style={{fontFamily:F,fontWeight:700,fontSize:14}}>{v.name}</span>
                    {v.tag&&<span style={{fontSize:8,fontWeight:800,background:T.accent,color:"#fff",padding:"2px 6px",borderRadius:4}}>{v.tag}</span>}
                  </div>
                  <div style={{fontSize:11,color:T.textSub,marginTop:2,fontFamily:FB}}>{v.desc} · ⏱ {v.eta} min</div>
                </div>
                <div style={{textAlign:"right"}}>
                  {surge>1&&<div style={{fontSize:10,color:T.textMuted,textDecoration:"line-through",fontFamily:FB}}>{v.price}</div>}
                  <div style={{fontFamily:F,fontWeight:800,fontSize:16,color:selV===v.id?T.accent:T.text}}>₹{sPrice}</div>
                </div>
              </div>;
            })}
          </div>

          {/* Fare & Promo */}
          <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"13px 14px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.5,fontFamily:FB}}>Fare Details</span>
              {surge>1&&<span style={{fontSize:10,fontWeight:700,color:T.yellow,background:`${T.yellow}18`,padding:"2px 9px",borderRadius:100,fontFamily:FB}}>⚡ Surge {surge}x</span>}
            </div>
            {[["Base fare",`₹${selVehicle?.priceNum||78}`],["Surge ("+surge+"x)",surge>1?`+₹${Math.round((selVehicle?.priceNum||78)*(surge-1))}`:"—"],[`Promo ${appliedPromo?"("+appliedPromo.code+")":""}`,appliedPromo?`-₹${discountAmt}`:"—"]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.textSub,marginBottom:6,fontFamily:FB}}>
                <span>{l}</span><span style={{color:v.startsWith("-")?T.green:T.text,fontWeight:500}}>{v}</span>
              </div>
            ))}
            <div style={{borderTop:`1px solid ${T.border}`,paddingTop:9,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontFamily:F,fontWeight:700,fontSize:14}}>Total</span>
              <span style={{fontFamily:F,fontWeight:800,fontSize:20,color:T.accent}}>₹{Math.round((selVehicle?.priceNum||78)*surge)-discountAmt}</span>
            </div>
          </div>

          <div style={{display:"flex",gap:8,marginBottom:13}}>
            {["💵 Cash","📱 UPI","👛 Wallet"].map(p=><div key={p} style={{flex:1,background:T.input,border:`1px solid ${T.border}`,borderRadius:11,padding:"9px 6px",textAlign:"center",cursor:"pointer"}}>
              <div style={{fontSize:16,marginBottom:2}}>{p.split(" ")[0]}</div>
              <div style={{fontSize:9,fontWeight:700,color:T.textSub,fontFamily:FB}}>{p.split(" ")[1]}</div>
            </div>)}
          </div>
          <Btn T={T} primary full onClick={()=>setFinding(true)}>Book {selVehicle?.name} · ₹{Math.round((selVehicle?.priceNum||78)*surge)-discountAmt}</Btn>
        </div>
      </div>}

      {/* FINDING */}
      {finding&&<FindingDriver T={T}/>}

      {/* TRACKING */}
      {screen==="tracking"&&<UserTracking T={T} progress={rideProgress} phase={ridePhase} onHome={()=>{setScreen("home");setTab("home");}} onChat={()=>setScreen("chat")} onSOS={()=>setShowSOS(true)}/>}

      {/* HISTORY */}
      {screen==="history"&&<div style={{padding:"16px 16px"}}>
        <div style={{fontFamily:F,fontWeight:800,fontSize:22,marginBottom:18,letterSpacing:-0.4}}>Your Rides</div>
        {RIDES_H.map(r=><div key={r.id} style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"14px",marginBottom:9,transition:"all 0.15s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9}}>
            <div>
              <div style={{fontWeight:700,fontSize:14,fontFamily:F}}>{r.from} → {r.to}</div>
              <div style={{color:T.textMuted,fontSize:11,marginTop:3,fontFamily:FB}}>{r.date} · {r.dist}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:F,fontWeight:800,fontSize:15}}>₹{r.fare}</div>
              <Pill T={T} color={r.status==="done"?T.green:T.red} small>{r.status==="done"?"Done":"Cancelled"}</Pill>
            </div>
          </div>
          {r.status==="done"&&<div style={{borderTop:`1px solid ${T.border}`,paddingTop:9,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:T.textSub,fontFamily:FB}}>👤 {r.driver} · {r.payment}</span>
            <span style={{fontSize:12}}>{"⭐".repeat(r.rating)}</span>
          </div>}
        </div>)}
      </div>}

      {/* PROFILE */}
      {screen==="profile"&&<div style={{padding:"16px 16px"}}>
        <div style={{background:T.card,borderRadius:18,border:`1px solid ${T.border}`,padding:"18px",marginBottom:14,display:"flex",gap:14,alignItems:"center"}}>
          <div style={{width:60,height:60,borderRadius:20,background:`linear-gradient(135deg,${T.accent},#FF8040)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>👩</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:F,fontWeight:800,fontSize:18}}>Priya Sharma</div>
            <div style={{color:T.textSub,fontSize:12,marginTop:2,fontFamily:FB}}>+91 98765-00001</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:F,fontWeight:800,fontSize:18,color:T.accent}}>4.9</div>
            <div style={{fontSize:10,color:T.textMuted,fontFamily:FB}}>⭐ Rating</div>
          </div>
        </div>
        <div style={{display:"flex",gap:9,marginBottom:16}}>
          {[["12","Rides"],["₹940","Spent"],["3","Promos"]].map(([v,l])=><div key={l} style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"13px 0",textAlign:"center"}}>
            <div style={{fontFamily:F,fontWeight:800,fontSize:20,color:T.accent}}>{v}</div>
            <div style={{fontSize:10,color:T.textMuted,marginTop:3,fontFamily:FB}}>{l}</div>
          </div>)}
        </div>
        {[["🎫","Promo Codes","2 active",()=>setScreen("promo")],["📅","Scheduled Rides","1 upcoming",()=>setScreen("schedule")],["💳","Payments","UPI, Cash",null],["🔔","Notifications","On",null],["🔐","Security","Verified",null],["❓","Help & Support","",null],["🚪","Sign Out","",null,true]].map(([ic,lb,val,action,red])=>(
          <div key={lb} onClick={action} style={{background:T.card,borderRadius:13,border:`1px solid ${T.border}`,padding:"14px 14px",marginBottom:7,display:"flex",alignItems:"center",gap:11,cursor:"pointer"}}>
            <span style={{fontSize:18}}>{ic}</span>
            <span style={{flex:1,fontWeight:600,fontSize:13,color:red?T.red:T.text,fontFamily:FB}}>{lb}</span>
            {val&&<span style={{color:T.textMuted,fontSize:11,fontFamily:FB}}>{val}</span>}
            <span style={{color:T.textMuted,fontSize:17,opacity:0.4}}>›</span>
          </div>
        ))}
      </div>}
    </div>

    {["home","history","profile"].includes(screen)&&!finding&&(
      <BNav T={T} active={tab}
        tabs={[{id:"home",icon:"🏠",label:"Home"},{id:"history",icon:"🗂",label:"Rides"},{id:"profile",icon:"👤",label:"Profile"}]}
        onChange={t=>{setTab(t);setScreen(t==="history"?"history":t==="profile"?"profile":"home");}}/>
    )}
  </PhoneShell>;
}

function FindingDriver({T}){
  const [d,setD]=useState(0);const [r,setR]=useState(0);
  useEffect(()=>{const a=setInterval(()=>setD(p=>(p+1)%4),500);const b=setInterval(()=>setR(p=>(p+2)%100),40);return()=>{clearInterval(a);clearInterval(b);};},[]);
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:700,padding:40,textAlign:"center"}}>
    <div style={{position:"relative",width:160,height:160,marginBottom:32}}>
      <svg viewBox="0 0 160 160" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
        <circle cx="80" cy="80" r="70" stroke={T.border} strokeWidth="2" fill="none"/>
        <circle cx="80" cy="80" r="70" stroke={T.accent} strokeWidth="2.5" fill="none" strokeDasharray="440" strokeDashoffset={440-(r/100)*440} strokeLinecap="round" transform="rotate(-90 80 80)"/>
        <circle cx="80" cy="80" r="52" stroke={T.accentSoft} strokeWidth="38" fill="none" opacity="0.3"/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:44}}>🚕</div>
    </div>
    <div style={{fontFamily:F,fontSize:24,fontWeight:800,letterSpacing:-0.5,marginBottom:10}}>Finding driver{".".repeat(d)}</div>
    <div style={{color:T.textSub,fontSize:14,fontFamily:FB,lineHeight:1.7}}>Connecting with nearby drivers<br/>in Sitabuldi, Nagpur</div>
    <div style={{display:"flex",gap:7,marginTop:26}}>{[0,1,2,3,4].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:Math.floor(r/20)%5===i?T.accent:T.border,transition:"background 0.3s"}}/>)}</div>
  </div>;
}

function UserTracking({T,progress,phase,onHome,onChat,onSOS}){
  const info={
    arriving:{label:"Driver arriving",color:T.blue,sub:"Ramesh is 2 min away"},
    riding:{label:"Ride in progress",color:T.green,sub:"On the way to Nagpur Airport"},
    done:{label:"Arrived! ✓",color:T.green,sub:"You've reached your destination"},
  }[phase];
  return <div>
    <div style={{height:238,position:"relative",overflow:"hidden"}}>
      <GPSMap T={T} showDriver progress={progress}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:T.border}}>
        <div style={{width:`${progress}%`,height:"100%",background:`linear-gradient(90deg,${T.accent},#FF8040)`,transition:"width 0.2s"}}/>
      </div>
      {/* SOS floating button on map */}
      <button onClick={onSOS} style={{position:"absolute",top:10,right:12,background:"rgba(255,59,59,0.9)",backdropFilter:"blur(8px)",border:"none",borderRadius:12,padding:"7px 13px",color:"#fff",cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:12,boxShadow:"0 4px 16px rgba(255,59,59,0.4)"}}>🆘 SOS</button>
    </div>
    <div style={{padding:"14px 16px"}}>
      <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:11}}>
        <div style={{width:9,height:9,borderRadius:"50%",background:info.color,flexShrink:0,boxShadow:`0 0 8px ${info.color}`}}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,color:info.color,fontSize:13,fontFamily:F}}>{info.label}</div>
          <div style={{fontSize:11,color:T.textSub,marginTop:2,fontFamily:FB}}>{info.sub}</div>
        </div>
        <div style={{fontFamily:F,fontWeight:800,color:T.textMuted,fontSize:12}}>{Math.max(0,Math.ceil((100-progress)*0.05))} min</div>
      </div>
      <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"13px 14px",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          <div style={{width:48,height:48,borderRadius:16,background:T.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>👨</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:F,fontWeight:800,fontSize:15}}>Ramesh Kumar</div>
            <div style={{color:T.textSub,fontSize:11,marginTop:2,fontFamily:FB}}>⭐ 4.8 · MH31-AB-1234</div>
          </div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={onChat} style={{width:37,height:37,borderRadius:12,background:T.blueSoft,border:`1px solid ${T.blue}30`,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>💬</button>
            <button style={{width:37,height:37,borderRadius:12,background:T.greenSoft,border:`1px solid ${T.green}30`,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>📞</button>
          </div>
        </div>
      </div>
      <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"12px 14px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.textSub,marginBottom:8,fontFamily:FB}}><span>📍 Sitabuldi</span><span>✈️ Airport</span></div>
        <div style={{height:5,background:T.border,borderRadius:3,overflow:"hidden"}}>
          <div style={{width:`${progress}%`,height:"100%",background:`linear-gradient(90deg,${T.accent},#FF8040)`,borderRadius:3,transition:"width 0.3s"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:11,color:T.textMuted,fontFamily:FB}}><span>12.4 km</span><span style={{color:T.accent,fontWeight:700}}>₹245</span></div>
      </div>
      {phase==="done"&&<div>
        <div style={{background:T.card,borderRadius:14,border:`1.5px solid ${T.green}40`,padding:"18px",textAlign:"center",marginBottom:12}}>
          <div style={{fontSize:38,marginBottom:8}}>🎉</div>
          <div style={{fontFamily:F,fontWeight:800,fontSize:19,color:T.green,marginBottom:5}}>Ride Complete!</div>
          <div style={{color:T.textSub,fontSize:13,marginBottom:14,fontFamily:FB}}>Paid ₹245 via UPI · Thank you!</div>
          <div style={{fontFamily:FB,fontSize:13,color:T.textSub,marginBottom:8}}>Rate your experience</div>
          <div style={{display:"flex",justifyContent:"center",gap:6}}>{[1,2,3,4,5].map(i=><span key={i} style={{fontSize:28,cursor:"pointer",opacity:i<=4?1:0.3}}>⭐</span>)}</div>
        </div>
        <Btn T={T} primary full onClick={onHome}>Back to Home</Btn>
      </div>}
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════════
   DRIVER APP
══════════════════════════════════════════════════════ */
function DriverApp({T}){
  const [screen,setScreen]=useState("login");
  const [tab,setTab]=useState("home");
  const [phone,setPhone]=useState("");
  const [otp,setOtp]=useState(["","","",""]);
  const [otpSent,setOtpSent]=useState(false);
  const [online,setOnline]=useState(false);
  const [rideReq,setRideReq]=useState(false);
  const [timer,setTimer]=useState(20);
  const [activeRide,setActiveRide]=useState(false);
  const [rideProgress,setRideProgress]=useState(0);
  const [showChat,setShowChat]=useState(false);
  const [showSOS,setShowSOS]=useState(false);
  const refs=[useRef(),useRef(),useRef(),useRef()];

  const handleOtp=(i,v)=>{if(!/^\d*$/.test(v))return;const n=[...otp];n[i]=v.slice(-1);setOtp(n);if(v&&i<3)refs[i+1].current?.focus();};

  useEffect(()=>{if(online&&!rideReq&&!activeRide&&screen==="home"){const t=setTimeout(()=>{setRideReq(true);setTimer(20);},3500);return()=>clearTimeout(t);}});
  useEffect(()=>{if(!rideReq)return;if(timer<=0){setRideReq(false);setTimeout(()=>{if(online&&!activeRide){setRideReq(true);setTimer(20);}},7000);return;}const t=setInterval(()=>setTimer(v=>v-1),1000);return()=>clearInterval(t);},[rideReq,timer]);
  useEffect(()=>{if(activeRide){setRideProgress(0);const i=setInterval(()=>setRideProgress(p=>{if(p>=100){clearInterval(i);return 100;}return p+0.7;}),110);return()=>clearInterval(i);}});

  const accept=()=>{setRideReq(false);setActiveRide(true);};
  const reject=()=>{setRideReq(false);setTimeout(()=>{setRideReq(true);setTimer(20);},7000);};
  const complete=()=>{setActiveRide(false);setRideProgress(0);setTimeout(()=>{if(online){setRideReq(true);setTimer(20);}},5000);};

  if(showChat) return <PhoneShell T={T}><SBar T={T}/><div style={{height:748,overflowY:"auto",scrollbarWidth:"none"}}><ChatScreen T={T} onBack={()=>setShowChat(false)} isDriver/></div></PhoneShell>;

  return <PhoneShell T={T}>
    <SBar T={T}/>
    {showSOS&&<SOSModal T={T} onClose={()=>setShowSOS(false)}/>}
    {screen==="login"?<div style={{padding:"28px 22px 32px"}}>
      <div style={{marginBottom:34}}>
        <div style={{width:54,height:54,borderRadius:18,background:T.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,marginBottom:18,boxShadow:`0 12px 28px ${T.greenSoft}`}}>🚗</div>
        <div style={{fontFamily:F,fontSize:28,fontWeight:800,letterSpacing:-0.6,lineHeight:1.15}}>{!otpSent?"Driver Login":"Verify OTP"}</div>
        <div style={{color:T.textSub,fontSize:13,marginTop:8,fontFamily:FB}}>{!otpSent?"Start earning with MyCityRide":"Enter the 4-digit code"}</div>
      </div>
      {!otpSent?<>
        <div style={{background:T.input,border:`1.5px solid ${T.border}`,borderRadius:15,display:"flex",overflow:"hidden",marginBottom:13}}>
          <div style={{padding:"17px 14px",borderRight:`1px solid ${T.border}`,color:T.textSub,fontSize:14,fontWeight:600,whiteSpace:"nowrap"}}>🇮🇳 +91</div>
          <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="Registered mobile"
            style={{background:"transparent",border:"none",outline:"none",padding:"17px 14px",color:T.text,fontSize:16,flex:1,fontFamily:FB}}/>
        </div>
        <Btn T={T} full green disabled={phone.length!==10} onClick={()=>setOtpSent(true)}>Send OTP</Btn>
      </>:<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:16}}>
          {otp.map((d,i)=><input key={i} ref={refs[i]} value={d} onChange={e=>handleOtp(i,e.target.value)} maxLength={1}
            style={{width:"100%",height:62,background:d?T.greenSoft:T.input,border:`2px solid ${d?T.green:T.border}`,borderRadius:14,textAlign:"center",fontSize:26,fontWeight:800,color:T.text,outline:"none",fontFamily:F,boxSizing:"border-box"}}/>)}
        </div>
        <Btn T={T} full green disabled={otp.join("").length!==4} onClick={()=>setScreen("home")}>Verify & Login →</Btn>
      </>}
      <div style={{marginTop:26,background:T.input,borderRadius:12,border:`1px solid ${T.border}`,padding:"13px 15px"}}>
        <div style={{fontSize:10,color:T.textMuted,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",marginBottom:7,fontFamily:FB}}>Demo Credentials</div>
        <div style={{fontSize:13,color:T.textSub,fontFamily:FB,lineHeight:1.8}}>
          Phone: <b style={{color:T.text}}>9876500002</b>&nbsp;&nbsp;OTP: <b style={{color:T.green}}>Any 4 digits</b>
        </div>
      </div>
    </div>:<>
      <div style={{padding:"10px 16px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontFamily:F,fontWeight:800,fontSize:17}}>MyCity<span style={{color:T.accent}}>Driver</span></div>
          <div style={{fontSize:11,color:T.textSub,fontFamily:FB,marginTop:1}}>Hey Ramesh 👋</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setShowSOS(true)} style={{width:34,height:34,borderRadius:11,background:T.redSoft,border:`1px solid ${T.red}30`,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>🆘</button>
          <button onClick={()=>{if(online){setOnline(false);setRideReq(false);}else setOnline(true);}} style={{display:"flex",alignItems:"center",gap:7,background:online?T.greenSoft:T.card,border:`1.5px solid ${online?T.green:T.border}`,borderRadius:100,padding:"8px 16px",cursor:"pointer",transition:"all 0.2s"}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:online?T.green:T.textMuted}}/>
            <span style={{fontSize:12,fontWeight:700,color:online?T.green:T.textSub,fontFamily:FB}}>{online?"Online":"Offline"}</span>
          </button>
        </div>
      </div>
      <div style={{height:678,overflowY:"auto",overflowX:"hidden",scrollbarWidth:"none",paddingBottom:80}}>
        {rideReq&&!activeRide&&tab==="home"&&<div style={{margin:"10px 12px 0"}}><RideReqCard T={T} timer={timer} onAccept={accept} onReject={reject}/></div>}
        {tab==="home"&&!rideReq&&!activeRide&&<DriverHome T={T} online={online}/>}
        {tab==="home"&&activeRide&&<DriverActiveRide T={T} progress={rideProgress} onComplete={complete} onChat={()=>setShowChat(true)} onSOS={()=>setShowSOS(true)}/>}
        {tab==="earn"&&<DriverEarnings T={T}/>}
        {tab==="docs"&&<DriverDocs T={T}/>}
      </div>
      <BNav T={T} active={tab}
        tabs={[{id:"home",icon:"🏠",label:"Home"},{id:"earn",icon:"💰",label:"Earnings"},{id:"docs",icon:"📋",label:"Docs"}]}
        onChange={setTab}/>
    </>}
  </PhoneShell>;
}

function RideReqCard({T,timer,onAccept,onReject}){
  const circ=2*Math.PI*52,pct=timer/20;
  return <div style={{background:T.card,borderRadius:20,border:`2px solid ${T.accent}`,overflow:"hidden",boxShadow:`0 0 48px ${T.accentGlow}`}}>
    <div style={{background:T.accentSoft,padding:"13px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{fontFamily:F,fontWeight:800,fontSize:17,color:T.accent}}>New Ride Request!</div>
      <div style={{position:"relative",width:50,height:50}}>
        <svg viewBox="0 0 120 120" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
          <circle cx="60" cy="60" r="52" fill="none" stroke={T.border} strokeWidth="8"/>
          <circle cx="60" cy="60" r="52" fill="none" stroke={timer<=8?T.red:T.green} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round" transform="rotate(-90 60 60)"/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:800,fontSize:17,color:timer<=8?T.red:T.text}}>{timer}</div>
      </div>
    </div>
    <div style={{padding:"13px 16px"}}>
      {[["👤","Passenger","Priya Sharma"],["📍","Pickup","Sitabuldi"],["🎯","Drop","Nagpur Airport"],["📏","Distance","12.4 km"],["💰","Fare","₹245"]].map(([icon,label,val])=>(
        <div key={label} style={{display:"flex",alignItems:"center",gap:11,marginBottom:9}}>
          <span style={{width:19,textAlign:"center",fontSize:14}}>{icon}</span>
          <span style={{color:T.textMuted,fontSize:12,width:65,fontFamily:FB,fontWeight:600}}>{label}</span>
          <span style={{fontWeight:600,fontSize:13,fontFamily:FB,color:T.text}}>{val}</span>
        </div>
      ))}
    </div>
    <div style={{display:"flex",gap:9,padding:"0 14px 14px"}}>
      <button onClick={onReject} style={{flex:1,padding:"13px",background:T.redSoft,border:`1px solid ${T.red}40`,borderRadius:13,color:T.red,cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:14}}>✕ Decline</button>
      <button onClick={onAccept} style={{flex:2,padding:"13px",background:T.green,border:"none",borderRadius:13,color:"#fff",cursor:"pointer",fontFamily:F,fontWeight:800,fontSize:14,boxShadow:`0 10px 24px ${T.greenSoft}`}}>✓ Accept</button>
    </div>
  </div>;
}

function DriverHome({T,online}){
  const stats=[{l:"Rides",v:"8",ic:"🚗",c:T.accent},{l:"Earnings",v:"₹640",ic:"💰",c:T.green},{l:"Hours",v:"6.5h",ic:"⏱️",c:T.blue},{l:"Rating",v:"4.8★",ic:"⭐",c:T.yellow}];
  return <div style={{padding:"12px 14px"}}>
    <div style={{background:online?T.greenSoft:T.redSoft,border:`1.5px solid ${online?T.green+"40":T.red+"30"}`,borderRadius:14,padding:"13px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:11}}>
      <span style={{fontSize:26}}>{online?"🟢":"⛔"}</span>
      <div>
        <div style={{fontWeight:700,color:online?T.green:T.red,fontSize:13,fontFamily:F}}>{online?"You're Live — Accepting Rides":"You're Offline"}</div>
        <div style={{fontSize:11,color:T.textSub,marginTop:2,fontFamily:FB}}>{online?"Ride requests will pop up":"Toggle to go online"}</div>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:14}}>
      {stats.map(s=><div key={s.l} style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"14px"}}>
        <div style={{fontSize:20,marginBottom:8}}>{s.ic}</div>
        <div style={{fontFamily:F,fontWeight:800,fontSize:22,color:s.c}}>{s.v}</div>
        <div style={{fontSize:10,color:T.textMuted,marginTop:3,fontFamily:FB}}>{s.l}</div>
      </div>)}
    </div>
    <div style={{fontFamily:F,fontWeight:700,fontSize:14,marginBottom:10}}>Recent Trips</div>
    {RIDES_H.slice(0,3).map(r=><div key={r.id} style={{background:T.card,borderRadius:12,border:`1px solid ${T.border}`,padding:"12px 13px",marginBottom:7,display:"flex",alignItems:"center",gap:11}}>
      <span style={{fontSize:18,opacity:0.7}}>🗺️</span>
      <div style={{flex:1}}>
        <div style={{fontWeight:600,fontSize:12,fontFamily:FB}}>{r.from} → {r.to}</div>
        <div style={{color:T.textMuted,fontSize:10,marginTop:2,fontFamily:FB}}>{r.date}</div>
      </div>
      <div style={{fontFamily:F,fontWeight:800,color:T.green,fontSize:14}}>₹{r.fare}</div>
    </div>)}
  </div>;
}

function DriverActiveRide({T,progress,onComplete,onChat,onSOS}){
  return <div style={{padding:"12px 14px"}}>
    <div style={{background:T.greenSoft,border:`1px solid ${T.green}40`,borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:9,marginBottom:12}}>
      <div style={{width:7,height:7,borderRadius:"50%",background:T.green}}/>
      <span style={{color:T.green,fontWeight:700,fontSize:12,fontFamily:F,flex:1}}>Ride in Progress</span>
      <span style={{color:T.accent,fontWeight:700,fontSize:13,fontFamily:F}}>₹245</span>
    </div>
    <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:12}}>
      <GPSMap T={T} showDriver progress={progress} compact/>
      <div style={{height:4,background:T.border}}><div style={{width:`${progress}%`,height:"100%",background:`linear-gradient(90deg,${T.accent},#FF8040)`,transition:"width 0.2s"}}/></div>
    </div>
    <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"13px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:11}}>
        <div style={{width:46,height:46,borderRadius:15,background:T.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>👩</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:F,fontWeight:700,fontSize:14}}>Priya Sharma</div>
          <div style={{color:T.textSub,fontSize:11,fontFamily:FB}}>Drop: ✈️ Nagpur Airport</div>
        </div>
        <div style={{display:"flex",gap:7}}>
          <button onClick={onChat} style={{width:36,height:36,borderRadius:11,background:T.blueSoft,border:`1px solid ${T.blue}30`,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>💬</button>
          <button style={{width:36,height:36,borderRadius:11,background:T.greenSoft,border:`1px solid ${T.green}30`,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>📞</button>
          <button onClick={onSOS} style={{width:36,height:36,borderRadius:11,background:T.redSoft,border:`1px solid ${T.red}30`,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>🆘</button>
        </div>
      </div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textMuted,marginBottom:4,fontFamily:FB}}><span>Progress</span><span style={{fontWeight:700}}>{Math.round(progress)}%</span></div>
        <div style={{height:5,background:T.border,borderRadius:3}}><div style={{width:`${progress}%`,height:"100%",background:`linear-gradient(90deg,${T.accent},#FF8040)`,borderRadius:3,transition:"width 0.2s"}}/></div>
      </div>
    </div>
    {progress>=100&&<Btn T={T} full green onClick={onComplete}>✓ Complete — Collect ₹245</Btn>}
  </div>;
}

function DriverEarnings({T}){
  const wk=["M","T","W","T","F","S","S"],vals=[320,450,280,560,490,720,640],mx=Math.max(...vals);
  return <div style={{padding:"16px 14px"}}>
    <div style={{fontFamily:F,fontWeight:800,fontSize:21,marginBottom:16,letterSpacing:-0.4}}>Earnings</div>
    <div style={{background:`linear-gradient(135deg,${T.accent},#FF8040)`,borderRadius:18,padding:"22px",marginBottom:16,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-18,right:-18,width:110,height:110,borderRadius:"50%",background:"rgba(255,255,255,0.08)"}}/>
      <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",fontWeight:600,marginBottom:5,textTransform:"uppercase",letterSpacing:0.7}}>This Week</div>
      <div style={{fontFamily:F,fontSize:42,fontWeight:800,color:"#fff",lineHeight:1}}>₹3,460</div>
      <div style={{color:"rgba(255,255,255,0.8)",fontSize:13,marginTop:7,fontWeight:600}}>↑ +12% from last week</div>
    </div>
    <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"14px",marginBottom:14}}>
      <div style={{fontFamily:F,fontWeight:700,fontSize:13,marginBottom:13}}>Daily Breakdown</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:5,height:80}}>
        {vals.map((v,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{width:"100%",height:`${(v/mx)*66}px`,background:i===6?T.accent:`${T.accent}22`,borderRadius:"3px 3px 0 0"}}/>
          <span style={{fontSize:8,color:T.textMuted,fontWeight:600,fontFamily:FB}}>{wk[i]}</span>
        </div>)}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
      {[["48","Total Rides"],["₹72","Per Ride"],["38h","Drive Time"],["94%","Completion"]].map(([v,l])=>(
        <div key={l} style={{background:T.card,borderRadius:13,border:`1px solid ${T.border}`,padding:"14px"}}>
          <div style={{fontFamily:F,fontWeight:800,fontSize:21,color:T.accent}}>{v}</div>
          <div style={{fontSize:10,color:T.textMuted,marginTop:4,fontFamily:FB}}>{l}</div>
        </div>
      ))}
    </div>
  </div>;
}

/* ── Driver Document Upload ───────────────────────── */
function DriverDocs({T}){
  const [docs,setDocs]=useState({
    license:{name:"Driving License",status:"uploaded",file:"DL_Ramesh.pdf",icon:"🪪"},
    rc:{name:"Vehicle RC",status:"verified",file:"RC_MH31AB1234.pdf",icon:"📄"},
    insurance:{name:"Insurance",status:"pending",file:null,icon:"🛡️"},
    photo:{name:"Profile Photo",status:"uploaded",file:"photo_ramesh.jpg",icon:"📸"},
    aadhar:{name:"Aadhar Card",status:"pending",file:null,icon:"🆔"},
  });
  const [uploading,setUploading]=useState(null);

  const simulateUpload=(key)=>{
    setUploading(key);
    setTimeout(()=>{
      setDocs(d=>({...d,[key]:{...d[key],status:"uploaded",file:`${key}_ramesh.pdf`}}));
      setUploading(null);
    },2200);
  };

  const statusInfo={
    verified:{color:T.green,label:"Verified ✓",bg:T.greenSoft},
    uploaded:{color:T.blue,label:"Under Review",bg:T.blueSoft},
    pending:{color:T.yellow,label:"Upload Required",bg:`${T.yellow}15`},
  };

  return <div style={{padding:"14px 14px"}}>
    <div style={{fontFamily:F,fontWeight:800,fontSize:21,marginBottom:6,letterSpacing:-0.4}}>My Documents</div>
    <div style={{color:T.textSub,fontSize:12,fontFamily:FB,marginBottom:16}}>Keep your documents updated for faster approvals</div>

    {/* Completion bar */}
    <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontFamily:F,fontWeight:700,fontSize:13}}>Verification Progress</span>
        <span style={{fontFamily:F,fontWeight:800,fontSize:14,color:T.green}}>60%</span>
      </div>
      <div style={{height:6,background:T.border,borderRadius:3,overflow:"hidden"}}>
        <div style={{width:"60%",height:"100%",background:`linear-gradient(90deg,${T.green},#00F080)`,borderRadius:3}}/>
      </div>
      <div style={{fontSize:11,color:T.textMuted,fontFamily:FB,marginTop:6}}>3 of 5 documents verified or uploaded</div>
    </div>

    {Object.entries(docs).map(([key,doc])=>{
      const si=statusInfo[doc.status];
      const isUploading=uploading===key;
      return <div key={key} style={{background:T.card,borderRadius:14,border:`1.5px solid ${doc.status==="pending"?`${T.yellow}50`:T.border}`,padding:"14px",marginBottom:9}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:46,height:46,borderRadius:15,background:`${si.color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{doc.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:F,fontWeight:700,fontSize:14}}>{doc.name}</div>
            {doc.file&&<div style={{fontSize:11,color:T.textMuted,fontFamily:FB,marginTop:2}}>📎 {doc.file}</div>}
          </div>
          <Pill T={T} color={si.color} small>{si.label}</Pill>
        </div>
        {doc.status==="pending"&&<div style={{marginTop:12}}>
          {isUploading?<div style={{background:T.surface,borderRadius:11,padding:"11px 14px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1,height:4,background:T.border,borderRadius:2,overflow:"hidden"}}>
              <div style={{width:"70%",height:"100%",background:T.accent,borderRadius:2,animation:"slideIn 2s linear"}}/>
            </div>
            <span style={{fontSize:11,color:T.textSub,fontFamily:FB,fontWeight:600}}>Uploading...</span>
          </div>:<button onClick={()=>simulateUpload(key)} style={{width:"100%",padding:"11px",borderRadius:11,background:T.accentSoft,border:`1.5px dashed ${T.accent}`,color:T.accent,cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{fontSize:16}}>📤</span> Upload {doc.name}
          </button>}
        </div>}
        {doc.status==="uploaded"&&<div style={{marginTop:10,display:"flex",gap:7}}>
          <button style={{flex:1,padding:"8px",borderRadius:10,background:T.surface,border:`1px solid ${T.border}`,color:T.textSub,cursor:"pointer",fontSize:11,fontFamily:FB,fontWeight:600}}>👁 View</button>
          <button onClick={()=>simulateUpload(key)} style={{flex:1,padding:"8px",borderRadius:10,background:T.surface,border:`1px solid ${T.border}`,color:T.textSub,cursor:"pointer",fontSize:11,fontFamily:FB,fontWeight:600}}>🔄 Re-upload</button>
        </div>}
      </div>;
    })}
    <div style={{background:T.greenSoft,borderRadius:13,border:`1px solid ${T.green}30`,padding:"13px 14px",marginTop:4,display:"flex",gap:10,alignItems:"flex-start"}}>
      <span style={{fontSize:18,flexShrink:0}}>💡</span>
      <div style={{fontSize:12,color:T.textSub,fontFamily:FB,lineHeight:1.6}}>Documents are verified within <b style={{color:T.green}}>24–48 hours</b>. Make sure files are clear and under 5MB.</div>
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════════
   ADMIN PANEL
══════════════════════════════════════════════════════ */
function AdminPanel({T}){
  const [screen,setScreen]=useState("login");
  const [email,setEmail]=useState("");
  const [pwd,setPwd]=useState("");
  const [showPwd,setShowPwd]=useState(false);
  const [loginErr,setLoginErr]=useState("");
  const [tab,setTab]=useState("dash");
  const [driverSt,setDriverSt]=useState(Object.fromEntries(DRIVERS.map(d=>[d.id,d.status])));
  const [baseFare,setBaseFare]=useState(30);
  const [perKm,setPerKm]=useState(10);
  const [surge,setSurge]=useState(1.0);
  const [waitCharge,setWaitCharge]=useState(2);

  const autoFill=()=>{setEmail("admin@mycityride.com");setPwd("Admin@123");setLoginErr("");};
  const handleLogin=()=>{
    const e=email.trim().toLowerCase(),p=pwd.trim();
    if(e==="admin@mycityride.com"&&p==="Admin@123"){setScreen("panel");setLoginErr("");}
    else setLoginErr("Wrong credentials! Click \"Auto-fill\" below to use demo login.");
  };

  if(screen==="login") return <div style={{maxWidth:440,margin:"0 auto",padding:"40px 22px"}}>
    <div style={{textAlign:"center",marginBottom:38}}>
      <div style={{width:62,height:62,borderRadius:20,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 14px",boxShadow:`0 16px 36px ${T.accentGlow}`}}>⚙️</div>
      <div style={{fontFamily:F,fontSize:26,fontWeight:800,letterSpacing:-0.5}}>Admin Login</div>
      <div style={{color:T.textSub,fontSize:13,marginTop:5,fontFamily:FB}}>MyCityRide Operations Center</div>
    </div>
    <div style={{background:T.card,borderRadius:20,border:`1px solid ${T.border}`,padding:"26px 22px",marginBottom:16}}>
      {/* Email */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:700,color:T.textSub,marginBottom:7,fontFamily:FB,letterSpacing:0.3,textTransform:"uppercase"}}>Email</div>
        <input type="text" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@mycityride.com"
          style={{width:"100%",background:T.input,border:`1.5px solid ${T.border}`,borderRadius:13,padding:"14px 15px",color:T.text,fontSize:15,outline:"none",fontFamily:FB,boxSizing:"border-box"}}/>
      </div>
      {/* Password */}
      <div style={{marginBottom:18}}>
        <div style={{fontSize:11,fontWeight:700,color:T.textSub,marginBottom:7,fontFamily:FB,letterSpacing:0.3,textTransform:"uppercase"}}>Password</div>
        <div style={{position:"relative"}}>
          <input type={showPwd?"text":"password"} value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Enter your password"
            style={{width:"100%",background:T.input,border:`1.5px solid ${T.border}`,borderRadius:13,padding:"14px 44px 14px 15px",color:T.text,fontSize:15,outline:"none",fontFamily:FB,boxSizing:"border-box"}}/>
          <button onClick={()=>setShowPwd(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:17,color:T.textMuted}}>{showPwd?"🙈":"👁"}</button>
        </div>
      </div>
      {loginErr&&<div style={{background:T.redSoft,border:`1px solid ${T.red}30`,borderRadius:10,padding:"10px 13px",fontSize:13,color:T.red,marginBottom:14,fontFamily:FB}}>{loginErr}</div>}
      <button onClick={handleLogin} style={{width:"100%",padding:"15px",borderRadius:13,border:"none",cursor:"pointer",background:T.accent,color:"#fff",fontFamily:F,fontWeight:700,fontSize:15,boxShadow:`0 12px 28px ${T.accentGlow}`}}>Sign In to Admin →</button>
    </div>
    <div style={{background:T.card,borderRadius:16,border:`1.5px dashed ${T.border}`,padding:"16px 18px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}>
        <div style={{fontSize:10,fontWeight:800,color:T.textMuted,letterSpacing:0.8,textTransform:"uppercase",fontFamily:FB}}>Demo Credentials</div>
        <button onClick={autoFill} style={{padding:"5px 14px",borderRadius:8,background:T.accent,border:"none",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:FB}}>⚡ Auto-fill</button>
      </div>
      {[["Email","admin@mycityride.com",T.accent],["Password","Admin@123",T.green]].map(([l,v,c])=>(
        <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
          <span style={{fontSize:13,color:T.textSub,fontFamily:FB}}>{l}</span>
          <span style={{fontSize:12,fontWeight:700,color:c,fontFamily:F,background:`${c}15`,padding:"4px 11px",borderRadius:8}}>{v}</span>
        </div>
      ))}
    </div>
  </div>;

  return <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 22px 48px"}}>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:26,paddingBottom:18,borderBottom:`1px solid ${T.border}`}}>
      <div>
        <div style={{fontFamily:F,fontSize:22,fontWeight:800,letterSpacing:-0.4}}>MyCity<span style={{color:T.accent}}>Ride</span> <span style={{color:T.textMuted,fontSize:13,fontWeight:500,fontFamily:FB}}>Admin</span></div>
        <div style={{color:T.textSub,fontSize:12,marginTop:2,fontFamily:FB}}>Nagpur Ops · {new Date().toDateString()}</div>
      </div>
      <div style={{display:"flex",gap:9,alignItems:"center"}}>
        <div style={{background:T.greenSoft,border:`1px solid ${T.green}30`,borderRadius:100,padding:"5px 14px",fontSize:12,fontWeight:700,color:T.green,fontFamily:FB,display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:8}}>⬤</span> System Live</div>
        <div style={{width:38,height:38,borderRadius:13,background:T.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,border:`1px solid ${T.border}`}}>👑</div>
        <button onClick={()=>setScreen("login")} style={{padding:"7px 14px",borderRadius:11,background:T.redSoft,border:`1px solid ${T.red}20`,color:T.red,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FB}}>Sign Out</button>
      </div>
    </div>
    {/* Nav */}
    <div style={{display:"flex",gap:3,background:T.surface,borderRadius:15,padding:5,border:`1px solid ${T.border}`,marginBottom:26,overflowX:"auto",scrollbarWidth:"none"}}>
      {[{id:"dash",ic:"📊",lb:"Dashboard"},{id:"drivers",ic:"🚗",lb:"Drivers"},{id:"rides",ic:"🗺️",lb:"Rides"},{id:"users",ic:"👥",lb:"Users"},{id:"pricing",ic:"💰",lb:"Pricing"}].map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"9px 16px",borderRadius:11,border:"none",cursor:"pointer",background:tab===t.id?T.accent:"transparent",color:tab===t.id?"#fff":T.textSub,fontFamily:FB,fontWeight:600,fontSize:13,transition:"all 0.18s",whiteSpace:"nowrap"}}>
          <span style={{fontSize:14,filter:tab===t.id?"none":"grayscale(1)",opacity:tab===t.id?1:0.5}}>{t.ic}</span> {t.lb}
        </button>
      ))}
    </div>
    {tab==="dash"    &&<AdminDash T={T}/>}
    {tab==="drivers" &&<AdminDrivers T={T} statuses={driverSt} onApprove={id=>setDriverSt(s=>({...s,[id]:"approved"}))} onReject={id=>setDriverSt(s=>({...s,[id]:"rejected"}))}/>}
    {tab==="rides"   &&<AdminRidesTab T={T} surge={surge}/>}
    {tab==="users"   &&<AdminUsers T={T}/>}
    {tab==="pricing" &&<AdminPricing T={T} baseFare={baseFare} perKm={perKm} surge={surge} waitCharge={waitCharge} setBaseFare={setBaseFare} setPerKm={setPerKm} setSurge={setSurge} setWaitCharge={setWaitCharge}/>}
  </div>;
}

function StatCard({T,icon,label,value,change,positive,color}){
  const c=color||T.accent;
  return <div style={{background:T.card,borderRadius:17,border:`1px solid ${T.border}`,padding:"18px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:13}}>
      <div style={{width:42,height:42,borderRadius:13,background:`${c}14`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,border:`1px solid ${c}18`}}>{icon}</div>
      {change&&<span style={{fontSize:10.5,fontWeight:700,color:positive?T.green:T.red,background:positive?T.greenSoft:T.redSoft,padding:"3px 9px",borderRadius:100,fontFamily:FB}}>{change}</span>}
    </div>
    <div style={{fontFamily:F,fontSize:27,fontWeight:800,color:c,letterSpacing:-0.5,lineHeight:1}}>{value}</div>
    <div style={{fontSize:11,color:T.textMuted,marginTop:5,fontFamily:FB,fontWeight:500}}>{label}</div>
  </div>;
}

function AdminDash({T}){
  const stats=[
    {icon:"🚗",label:"Total Rides Today",value:"142",change:"+18%",positive:true,color:T.accent},
    {icon:"🧑‍✈️",label:"Active Drivers",value:"28",change:"+4",positive:true,color:T.green},
    {icon:"👥",label:"Active Users",value:"89",change:"+12",positive:true,color:T.blue},
    {icon:"💰",label:"Revenue Today",value:"₹11.2K",change:"+22%",positive:true,color:T.yellow},
    {icon:"❌",label:"Cancelled Rides",value:"7",change:"-3",positive:true,color:T.red},
    {icon:"⭐",label:"Avg Driver Rating",value:"4.6",change:"stable",positive:true,color:T.yellow},
  ];
  const hourly=[400,320,500,780,920,1100,980,860,640,720,880,1240],mx=Math.max(...hourly);
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:11,marginBottom:22}}>
      {stats.map(s=><StatCard key={s.label} T={T} {...s}/>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:14}}>
      <div style={{background:T.card,borderRadius:17,border:`1px solid ${T.border}`,padding:"18px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontFamily:F,fontWeight:700,fontSize:15}}>Hourly Revenue</div>
          <div style={{background:T.accentSoft,borderRadius:9,padding:"4px 12px",fontSize:12,fontWeight:700,color:T.accent,fontFamily:FB}}>₹11,240 today</div>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:5,height:90}}>
          {hourly.map((v,i)=><div key={i} style={{flex:1,height:`${(v/mx)*76}px`,background:i===11?T.accent:`${T.accent}18`,borderRadius:"3px 3px 0 0"}}/>)}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:7,fontSize:10,color:T.textMuted,fontFamily:FB}}><span>6AM</span><span>9AM</span><span>12PM</span><span>3PM</span><span>Now</span></div>
      </div>
      <div style={{background:T.card,borderRadius:17,border:`1px solid ${T.border}`,padding:"18px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontFamily:F,fontWeight:700,fontSize:15}}>Live Rides</div>
          <Pill T={T} color={T.green} small>● {ADMIN_RIDES.filter(r=>r.status==="Active").length} Active</Pill>
        </div>
        {ADMIN_RIDES.filter(r=>r.status==="Active").map(r=><div key={r.id} style={{background:T.surface,borderRadius:11,padding:"11px 12px",marginBottom:7,border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontWeight:600,fontSize:12,fontFamily:FB}}>{r.vehicle} {r.from}→{r.to}</div>
              <div style={{color:T.textMuted,fontSize:10,marginTop:2,fontFamily:FB}}>{r.user} · {r.driver}</div>
            </div>
            <span style={{fontFamily:F,fontWeight:800,color:T.accent,fontSize:13}}>₹{r.fare}</span>
          </div>
        </div>)}
      </div>
    </div>
  </div>;
}

function AdminDrivers({T,statuses,onApprove,onReject}){
  const [filter,setFilter]=useState("All");
  const filtered=filter==="All"?DRIVERS:DRIVERS.filter(d=>statuses[d.id]===filter.toLowerCase());
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div style={{fontFamily:F,fontWeight:700,fontSize:17}}>Driver Management</div>
      <div style={{display:"flex",gap:5}}>
        {["All","Pending","Approved","Rejected"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 16px",borderRadius:100,background:filter===f?T.accent:T.card,border:`1px solid ${filter===f?T.accent:T.border}`,color:filter===f?"#fff":T.textSub,fontSize:12,cursor:"pointer",fontWeight:600,fontFamily:FB}}>
            {f}{f==="Pending"?` (${DRIVERS.filter(d=>statuses[d.id]==="pending").length})` :""}
          </button>
        ))}
      </div>
    </div>
    <div style={{display:"grid",gap:9}}>
      {filtered.map(d=><div key={d.id} style={{background:T.card,borderRadius:15,border:`1px solid ${statuses[d.id]==="pending"?T.yellow+"40":T.border}`,padding:"16px 18px",display:"flex",alignItems:"center",gap:15}}>
        <Av text={d.avatar} T={T} size={50}/>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:3}}>
            <span style={{fontFamily:F,fontWeight:700,fontSize:15}}>{d.name}</span>
            <Pill T={T} color={statuses[d.id]==="approved"?T.green:statuses[d.id]==="rejected"?T.red:T.yellow} small>{statuses[d.id]}</Pill>
            {d.docsVerified&&<Pill T={T} color={T.blue} small>Docs ✓</Pill>}
          </div>
          <div style={{color:T.textSub,fontSize:12,fontFamily:FB}}>{d.vehicle} · {d.plate} · ⭐{d.rating} · {d.rides} rides</div>
          <div style={{color:T.textMuted,fontSize:11,fontFamily:FB,marginTop:2}}>📞 +91 {d.phone} · {d.joined} · {d.earn}</div>
        </div>
        <div style={{display:"flex",gap:7,flexShrink:0}}>
          {statuses[d.id]==="pending"&&<><button onClick={()=>onApprove(d.id)} style={{padding:"8px 16px",background:T.greenSoft,border:`1px solid ${T.green}40`,borderRadius:11,color:T.green,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:FB}}>✓ Approve</button><button onClick={()=>onReject(d.id)} style={{padding:"8px 12px",background:T.redSoft,border:`1px solid ${T.red}30`,borderRadius:11,color:T.red,cursor:"pointer",fontWeight:700,fontSize:13}}>✕</button></>}
          {statuses[d.id]==="approved"&&<button onClick={()=>onReject(d.id)} style={{padding:"7px 14px",background:T.redSoft,border:`1px solid ${T.red}20`,borderRadius:11,color:T.red,cursor:"pointer",fontSize:12,fontFamily:FB,fontWeight:600}}>Block</button>}
          {statuses[d.id]==="rejected"&&<button onClick={()=>onApprove(d.id)} style={{padding:"7px 14px",background:T.greenSoft,border:`1px solid ${T.green}30`,borderRadius:11,color:T.green,cursor:"pointer",fontSize:12,fontFamily:FB,fontWeight:600}}>Restore</button>}
        </div>
      </div>)}
    </div>
  </div>;
}

function AdminRidesTab({T,surge}){
  const [filter,setFilter]=useState("All");
  const filtered=filter==="All"?ADMIN_RIDES:ADMIN_RIDES.filter(r=>r.status===filter);
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontFamily:F,fontWeight:700,fontSize:17}}>Ride Monitoring</div>
        {surge>1&&<div style={{background:`${T.yellow}18`,border:`1px solid ${T.yellow}40`,borderRadius:9,padding:"4px 12px",fontSize:11,fontWeight:700,color:T.yellow,fontFamily:FB}}>⚡ {surge}x Surge ON</div>}
      </div>
      <div style={{display:"flex",gap:5}}>
        {["All","Active","Completed","Cancelled"].map(s=><button key={s} onClick={()=>setFilter(s)} style={{padding:"5px 14px",borderRadius:100,background:filter===s?T.accent:T.card,border:`1px solid ${filter===s?T.accent:T.border}`,color:filter===s?"#fff":T.textSub,fontSize:11,cursor:"pointer",fontWeight:600,fontFamily:FB}}>{s}</button>)}
      </div>
    </div>
    <div style={{background:T.card,borderRadius:17,border:`1px solid ${T.border}`,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
          <thead><tr style={{background:T.surface}}>
            {["ID","User","Driver","Route","Fare","Time","Status","Action"].map(h=><th key={h} style={{padding:"12px 15px",textAlign:"left",fontSize:10.5,color:T.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,fontFamily:FB,whiteSpace:"nowrap"}}>{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map((r,i)=><tr key={r.id} style={{borderTop:`1px solid ${T.border}20`,background:i%2===0?"transparent":T.surface+"60"}}>
            <td style={{padding:"13px 15px",fontSize:11.5,color:T.accent,fontWeight:700,fontFamily:F}}>{r.id}</td>
            <td style={{padding:"13px 15px",fontSize:13,fontWeight:600,fontFamily:FB}}>{r.user}</td>
            <td style={{padding:"13px 15px",fontSize:12,color:T.textSub,fontFamily:FB}}>{r.driver}</td>
            <td style={{padding:"13px 15px",fontSize:12,color:T.textSub,fontFamily:FB}}>{r.vehicle} {r.from}→{r.to}</td>
            <td style={{padding:"13px 15px",fontSize:14,fontWeight:700,fontFamily:F}}>₹{r.fare}</td>
            <td style={{padding:"13px 15px",fontSize:11,color:T.textMuted,fontFamily:FB}}>{r.time} AM</td>
            <td style={{padding:"13px 15px"}}><Pill T={T} color={r.status==="Active"?T.green:r.status==="Completed"?T.blue:T.red} small>{r.status}</Pill></td>
            <td style={{padding:"13px 15px"}}><button style={{padding:"5px 13px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:9,color:T.textSub,cursor:"pointer",fontSize:11,fontFamily:FB}}>View</button></td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>
  </div>;
}

function AdminUsers({T}){
  const users=[
    {name:"Priya Sharma",phone:"98765-00001",rides:12,spent:"₹2,940",joined:"Jan 2024",status:"active",av:"PS",rating:4.9},
    {name:"Amit Tiwari",phone:"97654-00002",rides:6,spent:"₹980",joined:"Feb 2024",status:"active",av:"AT",rating:4.7},
    {name:"Neha Mishra",phone:"96543-00003",rides:3,spent:"₹420",joined:"Mar 2024",status:"active",av:"NM",rating:4.8},
    {name:"Ravi Kumar",phone:"95432-00004",rides:1,spent:"₹40",joined:"Mar 2024",status:"blocked",av:"RK",rating:2.1},
  ];
  return <div>
    <div style={{fontFamily:F,fontWeight:700,fontSize:17,marginBottom:16}}>User Management</div>
    <div style={{display:"grid",gap:9}}>
      {users.map((u,i)=><div key={i} style={{background:T.card,borderRadius:15,border:`1px solid ${T.border}`,padding:"16px 18px",display:"flex",alignItems:"center",gap:15}}>
        <Av text={u.av} T={T} size={48} color={T.blueSoft}/>
        <div style={{flex:1}}>
          <div style={{fontFamily:F,fontWeight:700,fontSize:14,marginBottom:3}}>{u.name}</div>
          <div style={{color:T.textSub,fontSize:12,fontFamily:FB}}>📞 +91 {u.phone} · {u.rides} rides · {u.spent}</div>
          <div style={{color:T.textMuted,fontSize:11,marginTop:2,fontFamily:FB}}>Joined {u.joined} · ⭐ {u.rating}</div>
        </div>
        <div style={{display:"flex",gap:9,alignItems:"center"}}>
          <Pill T={T} color={u.status==="active"?T.green:T.red} small>{u.status}</Pill>
          <button style={{padding:"7px 14px",background:u.status==="active"?T.redSoft:T.greenSoft,border:`1px solid ${u.status==="active"?T.red+"20":T.green+"30"}`,borderRadius:11,color:u.status==="active"?T.red:T.green,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FB}}>
            {u.status==="active"?"Block":"Unblock"}
          </button>
        </div>
      </div>)}
    </div>
  </div>;
}

function AdminPricing({T,baseFare,perKm,surge,waitCharge,setBaseFare,setPerKm,setSurge,setWaitCharge}){
  const types=[{n:"🚗 Sedan",m:1},{n:"🛺 Auto",m:0.65},{n:"⚡ E-Ride",m:0.4}];
  const Slider=({label,value,min,max,step,setter,color,unit})=>{
    const c=color||T.accent,pct=((value-min)/(max-min))*100;
    const fmt=v=>unit==="₹"?`₹${v}`:unit==="x"?`${v.toFixed(1)}×`:`${v}${unit}`;
    return <div style={{background:T.card,borderRadius:16,border:`1px solid ${T.border}`,padding:"18px"}}>
      <div style={{fontSize:10,color:T.textMuted,fontWeight:700,letterSpacing:0.6,textTransform:"uppercase",marginBottom:8,fontFamily:FB}}>{label}</div>
      <div style={{fontFamily:F,fontSize:36,fontWeight:800,color:c,lineHeight:1,marginBottom:12}}>{fmt(value)}</div>
      <div style={{position:"relative",height:5,background:T.border,borderRadius:3}}>
        <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${pct}%`,background:c,borderRadius:3}}/>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e=>setter(Number(e.target.value))}
          style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:5,fontSize:10,color:T.textMuted,fontFamily:FB}}><span>{fmt(min)}</span><span>{fmt(max)}</span></div>
    </div>;
  };
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
      <div style={{fontFamily:F,fontWeight:700,fontSize:17}}>Pricing Control</div>
      {surge>1&&<div style={{background:T.accentSoft,border:`1px solid ${T.accent}30`,borderRadius:11,padding:"6px 14px",display:"flex",alignItems:"center",gap:7}}>
        <span style={{fontSize:13}}>⚡</span>
        <span style={{fontSize:12,fontWeight:700,color:T.accent,fontFamily:FB}}>Surge mode active across app</span>
      </div>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:22}}>
      <Slider label="Base Fare" value={baseFare} min={10} max={100} step={5} setter={setBaseFare} unit="₹" color={T.accent}/>
      <Slider label="Per KM Rate" value={perKm} min={5} max={30} step={1} setter={setPerKm} unit="₹" color={T.blue}/>
      <Slider label="Surge Multiplier" value={surge} min={1} max={3} step={0.1} setter={setSurge} unit="x" color={surge>1.5?T.red:surge>1?T.yellow:T.green}/>
      <Slider label="Wait Charges" value={waitCharge} min={1} max={5} step={0.5} setter={setWaitCharge} unit="₹" color={T.yellow}/>
    </div>
    <div style={{background:T.card,borderRadius:17,border:`1px solid ${T.border}`,overflow:"hidden"}}>
      <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontFamily:F,fontWeight:700,fontSize:14}}>Live Fare Preview</div>
        {surge>1&&<Pill T={T} color={T.yellow}>⚡ {surge.toFixed(1)}x Surge Active</Pill>}
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:T.surface}}>
            {["Vehicle","Base","Per KM","Wait/min","Min Fare","5KM Trip","5KM + Surge"].map(h=><th key={h} style={{padding:"10px 15px",textAlign:"left",fontSize:10.5,color:T.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.4,fontFamily:FB}}>{h}</th>)}
          </tr></thead>
          <tbody>{types.map(t=>{
            const base=Math.round(baseFare*t.m),km=Math.round(perKm*t.m),wait=(waitCharge*t.m).toFixed(1),trip5=base+km*5,surged=Math.round(trip5*surge);
            return <tr key={t.n} style={{borderTop:`1px solid ${T.border}20`}}>
              <td style={{padding:"13px 15px",fontWeight:700,fontSize:13,fontFamily:FB}}>{t.n}</td>
              <td style={{padding:"13px 15px",color:T.accent,fontWeight:700,fontFamily:F}}>₹{base}</td>
              <td style={{padding:"13px 15px",fontFamily:FB,fontSize:12}}>₹{km}/km</td>
              <td style={{padding:"13px 15px",color:T.textSub,fontFamily:FB,fontSize:12}}>₹{wait}/min</td>
              <td style={{padding:"13px 15px",color:T.green,fontWeight:600,fontFamily:F}}>₹{base+km}</td>
              <td style={{padding:"13px 15px",fontFamily:F,fontWeight:700}}>₹{trip5}</td>
              <td style={{padding:"13px 15px",color:surge>1?T.yellow:T.textSub,fontWeight:surge>1?800:400,fontFamily:F,fontSize:surge>1?14:13}}>₹{surged}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════ */
export default function App(){
  const [isDark,setIsDark]=useState(true);
  const [role,setRole]=useState("user");
  const T=isDark?D:L;
  return <div style={{background:T.bg,minHeight:"100vh",color:T.text,transition:"background 0.3s,color 0.3s"}}>
    <style>{`
      ${FONTS}
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
      ::-webkit-scrollbar{display:none;}
      *{-webkit-font-smoothing:antialiased;}
      input{font-family:'Instrument Sans',sans-serif;}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
      @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      @keyframes slideIn{0%{width:0%}100%{width:80%}}
    `}</style>

    {/* Top bar */}
    <div style={{padding:"14px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`,background:T.surface,position:"sticky",top:0,zIndex:200}}>
      <div style={{fontFamily:F,fontWeight:800,fontSize:19,letterSpacing:-0.4}}>
        MyCity<span style={{color:T.accent}}>Ride</span>
        <span style={{fontSize:11,color:T.textMuted,marginLeft:7,fontWeight:400,fontFamily:FB}}>Full Demo</span>
      </div>
      <div style={{display:"flex",background:T.bg,borderRadius:13,padding:4,border:`1px solid ${T.border}`,gap:2}}>
        {[{id:"user",ic:"👤",lb:"User"},{id:"driver",ic:"🚗",lb:"Driver"},{id:"admin",ic:"⚙️",lb:"Admin"}].map(r=>(
          <button key={r.id} onClick={()=>setRole(r.id)} style={{padding:"7px 16px",borderRadius:10,border:"none",cursor:"pointer",background:role===r.id?T.accent:"transparent",color:role===r.id?"#fff":T.textSub,fontFamily:FB,fontWeight:600,fontSize:13,transition:"all 0.18s",display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:13}}>{r.ic}</span>{r.lb}
          </button>
        ))}
      </div>
      <button onClick={()=>setIsDark(d=>!d)} style={{display:"flex",alignItems:"center",gap:7,background:T.card,border:`1px solid ${T.border}`,borderRadius:100,padding:"8px 16px",cursor:"pointer",fontFamily:FB,fontWeight:600,fontSize:13,color:T.textSub,transition:"all 0.2s"}}>
        <span style={{fontSize:15}}>{isDark?"☀️":"🌙"}</span>{isDark?"Light":"Dark"}
      </button>
    </div>

    <div style={{padding:"28px 22px"}}>
      {role==="user"  &&<div style={{display:"flex",justifyContent:"center"}}><UserApp T={T}/></div>}
      {role==="driver"&&<div style={{display:"flex",justifyContent:"center"}}><DriverApp T={T}/></div>}
      {role==="admin" &&<AdminPanel T={T}/>}
    </div>
  </div>;
}
