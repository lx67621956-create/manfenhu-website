var PE = ["🐱","🐶","🐰","🐻","🦊",
"🐼","🐧","🦉","🐹","🐿️",
"🐉","🦅","🦄","🦁","🧚",
"🧝","🧜‍♀️","☃️","🦊","🦌",
"🔥","💧","🪨","🌪️","⚡",
"❄️","👻","🌟","🌿","⭐"];

var TP=30,CP=10,UE=20,MB=3,BP=1;

function pg(id,an,cl){
  var p=String(id+1).padStart(2,"0"),c=cl||"pet-gif";
  return '<img class="'+c+'" src="/images/pets/pet_'+p+'_'+an+'.gif" alt="">';
}
function pi(id){
  var p=String(id+1).padStart(2,"0");
  return '<img class="pet-icon" src="/images/pets/pet_'+p+'_idle.gif" alt="">';
}

var BS=(()=>{var s=[];for(var i=0;i<TP;i++){var sd=(i*7+13)%17;s.push({hp:8+sd*3%13,atk:5+sd*5%12,def:4+sd*2%11,spd:5+sd*7%13,int:4+sd*11%13,luk:3+sd*13%9})}return s})();

var SI=[
{id:"fs",n:"🥐 小份粮食",i:"🥐",d:"+15 饱食度",c:5,e:{h:15}},
{id:"fm",n:"🍗 中份粮食",i:"🍗",d:"+35 饱食度",c:10,e:{h:35}},
{id:"fl",n:"🍖 大份粮食",i:"🍖",d:"+60 饱食度",c:18,e:{h:60}},
{id:"xs",n:"🧪 小经验瓶",i:"🧪",d:"+10 经验",c:5,e:{x:10}},
{id:"xm",n:"⚗️ 中经验瓶",i:"⚗️",d:"+25 经验",c:11,e:{x:25}},
{id:"xl",n:"💎 大经验瓶",i:"💎",d:"+50 经验",c:20,e:{x:50}},
{id:"rp",n:"✨ 随机实力药水",i:"✨",d:"随机提升属性",c:15,e:{r:true}},
{id:"pb",n:"🎁 精灵盲盒",i:"🎁",d:"随机解锁新精灵",c:300,e:{u:true}}
];

var AC=[
  {id:"first",n:"初来乍到",i:"🌱",d:"首次登录",check:function(p){return p.totalCheckins>=1}},
  {id:"check10",n:"打卡达人",i:"📅",d:"打卡10次",check:function(p){return p.totalCheckins>=10}},
  {id:"check50",n:"打卡大师",i:"🏅",d:"打卡50次",check:function(p){return p.totalCheckins>=50}},
  {id:"firstBattle",n:"第一场战斗",i:"⚔️",d:"完成首次对战",check:function(p){return (p.battleHistory||[]).length>=1}},
  {id:"win10",n:"常胜将军",i:"🏆",d:"战斗胜利10场",check:function(p){return (p.battleHistory||[]).filter(function(h){return h.result==="win"}).length>=10}},
  {id:"collect10",n:"收藏家",i:"📖",d:"解锁10只精灵",check:function(p){return (p.petSlots||[]).length>=10}},
  {id:"collect30",n:"精灵大师",i:"👑",d:"集齐全部30只精灵",check:function(p){return (p.petSlots||[]).length>=30}},
  {id:"rich10k",n:"富甲一方",i:"💰",d:"积攒10000积分",check:function(p){return p.points>=10000}},
  {id:"train50",n:"训练师",i:"🧪",d:"训练50次",check:function(p){return(p.totalTrainings||0)>=50}}];

var st={people:{},personOrder:[],curPerson:null,curSlot:null,tn:null};
var DP=["张三","李四","王五","赵六"];

function dedup(n){var p=st.people[n];if(!p||!p.petSlots)return;var seen={},news=[],newlv=[],newxp=[],newsb=[];p.petSlots.forEach(function(sl,i){if(!seen[sl]){seen[sl]=true;news.push(sl);newlv.push(p.petLevels[i]);newxp.push(p.petXP[i]);newsb.push(p.statBonus&&p.statBonus[i]?p.statBonus[i]:{hp:0,atk:0,def:0,spd:0,int:0,luk:0})}});if(news.length<p.petSlots.length){p.petSlots=news;p.petLevels=newlv;p.petXP=newxp;p.statBonus=newsb;sv()}}
function initSt(){var r=localStorage.getItem("checkin_pets");if(r){try{st=JSON.parse(r);st.personOrder.forEach(fx);syncAPI();return}catch(e){}}if(navigator.onLine){var x=new XMLHttpRequest();x.open("GET","/api/data",false);try{x.send();if(x.status===200){var d=JSON.parse(x.responseText);if(d&&d.people&&Object.keys(d.people).length){st=d;sv();return}}}catch(e){}}DP.forEach(function(n){st.people[n]=mkP();st.personOrder.push(n)});if(!st.tn)st.tn=null;sv()}
function syncAPI(){
  if(!navigator.onLine)return;
  var x=new XMLHttpRequest();
  x.open("GET","/api/data",true);
  x.onload=function(){
    if(x.status===200){
      try{
        var d=JSON.parse(x.responseText);
        if(d&&d.people&&!d.empty){
          mergeWithAPI(d);
        }else{
          apiSv()
        }
      }catch(e){apiSv()}
    }else{apiSv()}
  };
  x.onerror=function(){apiSv()};
  x.send()
}
function mergeWithAPI(apiData){
  var changed=false;
  if(!st.people){st.people={};st.personOrder=[]}
  Object.keys(apiData.people).forEach(function(n){
    if(!st.people[n]){
      st.people[n]=apiData.people[n];
      st.personOrder.push(n);
      changed=true;
    }else{
      var localTS=st.people[n].lastTimestamp||0;
      var apiTS=apiData.people[n].lastTimestamp||0;
      if(apiTS>localTS){
        // 字段级智能合并：关键数值取最大值，防止并发操作丢失
        var local=st.people[n];
        var api=apiData.people[n];
        api.points=Math.max(api.points||0,local.points||0);
        api.totalCheckins=Math.max(api.totalCheckins||0,local.totalCheckins||0);
        api.battlesToday=Math.max(api.battlesToday||0,local.battlesToday||0);
        // 合并战斗记录
        if(local.battleHistory&&local.battleHistory.length){
          api.battleHistory=api.battleHistory||[];
          local.battleHistory.forEach(function(h){
            var dup=api.battleHistory.some(function(ah){return ah.date===h.date&&ah.opponent===h.opponent});
            if(!dup)api.battleHistory.push(h);
          });
        }
        // 合并pendingBoxes
        if(local.pendingBoxes&&local.pendingBoxes.length){
          api.pendingBoxes=api.pendingBoxes||[];
          local.pendingBoxes.forEach(function(b){
            if(api.pendingBoxes.indexOf(b)<0)api.pendingBoxes.push(b);
          });
        }
        st.people[n]=api;
        changed=true;
      }
    }
  });
  if(changed){sv()}else{apiSv()}
}
function mkP(){var ri=Math.floor(Math.random()*TP);return{points:0,totalCheckins:0,currentPetIdx:0,petSlots:[ri],petLevels:[1],petXP:[0],statBonus:[{hp:0,atk:0,def:0,spd:0,int:0,luk:0}],hunger:80,happiness:80,lastTimestamp:Date.now(),password:"123456",battlesToday:0,battleDate:"",pendingBoxes:[],battleHistory:[]}}
function fx(n){var p=st.people[n];if(!p)return;if(!p.petSlots)p.petSlots=[0];if(!p.petLevels)p.petLevels=[1];if(!p.petXP)p.petXP=[0];if(typeof p.currentPetIdx!="number")p.currentPetIdx=0;if(typeof p.hunger!="number")p.hunger=80;if(typeof p.happiness!="number")p.happiness=80;if(!p.lastTimestamp)p.lastTimestamp=Date.now();if(typeof p.totalCheckins!="number")p.totalCheckins=0;if(typeof p.battlesToday!="number")p.battlesToday=0;if(!p.battleDate)p.battleDate="";if(typeof p.password!="string"||!p.password)p.password="123456";if(!p.pendingBoxes)p.pendingBoxes=[];if(!p.battleHistory)p.battleHistory=[];var td=fd();if(p.battleDate!=td){p.battlesToday=0;p.battleDate=td}if(!p.statBonus||!p.statBonus.length){p.statBonus=[];p.petSlots.forEach(function(){p.statBonus.push({hp:0,atk:0,def:0,spd:0,int:0,luk:0})})}var ex=exp(p.totalCheckins);while(p.petSlots.length<ex){var idx=rb(n);if(idx!==null)p.pendingBoxes.push(idx);else break}if(p.currentPetIdx>=p.petSlots.length)p.currentPetIdx=0}
function fd(){var d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()}
function sv(){localStorage.setItem("checkin_pets",JSON.stringify(st));try{var x=new XMLHttpRequest();x.open("POST","/api/data",true);x.setRequestHeader("Content-Type","application/json");x.send(JSON.stringify(st))}catch(e){}}
var _apiTimer=0;
function apiSv(){clearTimeout(_apiTimer);_apiTimer=setTimeout(function(){try{var d=JSON.stringify(st);localStorage.setItem("checkin_pets",d);var x=new XMLHttpRequest();x.open("POST","/api/data",true);x.setRequestHeader("Content-Type","application/json");x.send(d)}catch(e){}},200)}
function exp(c){return Math.min(TP,1+Math.floor(c/UE))}
function xfl(l){return 30+l*7}
function rb(n){var p=st.people[n];if(!p)return null;var s=new Set(p.petSlots);(p.pendingBoxes||[]).forEach(function(i){s.add(i)});if(s.size>=TP)return null;var a=[];for(var i=0;i<TP;i++)if(!s.has(i))a.push(i);return a.length?a[Math.floor(Math.random()*a.length)]:null}
function gs(sl,lv){var b=BS[sl]||{hp:10,atk:8,def:6,spd:7,int:7,luk:6},m=1+(lv-1)*0.05;var r={hp:Math.round(b.hp*m),atk:Math.round(b.atk*m),def:Math.round(b.def*m),spd:Math.round(b.spd*m),int:Math.round(b.int*m),luk:Math.round(b.luk*m)};var bu=(st.people[st.tn||st.curPerson]?.statBonus?.[st.people[st.tn||st.curPerson]?.currentPetIdx||0]);if(bu){r.hp+=bu.hp;r.atk+=bu.atk;r.def+=bu.def;r.spd+=bu.spd;r.int+=bu.int;r.luk+=bu.luk}return r}
function pwr(s,lv){return s.hp*0.8+s.atk*1.5+s.def*1.0+s.spd*1.0+s.int*1.2+s.luk*0.8+lv*2}
function cs(p){var hrs=(Date.now()-(p.lastTimestamp||Date.now()))/3600000;var h=Math.max(0,Math.min(100,Math.round(p.hunger-hrs*8)));var ha=Math.max(0,Math.min(100,Math.round(p.happiness-(h<40?hrs*6:hrs*2))));return{hunger:h,happiness:ha}}
function login(){var n=document.getElementById("loginName").value.trim(),pw=document.getElementById("loginPwd").value.trim(),err=document.getElementById("loginError");if(!n){err.textContent="请输入姓名";err.style.display="block";return}if(!st.people[n]){err.textContent="❌ "+n+" 不存在";err.style.display="block";return}if(st.people[n].password&&st.people[n].password!==pw){err.textContent="❌ 密码错误";err.style.display="block";return}st.tn=n;br=false;window._battlePicks=[];document.getElementById("battleResult").classList.remove("show");document.getElementById("battleLog").innerHTML="";document.getElementById("battleStart").disabled=false;sv();err.style.display="none";document.getElementById("loginName").textContent="";document.getElementById("loginName").value="";document.getElementById("loginPwd").value="";document.getElementById("nav").classList.add("show");checkAchievements(n);playSound("login");showPg("pageHome");rHome()}

function toast(msg){var el=document.getElementById("toast");if(!el)return;el.textContent=msg;el.classList.add("show");setTimeout(function(){el.classList.remove("show")},2500)}
function checkAchievements(n){
  var p=st.people[n];
  if(!p)return;
  if(!p.achievements)p.achievements=[];
  var unlocked=false;
  AC.forEach(function(a){
    if(p.achievements.indexOf(a.id)<0 && a.check(p)){
      p.achievements.push(a.id);
      toast("🏆 解锁成就: "+a.i+" "+a.n);
      playSound("achievement");
      unlocked=true
    }
  });
  if(unlocked)sv()
}

function rHome(){var n=st.tn,p=st.people[n];if(!p)return;var idx=p.currentPetIdx,sid=p.petSlots[idx],lv=p.petLevels[idx],xp=p.petXP[idx],nd=xfl(lv),pct=Math.min(100,xp/nd*100),mx=lv>=100;var sk=cs(p);var bx=p.pendingBoxes?.length||0,bh=p.battleHistory||[];var acs=p.achievements||[];document.getElementById("homeContent").innerHTML='<div class=hh><div class=tn>🎮 '+n+' <span class="logout-link" onclick="logout()">[退出]</span></div><div class=tp>⭐ '+p.points+' 金币</div><div class=ts><span>🐾 '+p.petSlots.length+'/'+TP+'</span><span>🔥 打卡 '+p.totalCheckins+' 次</span></div></div>'+
'<div class=ps><div class=walk-area><img id=homePetGif class=pg src="/images/pets/pet_'+String(sid+1).padStart(2,"0")+'_'+(window._pf||"walk")+'.gif" alt=""></div><div class=pn>精灵 #'+(sid+1)+'</div><span class="pt badge '+(mx?"bg-gold":"bg-blue")+'">Lv.'+lv+(mx?" 🏆":"")+'</span></div>'+
'<div class=eb><div class=pt><div class=pf style="width:'+pct+'%"></div></div><div class=et>'+(mx?"🏆 已满级！":"EXP "+(nd-xp)+" 到下一级")+'</div></div>'+
'<div class=bg><div class=bi><div class=lb>🍖 饱食度</div><div class=bpt><div class=bpf style="width:'+sk.hunger+'%;background:'+(sk.hunger>60?"#32CD32":sk.hunger>30?"#FFA500":"#FF4500")+'"></div></div><div class=bv>'+(sk.hunger)+'%</div></div><div class=bi><div class=lb>😊 心情</div><div class=bpt><div class=bpf style="width:'+sk.happiness+'%;background:'+(sk.happiness>60?"#32CD32":sk.happiness>30?"#FFA500":"#FF4500")+'"></div></div><div class=bv>'+(sk.happiness)+'%</div></div></div>'+
'<div class=ga><button class="gb fd" onclick="fdAct()"><span class=gi>🍖</span><span class=gl>喂食</span><span class=gc>-5 金币</span></button><button class="gb tr" onclick="trAct()"><span class=gi>🧪</span><span class=gl>训练</span><span class=gc>-5 金币</span></button></div>'+
(bx>0?'<div class="box-section"><button class="btn-gold" onclick="ob('+"'"+n+"'"+',0)">🎁 打开盲盒 (剩'+bx+')</button></div>':"")+
'<div><div class=plt><span>🐾 我的精灵</span><span style=font-size:12px;color:#999>点一下切换 · 点两下详情</span></div><div class=scroll-x>'+p.petSlots.map(function(sl,i){var e=PE[sl]||"🐣",lv2=p.petLevels[i],act=i===p.currentPetIdx;return '<div class="pli'+(act?" cur":"")+'" data-sl="'+i+'">'+(act?'<span class=pb>✔</span>':'')+'<div class=pi>'+(pi(sl)||e)+'</div><div class=plv2>Lv.'+lv2+'</div></div>';}).join("")+'</div></div>'+
(acs.length>=0?'<div style="margin-top:10px"><div class="plt">🏆 成就墙 ('+acs.length+'/'+AC.length+')</div><div class="ac-grid">'+AC.map(function(a){var has=acs.indexOf(a.id)>=0;return '<div class="ac-item '+(has?"unlocked":"lock")+'"><span class="ac-icon">'+a.i+'</span><span class="ac-name">'+a.n+'</span></div>'}).join("")+'</div></div>':"")+
'<div style=margin-top:10px><div class=plt><span>⚔️ 战斗记录</span><span style=font-size:11px;color:#999>共 '+bh.length+' 场</span></div><div class=bhl>'+(bh.length?bh.slice().reverse().slice(0,20).map(function(h){return '<div class=bhi><span class="brr '+(h.result==="win"?"w":"l")+'">'+(h.result==="win"?"胜":"负")+'</span><div class=bho>VS '+h.opponent+'</div><div class=bhd>战力 '+h.myPower+'</div><div class=bhdt>'+h.date+'</div></div>';}).join(""):'<div class="empty-battle">还没有战斗记录</div>')+'</div></div>';
document.querySelectorAll(".pli").forEach(function(el){var dc=0;el.addEventListener("click",function(){dc++;var si=parseInt(this.getAttribute("data-sl"));if(dc===1){setTimeout(function(){if(dc===1){dc=0;st.curPerson=n;st.curSlot=si;p.currentPetIdx=si;sv();swPet(si)}},300)}else if(dc>=2){dc=0;st.curPerson=n;st.curSlot=si;p.currentPetIdx=si;sv();rPet();showPg("pagePet")}})});}

function swPet(si){var n=st.tn,p=st.people[n];if(!p)return;var sl=p.petSlots[si],lv=p.petLevels[si],xp=p.petXP[si],nd=xfl(lv),pct=Math.min(100,xp/nd*100),mx=lv>=100,sk=cs(p);var gif=document.getElementById("homePetGif");if(gif)gif.src="/images/pets/pet_"+String(sl+1).padStart(2,"0")+"_"+(window._pf||"walk")+".gif";var pn=document.querySelector(".pn");if(pn)pn.textContent="🐾 精灵 #"+(sl+1);var pt=document.querySelector(".pt .badge");if(pt)pt.textContent="Lv."+lv+(mx?" 🏆":"");var eb=document.querySelector(".eb .pf");if(eb)eb.style.width=pct+"%";var et=document.querySelector(".eb .et");if(et)et.textContent=mx?"🏆 已满级！":"EXP "+(nd-xp)+" 到下一级";var bis=document.querySelectorAll(".bi");if(bis.length>=2){var b1=bis[0].querySelector(".pf");if(b1){b1.style.width=sk.hunger+"%";b1.style.background=sk.hunger>60?"#32CD32":sk.hunger>30?"#FFA500":"#FF4500"}var bv1=bis[0].querySelector(".bv");if(bv1)bv1.textContent=sk.hunger+"%";var b2=bis[1].querySelector(".pf");if(b2){b2.style.width=sk.happiness+"%";b2.style.background=sk.happiness>60?"#32CD32":sk.happiness>30?"#FFA500":"#FF4500"}var bv2=bis[1].querySelector(".bv");if(bv2)bv2.textContent=sk.happiness+"%"}document.querySelectorAll(".pli").forEach(function(e,i){e.classList.toggle("cur",i===si);if(i===si){var b=e.querySelector(".pb");if(!b){b=document.createElement("span");b.className="pb";b.textContent="✔";e.appendChild(b)}}else{var b2=e.querySelector(".pb");if(b2)b2.remove()}});resetWalk()}
function resetWalk(){var e=document.querySelector(".walk-area .pg");if(e){e.style.animation="none";void e.offsetWidth;e.style.animation="walkAcross 8s ease-in-out infinite alternate"}}
function fdAct(){playSound("eat");var n=st.tn,p=st.people[n];if(!p||p.points<5){return}p.points-=5;p.hunger=Math.min(100,p.hunger+15);p.happiness=Math.min(100,p.happiness+5);p.lastTimestamp=Date.now();sv();cL(n);window._pf="idle_eat";rHome();setTimeout(function(){window._pf="walk";rHome();resetWalk()},1500)}
function trAct(){var n=st.tn,p=st.people[n];if(!p)return;var idx=p.currentPetIdx;if(p.petLevels[idx]>=100){return}if(p.points<5){return}p.points-=5;p.petXP[idx]+=10;p.happiness=Math.min(100,p.happiness+2);p.lastTimestamp=Date.now();if(!p.totalTrainings)p.totalTrainings=0;p.totalTrainings++;if(!p.statBonus)p.statBonus=[];while(p.statBonus.length<=idx)p.statBonus.push({hp:0,atk:0,def:0,spd:0,int:0,luk:0});var sb=p.statBonus[idx];if(!sb)sb={hp:0,atk:0,def:0,spd:0,int:0,luk:0};var sts=["hp","atk","def","spd","int","luk"];var rs=sts[Math.floor(Math.random()*6)];sb[rs]+=Math.floor(Math.random()*2)+1;cL(n);sv();checkAchievements(n);window._pf="happy";rHome();setTimeout(function(){window._pf="walk";rHome();resetWalk()},1500)}
function cL(n){var p=st.people[n],idx=p.currentPetIdx,nd=xfl(p.petLevels[idx]);while(p.petXP[idx]>=nd){p.petXP[idx]-=nd;p.petLevels[idx]++;playSound("levelup");p.happiness=Math.min(100,p.happiness+10);if(p.petLevels[idx]>=100){var ni=rb(n);if(ni!==null){p.pendingBoxes.push(ni)}}nd=xfl(p.petLevels[idx])}sv()}
function cU(n){var p=st.people[n],ex=exp(p.totalCheckins),u=false;while(p.petSlots.length+p.pendingBoxes.length<ex){var idx=rb(n);if(idx!==null){p.pendingBoxes.push(idx);u=true}else break}if(u)sv()}

function rPet(){var n=st.curPerson||st.tn,p=st.people[n];if(!p)return;var sl=typeof st.curSlot==="number"?st.curSlot:p.currentPetIdx;var pid=p.petSlots[sl],lv=p.petLevels[sl],xp=p.petXP[sl],nd=xfl(lv),pct=Math.min(100,xp/nd*100);var sk=cs(p),isCur=sl===p.currentPetIdx;var ss=gs(pid,lv);document.getElementById("petContent").innerHTML='<div class=pds><div class=pdh><img class=pet-gif-xl src="/images/pets/pet_'+String(pid+1).padStart(2,"0")+'_idle.gif" alt=""><div class=pdn>精灵 #'+(pid+1)+'</div><div class=pdtg>'+(isCur?"👑 当前精灵":"")+'</div></div>'+
'<div class=pdl><div class="exp-header"><span>Lv.'+lv+'</span><span style=color:#999>'+(lv>=100?"🏆 满级":"下一级 "+(nd-xp)+" EXP")+'</span></div>'+
'<div class=eb style=max-width:100%><div class=pt><div class=pf style="width:'+pct+'%"></div></div><div class=et>'+(lv>=100?"":"EXP "+xp+"/"+nd)+'</div></div></div>'+
'<div class=bg><div class=bi><div class=lb>🍖 饱食度</div><div class=bpt><div class=bpf style="width:'+sk.hunger+'%;background:'+(sk.hunger>60?"#32CD32":sk.hunger>30?"#FFA500":"#FF4500")+'"></div></div><div class=bv>'+(sk.hunger)+'%</div></div><div class=bi><div class=lb>😊 心情</div><div class=bpt><div class=bpf style="width:'+sk.happiness+'%;background:'+(sk.happiness>60?"#32CD32":sk.happiness>30?"#FFA500":"#FF4500")+'"></div></div><div class=bv>'+(sk.happiness)+'%</div></div></div>'+
'<div class=sg2>'+[{k:"hp",l:"HP",i:"❤️",c:"schp",f:"sfhp"},{k:"atk",l:"攻击",i:"⚔️",c:"scatk",f:"sfatk"},{k:"def",l:"防御",i:"🛡️",c:"scdef",f:"sfdef"},{k:"spd",l:"速度",i:"💨",c:"scspd",f:"sfspd"},{k:"int",l:"智力",i:"🧠",c:"scint",f:"sfint"},{k:"luk",l:"运气",i:"🍀",c:"scluk",f:"sfluk"}].map(function(s){var v=ss[s.k];return '<div class=sc2><div class=si2>'+s.i+'</div><div class="sl '+s.c+'">'+s.l+'</div><div class=sb><div class="sf '+s.f+'" style="width:'+Math.round((v/Math.max(ss.hp,ss.atk,ss.def,ss.spd,ss.int,ss.luk))*100)+'%"></div></div><div class="sv '+s.c+'">'+v+'</div></div>';}).join("")+'</div></div>';}

function ob(n,i){playSound("box");var p=st.people[n];if(!p||!p.pendingBoxes||!p.pendingBoxes.length)return;if(i===undefined)i=0;var pet=p.pendingBoxes[i];var modal=document.getElementById("modalBox"),cont=document.getElementById("boxContent");cont.innerHTML='<div class="br" style="padding:24px"><div class="box-icon" id=boxI>🎁</div><div class="box-hint">点击打开盲盒</div></div>';modal.classList.add("show");setTimeout(function(){var ic=document.getElementById("boxI");if(ic)ic.onclick=function(){ic.style.animation="none";ic.style.transform="scale(1.5)";ic.style.opacity="0";ic.style.transition="all .3s";setTimeout(function(){var nid=String(pet+1).padStart(2,"0");cont.innerHTML='<div class="br" style="padding:24px"><img src="/images/pets/pet_'+nid+'_happy.gif" class="pet-gif-lg"><div class="box-result-title">精灵 #'+(pet+1)+'</div><div class="box-result-desc">🎉 加入了你的精灵列表！</div></div>';p.pendingBoxes.splice(i,1);p.petSlots.push(pet);p.petLevels.push(1);p.petXP.push(0);sv();rfsh()},350)}},50)}

function showPetDetail(pid){var n=st.tn,p=st.people[n];if(!p)return;var idx=p.petSlots.indexOf(pid);if(idx<0)return;st.curPerson=n;st.curSlot=idx;st.people[n].currentPetIdx=idx;rPet();showPg("pagePet","精灵详情")}

var PZ=["pageHome"];
function showPg(id,ti){document.querySelectorAll(".page").forEach(function(p){p.classList.remove("active")});var el=document.getElementById(id);if(el)el.classList.add("active");var tb=document.getElementById("topBar"),nv=document.getElementById("nav");if(id==="pageLogin"||!st.tn){tb.classList.remove("show");nv.classList.remove("show")}else if(["pageHome","pageBattle","pageShop","pageColl","pageRank"].indexOf(id)>=0){tb.classList.remove("show");nv.classList.add("show")}else{tb.classList.add("show");nv.classList.remove("show");document.getElementById("topTitle").textContent={pagePet:"精灵详情"}[id]||"返回"}document.querySelectorAll(".nav-item").forEach(function(n){n.classList.toggle("active",n.getAttribute("data-pg")===id)});if(PZ[PZ.length-1]!==id)PZ.push(id)}
function gB(){if(PZ.length>1){PZ.pop();var p=PZ[PZ.length-1];if(p==="pagePet")rPet();else if(p==="pageHome")rHome();else if(p==="pageBattle")rBatUI();else if(p==="pageShop")rShop();else if(p==="pageColl")rColl();showPg(p)}}

function rColl(){var n=st.tn,p=st.people[n],un=new Set(),cur=-1;if(p){p.petSlots.forEach(function(s){un.add(s)});if(p.petSlots[p.currentPetIdx]!==undefined)cur=p.petSlots[p.currentPetIdx]}document.getElementById("collC").textContent=un.size+"/"+TP;document.getElementById("collGrid").innerHTML=Array.from({length:TP},function(_,i){var u=un.has(i),c=i===cur;return '<div class="ccell '+(c?"cur":u?"unlocked":"lock")+'"'+(u?' onclick="showPetDetail('+i+')"':'')+'><span class=ce>'+(u?pi(i):"❓")+'</span><span class=cn>#'+(i+1)+'</span></div>'}).join("")}

function rShop(){var n=st.tn,p=st.people[n];document.getElementById("shopPts").textContent="💰 "+p.points+" 金币";document.getElementById("shopGrid").innerHTML=SI.map(function(s){return '<div class=sc onclick="buy('+"'"+s.id+"'"+')"><div class=sc-top><span class=si>'+s.i+'</span></div><span class=sn>'+s.n+'</span><span class=sd>'+s.d+'</span><div class=sc-bot><span class=sc-price>💰 '+s.c+'</span><span class=sc-btn>兑换</span></div></div>'}).join("")}
function buy(id){var n=st.tn,p=st.people[n];if(!p)return;var item=SI.find(function(s){return s.id===id});if(!item)return;if(p.points<item.c){toast("积分不足，加油训练打卡！");return}p.points-=item.c;if(item.e.h){p.hunger=Math.min(100,p.hunger+item.e.h);p.happiness=Math.min(100,p.happiness+3);p.lastTimestamp=Date.now();cL(n)}if(item.e.x){var idx=p.currentPetIdx;p.petXP[idx]+=item.e.x;cL(n)}if(item.e.r){var sb=p.statBonus[p.currentPetIdx];if(!sb)sb={hp:0,atk:0,def:0,spd:0,int:0,luk:0};var sts=["hp","atk","def","spd","int","luk"];sb[sts[Math.floor(Math.random()*6)]]+=2}if(item.e.u){var ri=rb(n);if(ri!==null){p.pendingBoxes.push(ri)}}sv();rShop();rHome()}

var br=false;
function gBD(pn,si){var p=st.people[pn];if(!p)return null;var sl=typeof si==="number"?si:p.currentPetIdx,pid=p.petSlots[sl],lv=p.petLevels[sl];var ss=gs(pid,lv),sk=cs(p),hp2=1-(100-sk.hunger)*0.002;return{personName:pn,petSlot:sl,petId:pid,level:lv,stats:ss,hunger:sk.hunger,hungerPenalty:hp2,emoji:PE[pid]||"🐣",iconHtml:pi(pid)}}
function gifUrl(pid,anim){return '/images/pets/pet_'+String(pid+1).padStart(2,'0')+'_'+anim+'.gif'}
function gTD(pn,md){var p=st.people[pn];if(!p)return[];var picks=window._battlePicks||[];if(md==="1v1"){var bi=picks.length?picks[0]:p.currentPetIdx;var d=gBD(pn,bi);return d?[d]:[]}return picks.slice(0,3).map(function(i){return gBD(pn,i)}).filter(function(d){return d!==null})}
function cBW(ta,tb){var pa=ta.reduce(function(s,pet){return s+(pet.stats?pwr(pet.stats,pet.level):0)*pet.hungerPenalty},0);var pb=tb.reduce(function(s,pet){return s+(pet.stats?pwr(pet.stats,pet.level):0)*pet.hungerPenalty},0);var wk=Math.min(pa,pb),st2=Math.max(pa,pb),ra=wk/st2,up=0.35*(0.3+0.7*ra),ro=Math.random();var iu=(pa>pb&&ro<up)||(pb>pa&&ro>=up);return{winnerIsA:iu?pa<pb:pa>=pb,isUpset:iu,powerA:Math.round(pa),powerB:Math.round(pb)}}
function gBS(ta,tb){var rd=ta.length,steps=[];for(var r=0;r<rd;r++){var a=ta[r],b=tb[r];if(!a||!b)break;var pa=(a.stats?pwr(a.stats,a.level):0)*a.hungerPenalty,pb=(b.stats?pwr(b.stats,b.level):0)*b.hungerPenalty;var wk=Math.min(pa,pb),st2=Math.max(pa,pb),rU=0.35*(0.3+0.7*(wk/st2)),rR=Math.random();var aW=(pa>pb&&rR>=rU)||(pb>pa&&rR<rU);var mHA=a.stats.hp*5,mHB=b.stats.hp*5,hpA=mHA,hpB=mHB;var att=aW?a:b,def2=aW?b:a,rs=[],tl=0;while(hpA>0&&hpB>0&&tl<12){tl++;var atkP=att.stats.atk*1.5+att.stats.int*0.5+att.level;var defP=def2.stats.def*0.6+def2.stats.spd*0.1;var base=Math.max(2,Math.round((atkP-defP)*(0.8+Math.random()*0.4)));var cR=Math.random()<def2.stats.luk/100,dR=Math.random()<def2.stats.spd/150;var dmg=base,sp="";if(dR){dmg=0;sp="dodge"}else if(cR){dmg=Math.round(dmg*1.8);sp="critical"}if(def2===a)hpA=Math.max(0,hpA-dmg);else hpB=Math.max(0,hpB-dmg);rs.push({attackerName:att.personName,defenderName:def2.personName,attackerEmoji:att.emoji,defenderEmoji:def2.emoji,dmg,special:sp,hpA:Math.max(0,hpA),hpB:Math.max(0,hpB),maxHPA:mHA,maxHPB:mHB,ko:(hpA<=0||hpB<=0)});if(hpA<=0||hpB<=0)break;var tmp=att;att=def2;def2=tmp}steps.push({round:r+1,steps:rs,aWins:aW})}return steps}
function sl(ms){return new Promise(function(r){setTimeout(r,ms)})}

function uH(r,hpA,hpB,mA,mB,ta,tb){var ap=ta[Math.min(r-1,ta.length-1)],bp=tb[Math.min(r-1,tb.length-1)];if(!ap||!bp)return;document.getElementById("bhN1").textContent=ap.personName;document.getElementById("bhN2").textContent=bp.personName;document.getElementById("bhP1").innerHTML='<img src="'+gifUrl(ap.petId,"idle")+'" class="pet-icon-sm" onerror="this.style.display=\'none\'"> #'+(ap.petId+1)+' Lv.'+ap.level;document.getElementById("bhP2").innerHTML='<img src="'+gifUrl(bp.petId,"idle")+'" class="pet-icon-sm" onerror="this.style.display=\'none\'"> #'+(bp.petId+1)+' Lv.'+bp.level;var e1=document.getElementById("bfE1"),e2=document.getElementById("bfE2");e1.src=gifUrl(ap.petId,"idle");e2.src=gifUrl(bp.petId,"idle");document.getElementById("bhH1").style.width=Math.round((hpA/mA)*100)+"%";document.getElementById("bhH2").style.width=Math.round((hpB/mB)*100)+"%";document.getElementById("bhT1").textContent="HP "+Math.round((hpA/mA)*100)+"%";document.getElementById("bhT2").textContent="HP "+Math.round((hpB/mB)*100)+"%"}

function rBat(){if(br)return;if(!st.tn)return;var p1=st.tn,pool=st.personOrder.filter(function(n){return n!==p1});if(!pool.length)return;var p2=pool[Math.floor(Math.random()*pool.length)],md=document.querySelector(".bmb.active")?.getAttribute("data-md")||"1v1";var ta=gTD(p1,md),tb=gTD(p2,md);if(!ta.length||!tb.length)return;if(md==="3v3"&&(ta.length<3||tb.length<3))return;var sp=st.people[p1],td=fd();if(sp.battleDate!==td){sp.battlesToday=0;sp.battleDate=td}if(sp.battlesToday>=MB)return;br=true;var btn=document.getElementById("battleStart");if(btn)btn.disabled=true;document.getElementById("battleResult").classList.remove("show");document.getElementById("battleLog").innerHTML='<div class="bli info">⚔️ 战斗开始！</div>';var oc=cBW(ta,tb),steps=gBS(ta,tb);uH(1,ta[0].stats.hp*5,tb[0].stats.hp*5,ta[0].stats.hp*5,tb[0].stats.hp*5,ta,tb);rBattleLoop(ta,tb,oc,steps,p1,p2)}


// ==== 伤害数字浮动 ====
function showDmg(el,dmg,type){
  if(!el)return;
  var rect=el.getBoundingClientRect();
  var txt=document.createElement('div');
  txt.className='dmg-num dmg-'+type;
  txt.textContent=type==='dodge'?'🛡️ 闪避！':'💥 '+dmg;
  txt.style.left=(rect.left+rect.width/2-30)+'px';
  txt.style.top=(rect.top+rect.height/2-20)+'px';
  document.body.appendChild(txt);
  setTimeout(function(){txt.remove()},1000);
}
async function rBattleLoop(ta,tb,oc,steps,p1,p2){var cA=ta[0].stats.hp*5,cB=tb[0].stats.hp*5,mA=cA,mB=cB;for(var r=0;r<steps.length;r++){var round=steps[r];if(round.round>1){var ap=ta[round.round-1],bp=tb[round.round-1];if(ap&&bp){cA=ap.stats.hp*5;cB=bp.stats.hp*5;uH(round.round,cA,cB,cA,cB,ta,tb);await sl(1000)}}for(var i=0;i<round.steps.length;i++){var s=round.steps[i];var rv=await rBattleStep(r,round,s,cA,cB,mA,mB,ta,tb);cA=rv.cA;cB=rv.cB;if(rv.ko)break}}var wn=oc.winnerIsA?p1:p2;showBattleResult(wn,oc,p1,p2,st.people[p1])}

async function rBattleStep(r,round,s,cA,cB,mA,mB,ta,tb){var e1=document.getElementById("bfE1"),e2=document.getElementById("bfE2"),isA1=s.attackerName===ta[round.round-1]?.personName;var dodgeEl=isA1?e2:e1;showDmg(dodgeEl,0,"dodge");if(s.special==="dodge"){document.getElementById("bfE1").src=gifUrl(ta[Math.min(r,ta.length-1)]?.petId||0,"idle");document.getElementById("bfE2").src=gifUrl(tb[Math.min(r,tb.length-1)]?.petId||0,"idle");(isA1?e2:e1).className="be dodge"}else if(s.special==="critical"){var at=ta[Math.min(r,ta.length-1)];var df=tb[Math.min(r,tb.length-1)];if(at&&df){document.getElementById("bfE1").src=gifUrl((isA1?at:df).petId,"skill_attack");document.getElementById("bfE2").src=gifUrl((isA1?df:at).petId,"unhappy")}playSound("critical");var critEl=isA1?e1:e2;showDmg(critEl,s.dmg,"critical");(isA1?e1:e2).className="be flash"}else{playSound("attack");var at2=ta[Math.min(r,ta.length-1)];var df2=tb[Math.min(r,tb.length-1)];if(at2&&df2){document.getElementById("bfE1").src=gifUrl((isA1?at2:df2).petId,"skill_attack");document.getElementById("bfE2").src=gifUrl((isA1?df2:at2).petId,"unhappy")}var normEl=isA1?e1:e2;showDmg(normEl,s.dmg,"normal");(isA1?e1:e2).className="be shake"}cA=s.hpA;cB=s.hpB;uH(round.round,cA,cB,mA,mB,ta,tb);await sl(700);e1.className="be";e2.className="be";var at3=ta[Math.min(r,ta.length-1)];var df3=tb[Math.min(r,tb.length-1)];if(at3&&df3){document.getElementById("bfE1").src=gifUrl(at3.petId,"idle");document.getElementById("bfE2").src=gifUrl(df3.petId,"idle")}if(s.ko){document.getElementById("battleLog").innerHTML+="<div class='bli info'>💀 "+(s.hpA<=0?s.attackerName:s.defenderName)+" 倒下了！</div>";await sl(500);return{cA:cA,cB:cB,ko:true}}var lgEl=document.getElementById("battleLog");var lgTxt="";if(s.special==="dodge"){lgTxt="<div class='bli cr'>🛡️ "+s.defenderName+" 闪避了攻击！</div>"}else if(s.special==="critical"){lgTxt="<div class='bli cr'>💥 "+s.attackerName+" 暴击！对 "+s.defenderName+" 造成 "+s.dmg+" 点伤害！</div>"}else{lgTxt="<div class='bli'>⚔️ "+s.attackerName+" 对 "+s.defenderName+" 造成 "+s.dmg+" 点伤害</div>"}lgEl.innerHTML+=lgTxt;lgEl.scrollTop=lgEl.scrollHeight;await sl(300);return{cA:cA,cB:cB,ko:false}}

function showBattleResult(wn,oc,p1,p2,sp){if(wn===p1)playSound("win");else playSound("lose");document.getElementById("brT").textContent=oc.isUpset?"🎉":"🏆";document.getElementById("brTx").textContent="🥇 "+wn+" 获胜！";document.getElementById("brD").textContent="战力 "+oc.powerA+" VS "+oc.powerB;document.getElementById("brReward").textContent=wn===p1?"🏅 +1 金币 +1 随机属性！":wn===p2?"😢 下次加油！":"";document.getElementById("battleAgain").classList.add("show");document.getElementById("battleResult").classList.add("show");var wp=st.people[wn];if(wp){sp.battlesToday=(sp.battlesToday||0)+1;sp.battleDate=fd();if(wn===p1||wn===p2){wp.points+=BP;var lgEl2=document.getElementById("battleLog");lgEl2.innerHTML+="<div class='bli info'>🏅 "+wn+" 获得胜利！+1 金币 +1 随机属性！</div>";lgEl2.scrollTop=lgEl2.scrollHeight;var bpIdx=window._battlePetIdx||wp.currentPetIdx;if(!wp.statBonus)wp.statBonus=[];while(wp.statBonus.length<=bpIdx)wp.statBonus.push({hp:0,atk:0,def:0,spd:0,int:0,luk:0});var sb=wp.statBonus[bpIdx];if(!sb)sb={hp:0,atk:0,def:0,spd:0,int:0,luk:0};var sts=["hp","atk","def","spd","int","luk"];var rs=sts[Math.floor(Math.random()*6)];sb[rs]+=1}var he={result:(wn===p1?"win":"lose"),opponent:(wn===p1?p2:p1),myPower:oc.powerA,date:fd()};sp.battleHistory.push(he);sv();checkAchievements(wn);rBatUI()}br=false;var btn2=document.getElementById("battleStart");if(btn2)btn2.disabled=false}

function rBatUI(){document.getElementById("bfE1").src="";document.getElementById("bfE2").src="";document.getElementById("bhP1").textContent="—";document.getElementById("bhP2").textContent="—";document.getElementById("bhN1").textContent="—";document.getElementById("bhN2").textContent="—";document.getElementById("bhH1").style.width="0%";document.getElementById("bhH2").style.width="0%";document.getElementById("bhT1").textContent="HP";document.getElementById("bhT2").textContent="HP";document.getElementById("battleResult").classList.remove("show");if(!st.tn||!st.people[st.tn]){document.getElementById("battleSetup").innerHTML='<div style=text-align:center><div style=font-size:36px>🎮</div><div style=font-size:14px;font-weight:700>请先登录</div></div>';document.getElementById("battleStart").disabled=true;return}var p=st.people[st.tn],td2=fd();if(p.battleDate!==td2){p.battlesToday=0;p.battleDate=td2}var rm=MB-(p.battlesToday||0),md=document.querySelector(".bmb.active")?.getAttribute("data-md")||"1v1",sel=st.people[st.tn];window._battlePicks=window._battlePicks||[];if(!window._battlePicks.length){window._battlePicks=[sel?sel.currentPetIdx:0]}var need=md==="3v3"?3:1;buildBpk();document.getElementById("battleCount").innerHTML='<span>🎮 '+st.tn+'</span><span>⚔️ 今日 '+Math.max(0,rm)+'/'+MB+' 场</span>';document.getElementById("battleStart").textContent=rm>0?"🎲 随机匹配战斗":"⏰ 今日已打满";document.getElementById("battleStart").disabled=rm<=0||window._battlePicks.length<need}

function buildBpk(){var sel=st.people[st.tn],md=document.querySelector(".bmb.active")?.getAttribute("data-md")||"1v1",need=md==="3v3"?3:1;var c=document.getElementById("battleSetup");var h=['<div style=text-align:center><div style=font-size:36px>🎲</div><div style=font-size:14px;font-weight:700>随机匹配对手</div><div style=font-size:11px;color:#999;margin-bottom:6px>'+(need>1?"选择"+need+"只":"选择出战")+'</div><div class="bpk-row">'];if(sel&&sel.petSlots){sel.petSlots.forEach(function(sl,i){var e=PE[sl]||"🐣",lv2=sel.petLevels[i],pi=window._battlePicks.indexOf(i),pk=pi>=0;h.push('<div class="bpk'+(pk?' bpk-cur':'')+'" data-bpk="'+i+'">');if(pk)h.push('<span class="bpk-badge">'+(pi+1)+'</span>');h.push('<img src="/images/pets/pet_'+String(sl+1).padStart(2,"0")+'_idle.gif" onerror="this.style.display=\'none\'" class="bpk-icon"><div class="bpk-level">Lv.'+lv2+'</div></div>')})}h.push('</div><div class="bpk-hint">'+(need>1?"已选 "+window._battlePicks.length+"/"+need:"")+'</div></div>');c.innerHTML=h.join("");document.querySelectorAll("[data-bpk]").forEach(function(el){function pkFn(){var si=parseInt(this.getAttribute("data-bpk")),md2=document.querySelector(".bmb.active")?.getAttribute("data-md")||"1v1",need2=md2==="3v3"?3:1,idx=window._battlePicks.indexOf(si);if(idx>=0){window._battlePicks.splice(idx,1)}else{if(window._battlePicks.length<need2){window._battlePicks.push(si)}}buildBpk()}el.addEventListener("click",pkFn);el.addEventListener("touchend",function(e){e.preventDefault();pkFn.call(this)})})}

function logout(){if(confirm("确认退出？")){st.tn=null;br=false;window._battlePicks=[];document.getElementById("battleResult").classList.remove("show");document.getElementById("battleLog").innerHTML="";document.getElementById("battleStart").disabled=false;sv();document.getElementById("nav").classList.remove("show");showPg("pageLogin");setTimeout(function(){document.getElementById("loginName").focus()},300)}}
function rLoginPets(){document.getElementById("loginPets").innerHTML=[0,1,2,3,4,5,6,7].map(function(i){return pg(i,"happy","")}).join("")}
function rfsh(){var a=document.querySelector(".page.active");if(!a)return;var id=a.id;if(id==="pageHome")rHome();else if(id==="pagePet")rPet();else if(id==="pageBattle")rBatUI();else if(id==="pageShop")rShop();else if(id==="pageColl")rColl();else if(id==="pageRank")rRank()}


// Drag-to-scroll for pet list
function setupDragScroll() {
  document.querySelectorAll(".scroll-x").forEach(function(el) {
    var isDown = false, startX, startY, scrollLeft, moved = false;
    el.addEventListener("mousedown", function(e) {
      if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")return;
      isDown = true; moved = false;
      startX = e.pageX - el.offsetLeft; startY = e.pageY;
      scrollLeft = el.scrollLeft;
      el.style.cursor = "grabbing";
    });
    el.addEventListener("mouseleave", function() { isDown = false; el.style.cursor = ""; });
    document.addEventListener("mouseup", function() { isDown = false; el.style.cursor = ""; });
    el.addEventListener("mousemove", function(e) {
      if(!isDown) return;
      var x = e.pageX - el.offsetLeft, dx = x - startX;
      if(Math.abs(dx) > 5 || Math.abs(e.pageY - startY) > 5) moved = true;
      if(moved) { e.preventDefault(); el.scrollLeft = scrollLeft - dx; }
    });
    // Prevent click after drag
    el.addEventListener("click", function(e) { if(moved) { e.stopPropagation(); } }, true);
  });
}

function rRank(){
  var rt=document.querySelector(".rk-tab.active")?.getAttribute("data-rt")||"pts";
  var list=document.getElementById("rankList");
  var people=st.people||{};
  var order=st.personOrder||[];
  var items=order.map(function(n){return {name:n,data:people[n]}}).filter(function(i){return i.data});
  if(rt==="pts"){
    items.sort(function(a,b){return(b.data.points||0)-(a.data.points||0)})
  }else if(rt==="pets"){
    items.sort(function(a,b){return(b.data.petSlots?.length||0)-(a.data.petSlots?.length||0)})
  }else if(rt==="battle"){
    items.sort(function(a,b){
      var aw=(a.data.battleHistory||[]).filter(function(h){return h.result==="win"}).length;
      var bw=(b.data.battleHistory||[]).filter(function(h){return h.result==="win"}).length;
      return bw-aw
    })
  }
  var medals=["🥇","🥈","🥉"];
  list.innerHTML='<div class="rk-list">'+items.map(function(item,i){
    var m=i<3?medals[i]:"#"+(i+1);
    var rankCls=i<3?"rk-medal":"rk-num";
    var p=item.data;
    var pts=p.points||0;
    var pets=p.petSlots?.length||0;
    var wins=(p.battleHistory||[]).filter(function(h){return h.result==="win"}).length;
    var total=(p.battleHistory||[]).length;
    var val=rt==="pts"?pts+" 金币":rt==="pets"?pets+"/30 精灵":(total>0?wins+"/"+total:"0")+" 胜";
    return '<div class="rk-item"><span class="'+rankCls+'">'+m+'</span><span class="rk-name">'+item.name+'</span><span class="rk-val">'+val+'</span></div>'
  }).join("")+'</div>';
}

function init(){initSt();setupDragScroll();document.querySelectorAll("[data-pg]").forEach(function(el){el.addEventListener("click",function(){var id=this.getAttribute("data-pg");PZ.length=0;PZ.push(id);if(id==="pageHome")rHome();else if(id==="pageBattle"){window._battlePicks=[];rBatUI()}else if(id==="pageShop")rShop();else if(id==="pageColl")rColl();else if(id==="pageRank")rRank();showPg(id)})});document.getElementById("backBtn").addEventListener("click",gB);document.getElementById("loginBtn").addEventListener("click",login);document.getElementById("loginName").addEventListener("keydown",function(e){if(e.key==="Enter")document.getElementById("loginPwd").focus()});document.getElementById("loginPwd").addEventListener("keydown",function(e){if(e.key==="Enter")login()});document.querySelectorAll(".bmb").forEach(function(el){el.addEventListener("click",function(){document.querySelectorAll(".bmb").forEach(function(b){b.classList.remove("active")});this.classList.add("active");window._battlePicks=[];rBatUI()})});document.getElementById("battleStart").addEventListener("click",rBat);document.querySelectorAll(".mo").forEach(function(m){m.addEventListener("click",function(e){if(e.target===e.currentTarget)this.classList.remove("show")})});document.querySelectorAll(".rk-tab").forEach(function(el){el.addEventListener("click",function(){document.querySelectorAll(".rk-tab").forEach(function(b){b.classList.remove("active")});this.classList.add("active");rRank()})});if(st.tn){document.getElementById("nav").classList.add("show");showPg("pageHome");rHome()}else{showPg("pageLogin");rLoginPets()}}
init();

// 每15秒同步一次服务器数据
setInterval(syncAPI,15000);
setInterval(rfsh,30000);
// ==== 🎮 趣味效果 ====
function sparkle(el){for(var i=0;i<8;i++){var s=document.createElement('div');s.className='sparkle';s.textContent=['✨','⭐','🌟','💫'][i%4];s.style.cssText='position:fixed;pointer-events:none;z-index:9999;font-size:'+(12+Math.random()*16)+'px;left:'+(el.getBoundingClientRect().left+Math.random()*40-20)+'px;top:'+(el.getBoundingClientRect().top+Math.random()*40-20)+'px;transition:all .6s ease-out;opacity:1';document.body.appendChild(s);requestAnimationFrame(function(){s.style.transform='translateY('+(-40-Math.random()*60)+'px) translateX('+(Math.random()*40-20)+'px)';s.style.opacity='0'});setTimeout(function(){s.remove()},700)}}


document.getElementById("battleAgain")&&document.getElementById("battleAgain").addEventListener("click",function(){document.getElementById("battleResult").classList.remove("show");rBatUI()});

// ==== 🎵 音效系统 ====
var act=null,_lastSoundTime=0;
function initAudio(){
  try{
    act=new(window.AudioContext||window.webkitAudioContext)()
  }catch(e){}
}
function playSound(type){
  if(!act){
    initAudio();
    if(!act)return
  }
  _lastSoundTime=Date.now();
  var o=act.createOscillator(),g=act.createGain();
  o.connect(g);g.connect(act.destination);
  var t=act.currentTime;
  switch(type){
    case"click":
      o.frequency.setValueAtTime(800,t);
      g.gain.setValueAtTime(0.08,t);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.06);
      o.start(t);o.stop(t+0.06);
      break;
    case"login":
      o.type="sine";
      o.frequency.setValueAtTime(523,t);
      o.frequency.setValueAtTime(659,t+0.1);
      o.frequency.setValueAtTime(784,t+0.2);
      g.gain.setValueAtTime(0.12,t);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.35);
      o.start(t);o.stop(t+0.35);
      break;
    case"eat":
      o.type="sine";
      o.frequency.setValueAtTime(300,t);
      o.frequency.setValueAtTime(400,t+0.08);
      g.gain.setValueAtTime(0.08,t);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.2);
      o.start(t);o.stop(t+0.2);
      break;
    case"levelup":
      o.type="sine";
      o.frequency.setValueAtTime(400,t);
      o.frequency.linearRampToValueAtTime(800,t+0.3);
      g.gain.setValueAtTime(0.12,t);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.35);
      o.start(t);o.stop(t+0.35);
      break;
    case"attack":
      o.type="sawtooth";
      o.frequency.setValueAtTime(200,t);
      o.frequency.linearRampToValueAtTime(80,t+0.15);
      g.gain.setValueAtTime(0.1,t);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.2);
      o.start(t);o.stop(t+0.2);
      break;
    case"critical":
      o.type="square";
      o.frequency.setValueAtTime(150,t);
      o.frequency.linearRampToValueAtTime(400,t+0.1);
      o.frequency.linearRampToValueAtTime(100,t+0.2);
      g.gain.setValueAtTime(0.12,t);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.3);
      o.start(t);o.stop(t+0.3);
      break;
    case"win":
      o.type="sine";
      [523,659,784,1047].forEach(function(f,i){
        o.frequency.setValueAtTime(f,t+i*0.12)
      });
      g.gain.setValueAtTime(0.13,t);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.5);
      o.start(t);o.stop(t+0.5);
      break;
    case"lose":
      o.type="sine";
      o.frequency.setValueAtTime(400,t);
      o.frequency.linearRampToValueAtTime(200,t+0.3);
      g.gain.setValueAtTime(0.1,t);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.4);
      o.start(t);o.stop(t+0.4);
      break;
    case"box":
      o.type="sine";
      o.frequency.setValueAtTime(400,t);
      o.frequency.setValueAtTime(600,t+0.08);
      o.frequency.setValueAtTime(800,t+0.16);
      g.gain.setValueAtTime(0.1,t);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.3);
      o.start(t);o.stop(t+0.3);
      break;
    case"achievement":
      o.type="sine";
      [523,659,784,1047,1319].forEach(function(f,i){
        o.frequency.setValueAtTime(f,t+i*0.1)
      });
      g.gain.setValueAtTime(0.14,t);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.6);
      o.start(t);o.stop(t+0.6);
      break
  }
}

// 初始化音频（用户首次交互时）
document.addEventListener("click",function(){
  if(!act)initAudio()
},{once:true})

// 全局按钮点击音效
document.addEventListener("click",function(e){
  if(e.target.closest("button,.btn-gold,.gb,.nav-item,.bmb,.rk-tab,.mo,.pli"))playSound("click")
})
