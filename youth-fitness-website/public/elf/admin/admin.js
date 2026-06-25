var PE=['🐱','🐶','🐰','🐻','🦊','🐼','🐧','🦉','🐹','🐿','️','🐉','🦅','🦄','🦁','🧚','🧝','🧜','‍','♀','️','☃','️','🦊','🦌','🔥','💧','🪨','🌪','️','⚡','❄','️','👻','🌟','🌿','⭐'];

var TP=30,CP=10,UE=20;
var st={people:{},personOrder:[],curPerson:null,curSlot:null};
var DEF=["张三","李四","王五","赵六"];
var PZ=["pageHome"];
var _apiTimer=null;

function pg(id,an,cl){
  var p=String(id+1).padStart(2,"0"),c=cl||"pet-gif";
  return '<img class="'+c+'" src="/images/pets/pet_'+p+'_'+an+'.gif" alt="">';
}

function dedup(n){var p=st.people[n];if(!p||!p.petSlots)return;var seen={},news=[],newlv=[],newxp=[],newsb=[];p.petSlots.forEach(function(sl,i){if(!seen[sl]){seen[sl]=true;news.push(sl);newlv.push(p.petLevels[i]);newxp.push(p.petXP[i]);newsb.push(p.statBonus&&p.statBonus[i]?p.statBonus[i]:{hp:0,atk:0,def:0,spd:0,int:0,luk:0})}});if(news.length<p.petSlots.length){p.petSlots=news;p.petLevels=newlv;p.petXP=newxp;p.statBonus=newsb;sv()}}
function init(){
  var r=localStorage.getItem("checkin_pets");
  if(r){try{st=JSON.parse(r);st.personOrder.forEach(function(n){var p=st.people[n];if(!p)return;if(!p.petSlots)p.petSlots=[0];if(!p.petLevels)p.petLevels=[1];if(!p.petXP)p.petXP=[0];if(typeof p.currentPetIdx!="number")p.currentPetIdx=0;if(typeof p.hunger!="number")p.hunger=80;if(typeof p.happiness!="number")p.happiness=80;if(!p.lastTimestamp)p.lastTimestamp=Date.now();if(typeof p.totalCheckins!="number")p.totalCheckins=0;if(typeof p.password!="string"||!p.password)p.password="123456";if(!p.pendingBoxes)p.pendingBoxes=[];if(!p.battleHistory)p.battleHistory=[];var ex=Math.min(TP,1+Math.floor(p.totalCheckins/UE));while(p.petSlots.length<ex){var ri=rb(n);if(ri!==null)p.pendingBoxes.push(ri);else break}if(p.currentPetIdx>=p.petSlots.length)p.currentPetIdx=0});}catch(e){}}
  if(!st.personOrder.length)DEF.forEach(function(n){st.people[n]={points:0,totalCheckins:0,currentPetIdx:0,petSlots:[Math.floor(Math.random()*TP)],petLevels:[1],petXP:[0],hunger:80,happiness:80,lastTimestamp:Date.now(),password:"",pendingBoxes:[],battleHistory:[]};st.personOrder.push(n)});
  bind();grid();show("pageHome");syncAPI();
}

function rb(n){var p=st.people[n];if(!p)return null;var s=new Set(p.petSlots);(p.pendingBoxes||[]).forEach(function(i){s.add(i)});if(s.size>=TP)return null;var a=[];for(var i=0;i<TP;i++)if(!s.has(i))a.push(i);return a.length?a[Math.floor(Math.random()*a.length)]:null;}
function td(){var d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();}
function sv(){localStorage.setItem("checkin_pets",JSON.stringify(st));try{var x=new XMLHttpRequest();x.open("POST","/api/data",true);x.setRequestHeader("Content-Type","application/json");x.send(JSON.stringify(st))}catch(e){}}
function xfl(l){return 30+l*7;}
function sts(p){var hrs=(Date.now()-(p.lastTimestamp||Date.now()))/3600000,hu=Math.max(0,Math.min(100,Math.round(p.hunger-hrs*8))),ha=Math.max(0,Math.min(100,Math.round(p.happiness-(hu<40?hrs*6:hrs*2))));return{h:hu,ha:ha};}
function toast(m){var e=document.getElementById("toast");e.textContent=m;e.classList.add("show");clearTimeout(window.tm);window.tm=setTimeout(function(){e.classList.remove("show")},3000);}

function show(id){
  document.querySelectorAll(".page").forEach(function(p){p.classList.remove("active");});
  var el=document.getElementById(id);if(el)el.classList.add("active");
  var tb=document.getElementById("topBar"),nv=document.getElementById("nav");
  if(["pageHome","pageStats"].indexOf(id)>=0){tb.classList.remove("show");nv.classList.add("show");}else{tb.classList.add("show");nv.classList.remove("show");document.getElementById("topTitle").textContent="返回";}
  document.querySelectorAll(".nav-item").forEach(function(n){n.classList.toggle("active",n.getAttribute("data-pg")===id);});
  if(PZ[PZ.length-1]!==id)PZ.push(id);
}
function back(){if(PZ.length>1){PZ.pop();var p=PZ[PZ.length-1];if(p==="pagePerson")det();else if(p==="pageHome")grid();else if(p==="pageStats")stats();show(p);}}

function bind(){
  document.querySelectorAll(".nav-item").forEach(function(el){el.addEventListener("click",function(){var id=this.getAttribute("data-pg");PZ.length=0;PZ.push(id);if(id==="pageHome")grid();else if(id==="pageStats")stats();show(id);});});
  document.getElementById("backBtn").addEventListener("click",back);
  document.getElementById("addBtn").addEventListener("click",function(){document.getElementById("addName").value="";document.getElementById("addPwd").value="";document.getElementById("modalAdd").classList.add("show");});
  document.getElementById("addConfirm").addEventListener("click",function(){var n=document.getElementById("addName").value.trim();if(!n){toast("输入姓名");return}if(st.people[n]){toast("已存在");return}var pw=document.getElementById("addPwd").value.trim();st.people[n]={points:0,totalCheckins:0,currentPetIdx:0,petSlots:[Math.floor(Math.random()*TP)],petLevels:[1],petXP:[0],hunger:80,happiness:80,lastTimestamp:Date.now(),password:pw,pendingBoxes:[],battleHistory:[]};st.personOrder.push(n);sv();document.getElementById("modalAdd").classList.remove("show");rf();toast("添加成功");});
  document.getElementById("addCancel").addEventListener("click",function(){document.getElementById("modalAdd").classList.remove("show");});
  document.getElementById("pwdConfirm").addEventListener("click",function(){var n=document.getElementById("modalPwd").getAttribute("data-n");var pw=document.getElementById("pwdInput").value.trim();if(!pw){toast("输入密码");return}st.people[n].password=pw;sv();document.getElementById("modalPwd").classList.remove("show");rf();toast("已设置");});
  document.getElementById("pwdCancel").addEventListener("click",function(){document.getElementById("modalPwd").classList.remove("show");});
  document.querySelectorAll(".modal-overlay").forEach(function(m){m.addEventListener("click",function(e){if(e.target===e.currentTarget)this.classList.remove("show");});});
  // === 导出数据 ===
  document.getElementById("exportBtn").addEventListener("click",exportData);
  // === 批量管理 ===
  document.getElementById("selectAll").addEventListener("click",function(){
    var cbs=document.querySelectorAll(".batch-cb"),ch=this.checked;
    cbs.forEach(function(el){el.checked=ch;});
    updateBatchCount();
  });
  document.getElementById("batchPoints").addEventListener("click",function(){
    var sel=getSelected();
    if(!sel.length){toast("请先选择学生");return}
    sel.forEach(function(n){st.people[n].points=(st.people[n].points||0)+10;});
    sv();rf();toast("批量 +10 积分，共 "+sel.length+" 人");
  });
  document.getElementById("batchCheckin").addEventListener("click",function(){
    var sel=getSelected(),t=td();
    if(!sel.length){toast("请先选择学生");return}
    sel.forEach(function(n){
      var p=st.people[n];
      if(!p||p.lastCheckinDate===t)return;
      p.points=(p.points||0)+CP;
      p.totalCheckins=(p.totalCheckins||0)+1;
      p.happiness=Math.min(100,(p.happiness||80)+3);
      p.lastTimestamp=Date.now();
      p.lastCheckinDate=t;
      var ex=Math.min(TP,1+Math.floor(p.totalCheckins/UE));
      while(p.petSlots.length+(p.pendingBoxes||[]).length<ex){
        var ri=rb(n);
        if(ri!==null){p.pendingBoxes=p.pendingBoxes||[];p.pendingBoxes.push(ri);}else break;
      }
    });
    sv();rf();toast("批量打卡 +"+CP+"，共 "+sel.length+" 人");
  });
}

function grid(){
  var g=document.getElementById("personGrid"),t=td();
  if(!st.personOrder.length){g.innerHTML="<div class=empty-state>还没有人员</div>";return;}
  g.innerHTML=st.personOrder.map(function(n){var p=st.people[n],sk=sts(p),idx=p.currentPetIdx,sid=p.petSlots[idx],e=PE[sid]||"🐣",lv=p.petLevels[idx],bx=p.pendingBoxes?.length||0,ck=p.lastCheckinDate===t;return '<div class=person-card data-n="'+n+'"><label class=cb-wrap><input type=checkbox class=batch-cb data-cbn="'+n+'"></label><div class=pc-status><span class="badge '+(sk.h<20||sk.ha<20?"bg-red":"bg-green")+'">'+(sk.h<20?"🤤":sk.ha<20?"😞":"😊")+'</span></div><div class=pc-name>'+n+(bx?' <span class="box-badge">🎁x'+bx+'</span>':'')+'</div><div class=pc-points>⭐ '+p.points+' 积分</div><div class=pc-pet>'+e+' #'+(sid+1)+' Lv.'+lv+(p.password?" 🔑":" 🔓")+'</div><div class=pc-actions><button class="btn-checkin'+(ck?" done":"")+'" data-ci="'+n+'">'+(ck?"✅":"📅")+'</button><button class=btn-pwd data-pw="'+n+'">🔑</button><button class=btn-icon data-chg="'+n+'" title="分配金币">💰</button><button class=btn-icon data-award="'+n+'" title="直接加积分">➕</button></div></div>';}).join('');
  g.querySelectorAll("[data-ci]").forEach(function(el){el.addEventListener("click",function(e){e.stopPropagation();var nm=this.getAttribute("data-ci"),p2=st.people[nm],t2=td();if(p2.lastCheckinDate===t2){toast("已打卡");return}p2.points+=CP;p2.totalCheckins++;p2.happiness=Math.min(100,p2.happiness+3);p2.lastTimestamp=Date.now();p2.lastCheckinDate=t2;var ex=Math.min(TP,1+Math.floor(p2.totalCheckins/UE));while(p2.petSlots.length+p2.pendingBoxes.length<ex){var ri=rb(nm);if(ri!==null)p2.pendingBoxes.push(ri);else break}sv();rf();toast("打卡 +"+CP);});});
  g.querySelectorAll("[data-chg]").forEach(function(el){el.addEventListener("click",function(e){e.stopPropagation();var nm=this.getAttribute("data-chg"),p3=st.people[nm];if(!p3)return;var v=prompt("修改 "+nm+" 金币：",p3.points);if(v!==null){var nv=parseInt(v);if(isNaN(nv)||nv<0){toast("❌ 无效");return}p3.points=nv;sv();grid()}})});
  g.querySelectorAll("[data-award]").forEach(function(el){el.addEventListener("click",function(e){e.stopPropagation();var nm=this.getAttribute("data-award"),p3=st.people[nm];if(!p3)return;var v=prompt("给 "+nm+" 加多少积分？","");if(v!==null){var nv=parseInt(v);if(isNaN(nv)||nv<=0){toast("无效");return}p3.points+=nv;sv();grid();toast("+ "+nv+" 积分")}})});
  g.querySelectorAll("[data-pw]").forEach(function(el){el.addEventListener("click",function(e){e.stopPropagation();var nm=this.getAttribute("data-pw");document.getElementById("modalPwdName").textContent="为 "+nm+" 设置密码";document.getElementById("pwdInput").value="";document.getElementById("modalPwd").setAttribute("data-n",nm);document.getElementById("modalPwd").classList.add("show");});});
  g.querySelectorAll(".person-card").forEach(function(el){el.addEventListener("click",function(){st.curPerson=this.getAttribute("data-n");st.curSlot=st.people[st.curPerson].currentPetIdx;det();show("pagePerson");});});
  // 重置批量工具栏
  document.getElementById("selectAll").checked=false;
  document.getElementById("batchCount").textContent="";
  // 卡片内复选框点击不触发卡片导航
  g.querySelectorAll(".cb-wrap").forEach(function(el){el.addEventListener("click",function(e){e.stopPropagation();});});
  // 单个复选框变化时更新计数
  g.querySelectorAll(".batch-cb").forEach(function(el){el.addEventListener("change",function(e){e.stopPropagation();updateBatchCount();});});
}

function det(){
  var n=st.curPerson,p=st.people[n];if(!p){toast("no person");return;}
  var idx=p.currentPetIdx,sid=p.petSlots[idx],lv=p.petLevels[idx],xp=p.petXP[idx],nd=xfl(lv),pct=Math.min(100,xp/nd*100),mx=lv>=100;
  var sk=sts(p),bx=p.pendingBoxes?.length||0;
  var pwDisplay = p.password ? "🔑 "+p.password : "🔓 未设置";
  var h = [];
  h.push('<div class=detail-hero><div class=detail-name>🎮 '+n+(bx?' <span class="box-badge" id=boxLink>🎁x'+bx+'</span>':'')+'</div><div class=detail-points>⭐ '+p.points+'</div></div>');
  h.push('<div class=active-pet-area>'+pg(sid,"happy","pet-gif-lg")+'<div class=active-pet-info>#'+(sid+1)+'</div><div class=active-pet-level>Lv.'+lv+(mx?' 🏆':'')+'</div></div>');
  h.push('<div class=bar-pair><div class=bar-item>🍖 '+sk.h+'%</div><div class=bar-item>😊 '+sk.ha+'%</div></div>');
  h.push('<div class=pwd-section>🔐 '+pwDisplay+'<div style=margin-top:6px><button class="btn-gold btn-sm" id=pwdSet>设置</button>'+(p.password?' <button class=btn-danger id=pwdClear class="btn-sm">清除</button>':'')+'</div></div>');
  h.push('<div class=pet-list-title><span>🐾 精灵列表</span></div><div class=scroll-list>'+p.petSlots.map(function(sl,i){var e2=PE[sl]||"🐣",lv2=p.petLevels[i],act=i===p.currentPetIdx;return '<div class="pet-list-item'+(act?" current":"")+'" data-sl="'+i+'">'+(act?'<span class=pl-badge>✔</span>':'')+'<img class=pet-icon src="/images/pets/pet_'+String(sl+1).padStart(2,"0")+'_icon.png" ><div>Lv.'+lv2+'</div></div>';}).join('')+'</div>');
  if(bx>0)h.push('<button class=btn-gold id=boxBtn style=margin-top:10px>🎁 打开盲盒</button>');
  document.getElementById("personContent").innerHTML=h.join('');
  var bl=document.getElementById("boxLink");if(bl)bl.onclick=openBox;
  var bb=document.getElementById("boxBtn");if(bb)bb.onclick=openBox;
  var ps=document.getElementById("pwdSet");if(ps)ps.onclick=function(){document.getElementById("modalPwdName").textContent="为 "+n+" 设置密码";document.getElementById("pwdInput").value="";document.getElementById("modalPwd").setAttribute("data-n",n);document.getElementById("modalPwd").classList.add("show");};
  var pc=document.getElementById("pwdClear");if(pc)pc.onclick=function(){st.people[n].password="";sv();rf();toast("✅ 已清除");};
  document.querySelectorAll(".pet-list-item").forEach(function(el){el.addEventListener("click",function(){var si=parseInt(this.getAttribute("data-sl"));st.curSlot=si;p.currentPetIdx=si;sv();det();});});
}

function openBox(){
  var n=st.curPerson,p=st.people[n];if(!p||!p.pendingBoxes||!p.pendingBoxes.length)return;
  var pet=p.pendingBoxes[0],mc=document.getElementById("modalBox");
  mc.innerHTML='<div style=text-align:center;padding:10px><div class="box-open-icon" id=boxIcon>🎁</div><div style=color:#EE1515>点击打开</div></div>';
  mc.parentNode.classList.add("show");
  document.getElementById("boxIcon").onclick=function(){this.textContent="✨";setTimeout(function(){mc.innerHTML=pg(pet,'happy','pet-gif-lg')+'<div style=font-size:20px;color:#EE1515;font-weight:700>#'+(pet+1)+'</div></div>';p.pendingBoxes.splice(0,1);p.petSlots.push(pet);p.petLevels.push(1);p.petXP.push(0);sv();rf();},500);};
}

function stats(){
  var t=td(),total=st.personOrder.length,ck=st.personOrder.filter(function(n){return st.people[n]?.lastCheckinDate===t;}).length;
  var top=st.personOrder.map(function(n){return{name:n,pts:st.people[n]?.points||0,pid:st.people[n]?.petSlots[st.people[n]?.currentPetIdx||0]||0,lv:st.people[n]?.petLevels[st.people[n]?.currentPetIdx||0]||1};}).sort(function(a,b){return b.pts-a.pts;});
  document.getElementById("statsContent").innerHTML='<div class=page-header><span class=page-title>📊 统计</span></div><div class=stat-cards><div class=stat-card><div class=sc-num>'+total+'</div><div class=sc-label>👤 总人数</div></div><div class=stat-card><div class=sc-num>'+ck+'/'+total+'</div><div class=sc-label>📅 今日打卡</div></div><div class=stat-card><div class=sc-num>'+Math.round(total?ck/total*100:0)+'%</div><div class=sc-label>🔥 打卡率</div></div></div><div style=font-size:14px;font-weight:600;margin:10px 0>⭐ 积分排行榜</div><div class=rank-list>'+top.map(function(t,i){var rn="";if(i===0)rn="top1";else if(i===1)rn="top2";else if(i===2)rn="top3";return '<div class=rank-item><div class="rank-num '+rn+'">'+(i+1)+'</div><div class=rank-name>'+t.name+'</div><div class=rank-pet>'+PE[t.pid]+'</div><div class=rank-level>Lv.'+t.lv+'</div><div class=rank-points>⭐ '+t.pts+'</div></div>';}).join('')+'</div>';
}

function rf(){var a=document.querySelector(".page.active");if(!a)return;var id=a.id;if(id==="pageHome")grid();else if(id==="pagePerson")det();else if(id==="pageStats")stats();}
function syncAPI(){
  if(!navigator.onLine)return;
  var x=new XMLHttpRequest();
  x.open("GET","/api/data",true);
  x.onload=function(){
    if(x.status===200){
      try{
        var d=JSON.parse(x.responseText);
        if(d&&d.people&&Object.keys(d.people).length>0){
          mergeWithAPI(d);
        }else{
          apiSv();
        }
      }catch(e){apiSv()}
    }else{apiSv()}
  };
  x.onerror=function(){apiSv()};
  x.send();
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
        // 字段级智能合并：关键数值取最大值
        var local=st.people[n];
        var api=apiData.people[n];
        api.points=Math.max(api.points||0,local.points||0);
        api.totalCheckins=Math.max(api.totalCheckins||0,local.totalCheckins||0);
        api.battlesToday=Math.max(api.battlesToday||0,local.battlesToday||0);
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
function apiSv(){
  clearTimeout(_apiTimer);
  _apiTimer=setTimeout(function(){
    try{
      var d=JSON.stringify(st);
      localStorage.setItem("checkin_pets",d);
      var x=new XMLHttpRequest();
      x.open("POST","/api/data",true);
      x.setRequestHeader("Content-Type","application/json");
      x.send(d);
    }catch(e){}
  },200);
}
document.addEventListener("DOMContentLoaded",init);

// 每15秒同步一次服务器数据
setInterval(syncAPI,15000);

// === 数据导出 ===
function exportData(){
  var d=localStorage.getItem("checkin_pets");
  if(!d){toast("没有数据");return}
  var blob=new Blob([d],{type:"application/json"});
  var a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="checkin_pets_backup_"+new Date().toISOString().slice(0,10)+".json";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("✅ 数据已导出");
}

// === 批量管理辅助 ===
function getSelected(){
  var r=[];
  document.querySelectorAll(".batch-cb:checked").forEach(function(el){
    var n=el.getAttribute("data-cbn");
    if(n)r.push(n);
  });
  return r;
}
function updateBatchCount(){
  var sel=getSelected(),el=document.getElementById("batchCount");
  el.textContent=sel.length?"已选 "+sel.length+" 人":"";
}
