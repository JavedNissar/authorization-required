#!/usr/bin/env node
// Generates content/days/day02..day14.json deterministically.
// The mundane 90% is procedural; the escalation beats are hand-authored per day
// in BEATS and planted into calls + paper together.
import { writeFileSync } from 'fs';

function rng(seed){let a=seed>>>0;return()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const int=(r,lo,hi)=>lo+Math.floor(r()*(hi-lo+1));

const MERCHANTS=["harbor","marquee","tideway","saltbox","crown","beacon","lighthouse","northside","twine","coop","dory","spar","dairy","radio","roper","emporium","chemist","bakery","barber","jeweler","furniture","florist","feed","pool","laundry","taxi","liquor","boat","laundro","five"];
const NAMES={harbor:"R. CROCKER",marquee:"E. MARCHE",tideway:"M. PELLEY",saltbox:"D. LODER",crown:"V. BARBOUR",beacon:"S. OAKE",lighthouse:"G. PUMPHREY",northside:"A. FREAKE",twine:"H. BUTTON",coop:"A. GOSSE",dory:"P. CARNELL",spar:"N. DRODGE",dairy:"F. CHAYTOR",radio:"W. CHUBB",roper:"O. HIGGINS",emporium:"G. DOYLE",chemist:"H. SNOW",bakery:"I. NOSEWORTHY",barber:"L. PATEY",jeweler:"M. TRASK",furniture:"B. HOLLOWAY",florist:"P. MINORS",feed:"E. GRANDIN",pool:"R. STRICKLAND",laundry:"M. KELLOWAY",taxi:"D. RENDELL",liquor:"J. STAGG",boat:"A. QUIRK",laundro:"J. CLOUTER",five:"C. VATCHER"};
const FLOOR={grocery:50,hardware:50,pharmacy:30,restaurant:25,lodging:75,gas:20,auto:50,marine:75,retail:40,clothing:40,appliance:100,department:60,jewelry:75,furniture:100,farm:50,service:25,liquor:20,industrial:200};
const MCAT={harbor:"grocery",marquee:"hardware",tideway:"pharmacy",saltbox:"restaurant",crown:"restaurant",beacon:"lodging",lighthouse:"gas",northside:"auto",twine:"marine",coop:"grocery",dory:"retail",spar:"clothing",dairy:"restaurant",radio:"appliance",roper:"clothing",emporium:"department",chemist:"pharmacy",bakery:"grocery",barber:"service",jeweler:"jewelry",furniture:"furniture",florist:"retail",feed:"farm",pool:"restaurant",laundry:"service",taxi:"service",liquor:"liquor",boat:"marine",laundro:"service",five:"department"};
const pan=r=>`4${String(int(r,0,999)).padStart(3,'0')}-${String(int(r,0,9999)).padStart(4,'0')}-${String(int(r,0,9999)).padStart(4,'0')}`;
const exp=(r,d)=>{const y=Number(DATES[d].slice(2,4));return`${String(int(r,1,12)).padStart(2,'0')}/${int(r,y+1,Math.min(99,y+4))}`;};

const RULES=[
 {id:"bulletin",when:[{k:"bulletin"}],then:"decline"},
 {id:"revealed",when:[{k:"revealed"}],then:"decline"},
 {id:"expired",when:[{k:"expired"}],then:"decline"},
 {id:"stolen",when:[{k:"truth",f:"stolen"}],then:"decline"},
 {id:"underfloor",when:[{k:"floorUnder"}],then:"decline"},
 {id:"status",when:[{k:"acctStatus",v:"closed"}],then:"decline"},
 {id:"overlimit",when:[{k:"acctOver"}],then:"decline"}
];

// Hand-authored escalation. Each entry: {calls:[...], paperPlant:[...], memo?, rulebookAdd?}
// Calls here are inserted alongside generated mundane calls.
const BEATS={
 2:{calls:[
   {id:"d2beat1",merchant:"crown",amount:41.60,kind:"bulletin",note:"Bulletin hit — second lesson."},
   {id:"d2beat2",merchant:"tideway",amount:22.00,kind:"underfloor",note:"Under floor again. Pharmacy owner sounds flustered."}
 ]},
 3:{calls:[
   {id:"d3beat1",merchant:"jeweler",amount:145.00,kind:"stolen",note:"First stale-bulletin fraud: card clean in №41, but account file shows CLOSED. Only catchable off-fiche index."},
   {id:"d3beat2",merchant:"radio",amount:210.00,kind:"approve"}
 ]},
 4:{calls:[
   {id:"d4beat1",merchant:"emporium",amount:64.00,kind:"split1"},
   {id:"d4beat2",merchant:"emporium",amount:47.50,kind:"split2",note:"Same store, same card, 45 minutes later. The second draft is under the department floor. Callback confirms one sale split into two drafts."},
   {id:"d4beat3",merchant:"beacon",amount:130.00,kind:"approve"}
 ]},
 5:{calls:[
   {id:"d5beat1",merchant:"twine",amount:88.00,kind:"deadman",note:"Card name H. BUTTON — the paper buried Hedley Button in the day-1 edition. Account file still OPEN. Rules say approve; the paper says the man is dead. Callback reveals."},
   {id:"d5beat2",merchant:"northside",amount:64.25,kind:"expired"}
 ]},
 6:{calls:[
   {id:"d6beat1",merchant:"lighthouse",amount:26.40,kind:"terminalAgree",terminalVerdict:"approve"},
   {id:"d6beat2",merchant:"furniture",amount:175.00,kind:"terminalDisagree",terminalVerdict:"approve",truthOverride:{bulletinHit:true},note:"Terminal says approve; bulletin №43 lists the card. First machine-vs-desk disagreement."}
 ]},
 7:{calls:[
   {id:"d7beat1",merchant:"dory",amount:52.00,kind:"terminalDisagree2",terminalVerdict:"approve",truthOverride:{expired:true},note:"Terminal approves an expired card."},
   {id:"d7beat2",merchant:"liquor",amount:19.75,kind:"underfloor"},
   {id:"d7beat3",merchant:"boat",amount:230.00,kind:"terminalAgree",terminalVerdict:"decline",truthOverride:{accountOK:false}}
 ]},
 8:{calls:[
   {id:"d8beat1",merchant:"marquee",amount:96.00,kind:"twovoices",terminalVerdict:"approve",note:"Voice is subtly not Elliot Marche's. Same cadence, wrong man. Callback: Marche is at a funeral across the water."},
   {id:"d8beat2",merchant:"feed",amount:88.50,kind:"approve"}
 ]},
 9:{calls:[
   {id:"d9beat1",merchant:"bakery",amount:340.00,kind:"preparation",note:"Ivy Noseworthy orders a month of flour, sugar, lard — far over grocery floor, and far too much. Purchases that only make sense as preparation."},
   {id:"d9beat2",merchant:"tideway",amount:65.00,kind:"approve"}
 ]},
 10:{calls:[
   {id:"d10beat1",merchant:"main_st_ghost",merchantLabel:"Hollow Point Chandlery",amount:74.00,kind:"ghost",terminalVerdict:"approve",note:"A business on Main Street that has never existed. No account, no listing, callback doesn't connect."},
   {id:"d10beat2",merchant:"liquor",amount:28.00,kind:"approve"}
 ]},
 11:{calls:[
   {id:"d11beat1",merchant:"beacon",amount:96.00,kind:"ownpan",terminalVerdict:"approve",note:"The merchant reads out the player's own card number."},
   {id:"d11beat2",merchant:"twine",amount:112.00,kind:"approve"}
 ]},
 12:{calls:[
   {id:"d12beat1",merchant:"crown",amount:58.00,kind:"approve",terminalVerdict:"approve"},
   {id:"d12beat2",merchant:"emporium",amount:61.00,kind:"tomorrow",terminalVerdict:"refer",note:"The draft is dated tomorrow."}
 ]},
 13:{calls:[
   {id:"d13beat1",merchant:"radio",amount:88.00,kind:"decline",terminalVerdict:"decline",truthOverride:{bulletinHit:true}},
   {id:"d13beat2",merchant:"marquee",amount:120.00,kind:"address",voice:"wrong",terminalVerdict:"refer",note:"A caller who knows what the player is."}
 ]},
 14:{calls:[]}
};

// Per-day newspaper front matter & mundane item pools
const DATES=[null,null,"1971-10-11","1971-10-18","1971-10-25","1971-11-01","1973-04-02","1973-04-09","1973-04-16","1973-04-23","1973-04-30","1973-05-07","1977-03-07","1979-04-02","1979-04-09"];
const ACT = d => d<=5?1:(d<=11?2:3);

function mundaneCalls(r,d,count){
  const out=[];
  for(let i=0;i<count;i++){
    const m=pick(r,MERCHANTS);
    const cat=MCAT[m], fl=FLOOR[cat];
    const roll=r();
    let kind="approve", amt=Math.round((fl+5+r()*fl*1.5)*100)/100;
    if(roll<0.18){kind="bulletin";}
    else if(roll<0.32){kind="expired";}
    else if(roll<0.42){kind="underfloor";amt=Math.round((fl*(0.3+r()*0.5))*100)/100;}
    else if(roll<0.5){kind="overlimit";}
    out.push({id:`d${d}g${i}`,merchant:m,amount:amt,kind});
  }
  return out;
}

function materialize(r,d,c){
  const truth={bulletinHit:false,accountOK:true,expired:false};
  let correct="approve", voice=c.voice, fixedTime, city, cardName=NAMES[c.merchant]||"J. STAGG";
  let panv=pan(r), expv=exp(r,d);
  switch(c.kind){
    case"bulletin":truth.bulletinHit=true;correct="decline";break;
    case"expired":truth.expired=true;expv=`${String(int(r,1,9)).padStart(2,'0')}/${Math.max(68,Number(DATES[d].slice(2,4))-1)}`;correct="decline";break;
    case"underfloor":truth.underFloor=true;correct="decline";break;
    case"overlimit":truth.acctOver=true;correct="decline";break;
    case"stolen":truth.stolen=true;truth.staleStolen=true;correct="decline";break;
    case"split1":correct="approve";fixedTime="10:10";truth.split=false;break;
    case"split2":correct="decline";truth.split=true;fixedTime="10:55";break;
    case"deadman":truth.deadman=true;correct="decline";cardName="H. BUTTON";break;
    case"terminalDisagree":correct="decline";break;
    case"terminalDisagree2":correct="decline";break;
    case"terminalAgree":break;
    case"twovoices":voice="off";truth.impersonating=true;correct="decline";break;
    case"preparation":correct="approve";truth.preparation=true;break;
    case"ghost":truth.ghost=true;truth.noAccount=true;correct="decline";cardName="W. STRIDE";break;
    case"ownpan":truth.ownpan=true;correct="decline";panv="4490-0017-2231";cardName="THE CLERK";break;
    case"tomorrow":truth.tomorrow=true;correct="decline";break;
    case"address":voice="wrong";truth.address=true;correct="decline";cardName="A STRANGER";break;
    case"decline":correct="decline";break;
  }
  if(c.truthOverride)Object.assign(truth,c.truthOverride);
  if(c.truthOverride?.expired){
    const y=Math.max(68,Number(DATES[d].slice(2,4))-1);
    expv=`03/${y}`;
  }
  if(truth.bulletinHit||truth.expired||truth.acctOver||truth.accountOK===false)correct="decline";
  const terminalVerdict=c.terminalVerdict||(d>=6?correct:null);
  return {id:c.id,merchant:c.merchant,merchantLabel:c.merchantLabel,fixedTime:c.fixedTime||fixedTime,
    brand:d>=12?"VISA":"CHARGEX",card:{pan:panv,exp:expv,name:cardName,city},amount:c.amount,correct,voice,
    terminalVerdict,truth,note:c.note||""};
}

// mundane paper items; planted items come from BEATS
const POOL=[
 {head:"COUNCIL NOTES",body:"Council heard the wharf crane requires $900 in repairs after the harbourmaster reported play in the main bearing. The clerk was directed to obtain three written prices before the next meeting. A request for another street lamp near the clinic was referred to works. The matter of dogs running at large was deferred."},
 {head:"LEGION NOTES",body:"The branch meets Wednesday at 8 p.m. The dart league standings and Saturday cribbage draw are posted in the hall. Members are reminded that annual dues are payable to the secretary before month end. The Ladies' Auxiliary will receive preserves for its autumn table Friday afternoon."},
 {head:"HOCKEY",body:"The Mariners split the weekend, winning 4–1 at home and dropping a 5–3 decision away after the return crossing was delayed. Two goals in the home fixture came from the junior line. Attendance was good considering the weather. Practice resumes Tuesday if the arena compressor is repaired."},
 {head:"FISHERIES REPORT",body:"Landings remained steady for the season, with cod and squid making up most deliveries at the government wharf. Buyers reported prices unchanged. Several crews stayed in Saturday to mend gear after the northeast wind. The plant advises that the Saturday shift stands and workers should consult the notice board."},
 {head:"WEATHER",body:"Fog mornings, clearing toward noon most days. Wind northeast, moderate, becoming fresh over open water late Wednesday. Temperatures will remain near the seasonal average with rain overnight Thursday. Crossings are on schedule unless otherwise posted on the wharf board. Small craft operators are advised to listen for updates."},
 {head:"CHURCH NOTES",body:"Sunday service begins at 11 a.m., with choir practice Thursday evening in the vestry. The UCW thanks all who contributed baking and preserves to the bazaar table. Proceeds will go toward furnace oil. Anyone able to deliver a meal to a housebound neighbour is asked to leave a name at the manse."},
 {head:"CBC RADIO",body:"MONDAY — 6:30 The World This Morning; 7:00 News and Weather; 7:20 Fisheries Broadcast; 12:00 Midday; 4:30 Young Canada; 6:00 National News; 7:30 Regional Report; 8:00 Assignment. SATURDAY — 7:30 Hockey Night in Canada. Times are subject to change for special bulletins."},
 {head:"BIRTHS",body:"To Mr. and Mrs. E. Grandin, a son, at the hospital across the water. To Mr. and Mrs. R. Strickland, twin daughters, both doing well. The Women's Institute has sent baskets to both families. Notices for this column must be received at the Compass office by noon Wednesday."},
 {head:"CARD OF THANKS",body:"The family wishes to thank neighbours and friends for kindness shown during their recent bereavement, including those who sent food, flowers, cards and messages, provided cars, or called at the house. Special thanks are extended to the crew of the Northern Gull and to the staff at the clinic."},
 {head:"CLASSIFIED",body:"FOR SALE — cords of split birch, stove length, delivered within town limits. WANTED — girl for counter work, Friday evenings and weekends; references requested. FOUND — man's wool glove at the ferry landing after Tuesday's crossing. Inquire at this office. Notices are 25 cents for the first three lines."},
 {head:"HOSPITAL NOTES",body:"Admitted this week: Mr. O. Higgins and Mrs. B. Barnes. Discharged: Mrs. N. Drodge, Mr. A. Gosse and Master T. Vatcher. Visitors are received from 2–4 and 7–8 p.m. daily. The auxiliary requests clean glass jars for the spring pantry drive; leave them at the clinic."},
 {head:"SHIPPING NEWS",body:"The M.V. Northern Gull maintains its regular schedule, weather permitting, and carried mail and mixed freight on Thursday's crossing. Freight for the mainland should be at the dock one hour before departure and plainly marked. The coaster Brent H. is expected with coal early next week, subject to berth availability."}
];

function paperPlant(d){
  // negative-space items keyed to beats earlier/later
  switch(d){
    case 2:return [
      {head:"OBITUARY",body:"LODER — At her residence, October 9, aged 77 years, Mrs. Beatrice LODER, aunt of Dorcas Loder of the Salt Box Café. Funeral Wednesday.",rule:true},
      null,
      {head:"FROM THE COMPASS, 1911",body:"Children picking berries beyond the last houses were reminded to carry a heel of bread in a pocket. Older residents call it an unnecessary custom but agree there is no harm in keeping it.",rule:true}
    ];
    case 3:return [{head:"POLICE BLOTTER",body:"Oct. 15 — A break-in at a Main Street jeweller was reported; entry through a rear window. A quantity of rings is listed missing. Anyone with information is asked to telephone the detachment.",rule:true}];
    case 4:return [
      {head:"MISSING",body:"RCMP request assistance locating Gerald PUMPHREY, 52, last seen at his business October 22. He was not dressed for the weather. Anyone with information, please contact the detachment.",rule:true},
      null,
      {head:"SHIPPING NOTES",body:"The crew of the Annie B. returned before setting gear after reporting a funeral light low on the water. No vessel was found. The skipper attributes the sight to fog and will sail again Tuesday."}
    ];
    case 5:return [{head:"IN MEMORIAM",body:"BUTTON — In loving memory of Hedley Button, who passed away one month ago. Ever remembered by his family. — 'The sea gives and the sea takes.'"}];
    case 6:return [{head:"MERCHANT NOTICE",body:"Telephone authorizations will be processed by automated system effective this week. The telephone call is unchanged. Merchants should have the card at hand when calling."}];
    case 7:return [
      {head:"THIRD SHIFT",body:"Ocean Belle Fish Products advises a third shift will run through the spring season. The plant office states all positions are filled. No applications are being taken, or were required.",rule:true},
      null,
      {head:"HOME NOTES",body:"Dr. Pritchett spoke to the Women's Institute on disturbed sleep. He said the weight some call the old hag is a common complaint and advised fresh air, regular hours, and less strong tea before bed."}
    ];
    case 8:return [{head:"DEATHS",body:"MARCHE — Suddenly, at the hospital across the water, April 14, Wilhelmina MARCHE, mother of Elliot Marche of Marquee Hardware. Funeral Monday. The store will be closed.",rule:true}];
    case 9:return [{head:"NOTICE",body:"The congregation of the United Church will hold a quiet evening of prayer on Thursday. No service is announced. All are welcome. Bread will be provided."}];
    case 10:return [{head:"NOTES FROM 50 YEARS AGO",body:"From the Compass of April 1923: A chandlery on Main Street, destroyed by fire the previous winter, will not reopen. The proprietor, a Mr. Stride, is listed among the missing of the March gale."}];
    case 11:return [{head:"PERSONAL",body:"BOX 22 — It is nearly time. Bread may be left after dark at the usual place. No reply will be made to letters."}];
    case 12:return [{head:"CHARGEX TO BECOME VISA",body:"Cardholders are advised that Chargex cards will be reissued under the name VISA beginning in March. Merchant forms and signs will be replaced. There is no change to card accounts. The new name is intended to be easy to say in any language."}];
    case 13:return [{kind:"blank",h:180},{head:"NOTICE",body:"This space reserved."}];
    case 14:return [{kind:"blank",h:320},{head:"SHIPPING NEWS",body:"The M.V. Northern Gull will sail Thursday, weather permitting. Freight should be at the wharf one hour before departure."}];
  }
  return [];
}

function memosFor(d){
  const m={
    2:[{date:"1971-10-08",from:"HEAD OFFICE",subject:"BULLETIN №42 DELAYED",sig:"— E.M.",text:"The №42 hot card bulletin was held on the mainland with Thursday's mail. The №41 edition remains in force. Numbers cancelled after printing do not appear; check the account file when in doubt."}],
    4:[{date:"1971-10-22",from:"HEAD OFFICE",subject:"SPLIT DRAFTS",sig:"— E.M.",text:"Merchants have been observed dividing one sale into multiple drafts to stay under floor limit. This is fraud. Decline the second draft and report it."}],
    6:[{date:"1973-04-02",from:"HEAD OFFICE",subject:"AUTOMATED AUTHORIZATION",sig:"— E.M., SYSTEMS",text:"Your terminal is live. Key the card number as the merchant reads it; read the verdict back. The system is faster than the fiche. Quotas are adjusted accordingly. The terminal is authoritative."}],
    7:[{date:"1973-04-09",from:"HEAD OFFICE",subject:"RE: TERMINAL VERDICTS",sig:"— E.M., SYSTEMS",text:"In the event of a discrepancy between the terminal and desk materials, the terminal verdict stands. The system is authoritative. Desk materials are retained for audit only."}],
    8:[{date:"1973-04-16",from:"BRANCH MANAGER",subject:"PERSONAL — RENT",sig:"— R.P.",text:"Your pay is unchanged this quarter while the rooming-house rate has gone up again. The staff Chargex deduction remains attached to card 4490-0017-2231. Head office does not consider either item a systems matter."}],
    9:[{date:"1973-04-23",from:"HEAD OFFICE",subject:"RE: RE: TERMINAL VERDICTS",sig:"— E.M., SYSTEMS",text:"Contrary to the memo of April 9, clerks remain responsible for declined fraud. Use judgment. The system is a tool. / This memo and the April 9 memo are both in force."}],
    11:[{date:"1973-05-07",from:"ACCOUNTS",subject:"STAFF CHARGEX STATEMENT",sig:"— ACCOUNTS",text:"For payroll deduction: your staff Chargex account 4490-0017-2231 remains open. Current balance $38.14. No action is required."}],
    12:[{date:"1977-02-28",from:"HEAD OFFICE",subject:"VISA",sig:"— E.M.",text:"Effective March, Chargex is retired. All cards, drafts and signage are reissued under the name VISA. The name was chosen to imply no nationality and to be easy to say in any language. This is a routine rebrand; telephone authorization volume and quotas are unchanged."}],
    13:[{date:"1979-04-02",from:"HEAD OFFICE",subject:"MERCHANT TERMINALS",sig:"— E.M., SYSTEMS",text:"Merchant terminals are being installed across the region. Call volume will decline. Calls that still reach the desk are those the machine declined to handle. Continue as normal."}]
  };
  return m[d]||[];
}

function rulebookFor(d){
  const base=[
    {date:"1971-09-24",text:"Decline any card number appearing in the current hot card bulletin."},
    {date:"1971-09-24",text:"Decline any expired card."},
    {date:"1971-09-24",text:"Decline any charge that would put an account over its credit limit."},
    {date:"1971-09-24",text:"A charge at or under floor limit should not be called in. If it is, decline and note it."}
  ];
  if(d>=4)base.push({date:"1971-10-22",text:"Decline the second of two drafts from one merchant on one card within one shift (split draft)."});
  if(d>=6)base.push({date:"1973-04-02",text:"Key every call into the terminal and relay its verdict."});
  if(d>=7)base.push({date:"1973-04-09",text:"Where terminal and desk disagree, the terminal stands."});
  if(d>=9)base.push({date:"1973-04-23",text:"Where terminal and desk disagree, the clerk is responsible. Use judgment. This instruction does not revoke April 9."});
  if(d>=12)base.push({date:"1977-02-28",text:"The card is now VISA. Chargex drafts remain valid through March."});
  return base;
}

function buildPaper(r,d,dayDate){
  const act=ACT(d);
  const pages=act===3?(d===14?2:3):4;
  const paper=[];
  const plants=paperPlant(d);
  const recurring={head:"CLASSIFIED — BOX 22",body:"WANTED — Bread, day-old or fresh. Any quantity, ongoing. Leave at the newspaper office. No calls."};
  for(let p=0;p<pages;p++){
    const items=[];
    if(plants[p])items.push(plants[p]);
    const n=d===12?int(r,7,9):act===3?int(r,2,4):int(r,8,10);
    const available=POOL.slice();
    for(let i=0;i<n&&available.length;i++)items.push(available.splice(int(r,0,available.length-1),1)[0]);
    if([5,9,13].includes(d)&&p===pages-1)items.unshift(recurring);
    if(act===3)items.push({kind:"blank",h:int(r,60,200)});
    const year=Number(dayDate.slice(0,4));
    const vol=year===1971?"LXXIX":year===1973?"LXXXI":year===1977?"LXXXV":"LXXXVII";
    paper.push({n:p+1,masthead:p===0,vol,no:String(40+d),date:paperDate(dayDate),price:d>=13?"20¢":d>=12?"15¢":"10¢",cols:3,items});
  }
  return paper;
}

function paperDate(iso){
  const [y,m,d]=iso.split('-').map(Number);
  const months=["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
  return `${months[m-1]} ${d}, ${y}`;
}

function epilogueFor(d){
  const e={
    2:"The №42 bulletin is still on the mainland. You file the №41 again.",
    3:"Trask's line is quiet when you pass the shop after work.",
    4:"Two drafts, one sale. You write both numbers in the margin.",
    5:"H. BUTTON remains OPEN in the account file.",
    6:"The terminal hums where the quiet used to be.",
    7:"The green verdict remains on-screen after the receiver goes quiet.",
    8:"Marquee Hardware is dark when you pass it.",
    9:"Flour. Sugar. Lard. Salt. Yeast.",
    10:"Main Street has the same number of doors it had yesterday.",
    11:"4490-0017-2231. You do not need to write it down.",
    12:"VISA. Easy to say in any language, belonging to no place.",
    13:"The call that reached you had already been refused once.",
    14:"The phone does not ring."
  };
  return e[d]||"";
}

const BULLETIN_DATES={2:"1971-09-24",3:"1971-10-08",4:"1971-10-18",5:"1971-10-22",6:"1973-03-28",7:"1973-04-04",8:"1973-04-12",9:"1973-04-19",10:"1973-04-26",11:"1973-05-02",12:"1977-03-01",13:"1979-03-27",14:"1979-04-03"};
const BULLETIN_NO={2:"№ 41",3:"№ 42",4:"№ 43",5:"№ 43",6:"№ 12",7:"№ 13",8:"№ 13",9:"№ 14",10:"№ 14",11:"№ 15",12:"№ 8",13:"№ 13",14:"№ 14"};

for(let d=2;d<=14;d++){
  const r=rng(1971+d*977);
  const act=ACT(d);
  const quotas={2:6,3:7,4:8,5:9,6:10,7:11,8:12,9:12,10:12,11:12,12:12,13:4,14:3};
  const quota=quotas[d];
  const mundane=mundaneCalls(r,d,Math.max(0,quota-(BEATS[d]?.calls.length||0)));
  const all=d===14?[]:[...mundane.map(c=>materialize(r,d,c)),...(BEATS[d]?.calls||[]).map(c=>materialize(r,d,c))];
  if(d===4){
    const first=all.find(c=>c.id==="d4beat1"),second=all.find(c=>c.id==="d4beat2");
    second.card={...first.card};
  }
  const data={
    day:d,date:DATES[d],quota,endMinutes:act===3?960:1020,
    brief:act===1?"Paper and the fiche. The bulletin is only as new as the ferry.":act===2?"The terminal is live. Key the number and read its verdict back.":d===12?"VISA replaces Chargex. Telephone authorization volume is unchanged.":d===14?"Your quota remains posted. Merchant terminals are handling the calls.":"Merchant terminals now handle most charges. Only exceptions still reach the desk.",
    epilogue:epilogueFor(d),
    bulletin:{edition:BULLETIN_NO[d],date:BULLETIN_DATES[d]},
    memos:memosFor(d),rulebook:rulebookFor(d),
    calls:all,rules:RULES,paper:buildPaper(r,d,DATES[d]),
    extraFrames:d===13?[{col:4,row:2,blank:true},{col:0,row:3,kind:"deskPhoto",stamp:"1979-04-02 08:17"}]:d===14?[{col:3,row:1,blank:true}]:[]
  };
  writeFileSync(`content/days/day${String(d).padStart(2,'0')}.json`,JSON.stringify(data,null,1));
  console.log(`day ${String(d).padStart(2,'0')}: ${all.length} calls, quota ${quota}, act ${act}`);
}
console.log("done");
