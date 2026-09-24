:root{
  --pink:#ffb6d9;
  --pink-dark:#ff8fc7;
  --blue:#a8d8ea;
  --lavender:#cdb4db;
  --mint:#b8f2e6;
  --yellow:#fff3b0;
  --cream:#fff8f0;
  --ink:#4a3f55;
}

*{box-sizing:border-box;}
html,body{height:100%;}

body{
  margin:0;
  min-height:100dvh;
  display:flex;
  align-items:center;
  justify-content:center;
  background:linear-gradient(135deg,var(--lavender),var(--blue));
  font-family:'Baloo 2',sans-serif;
  color:var(--ink);
  padding:16px;
  padding-top:max(16px, env(safe-area-inset-top, 0px));
  padding-bottom:max(16px, env(safe-area-inset-bottom, 0px));
  overflow-x:hidden;
}

.sparkles{
  position:fixed;
  inset:0;
  pointer-events:none;
  background-image:
    radial-gradient(circle,#fff 2px, transparent 2px),
    radial-gradient(circle,#fff 2px, transparent 2px),
    radial-gradient(circle,#fff 1.5px, transparent 1.5px);
  background-size:140px 140px, 200px 200px, 90px 90px;
  background-position:0 0, 60px 90px, 30px 40px;
  opacity:.5;
  animation:twinkle 3s ease-in-out infinite alternate;
}
@keyframes twinkle{from{opacity:.25;} to{opacity:.6;}}

/* ---------- WINDOW ---------- */
.app-window{
  width:100%;
  max-width:480px;
  height:min(90dvh, 760px);
  background:var(--cream);
  border:4px solid var(--ink);
  border-radius:18px;
  box-shadow:8px 8px 0 rgba(74,63,85,.35);
  overflow:hidden;
  display:flex;
  flex-direction:column;
}

.title-bar{
  background:var(--pink-dark);
  border-bottom:4px solid var(--ink);
  padding:10px 14px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  flex-shrink:0;
}
.title-text{
  font-family:'Press Start 2P',monospace;
  font-size:10px;
  color:#fff;
  text-shadow:1px 1px 0 var(--ink);
}
.title-dots{display:flex; gap:6px;}
.dot{width:10px;height:10px;border-radius:50%;border:2px solid var(--ink);}
.dot-yellow{background:var(--yellow);}
.dot-mint{background:var(--mint);}
.dot-pink{background:var(--pink);}

/* ================= ROBOT STAGE (2 MODE) ================= */
.robot-stage{
  display:flex;
  align-items:center;
  overflow:hidden;
  transition:padding .4s ease, height .4s ease, background .4s ease;
}

/* -- Mode IDLE: robot gede, di tengah, ambil ruang paling banyak -- */
body.mode-idle .robot-stage{
  flex:1;
  flex-direction:column;
  justify-content:center;
  gap:16px;
  padding:20px 16px;
}

/* -- Mode CHAT: robot kecil, jadi strip di atas -- */
body.mode-chat .robot-stage{
  flex:0 0 auto;
  flex-direction:row;
  justify-content:flex-start;
  gap:12px;
  height:92px;
  padding:8px 16px;
  background:linear-gradient(180deg, var(--pink) 0%, var(--cream) 100%);
  border-bottom:3px dashed var(--ink);
}

.status-text{
  font-size:12px;
  font-weight:700;
  color:var(--ink);
  opacity:.8;
  flex-shrink:0;
}

/* Wrapper yang nge-scale robot (dipisah dari animasi idle robot itu sendiri) */
.robot-scale{
  transition:transform .45s cubic-bezier(.34,1.4,.64,1);
  transform-origin:center top;
}
body.mode-idle .robot-scale{ transform:scale(1); }
body.mode-chat .robot-scale{ transform:scale(.5); }

/* ---------- ROBOT (ukuran dasar, di-scale via wrapper di atas) ---------- */
.robot{
  position:relative;
  width:150px;
  cursor:pointer;
  user-select:none;
  animation:idleBob 2.4s ease-in-out infinite;
  transform-origin:bottom center;
}

@keyframes idleBob{
  0%,100%{transform:translateY(0) rotate(0deg);}
  50%{transform:translateY(-8px) rotate(-1.5deg);}
}

.antenna{
  position:absolute;
  top:-38px;
  left:50%;
  transform:translateX(-50%);
  display:flex;
  flex-direction:column;
  align-items:center;
  animation:antennaWiggle 2.4s ease-in-out infinite;
  transform-origin:bottom center;
}
@keyframes antennaWiggle{
  0%,100%{transform:translateX(-50%) rotate(0deg);}
  50%{transform:translateX(-50%) rotate(8deg);}
}
.antenna-stick{width:4px;height:22px;background:var(--ink);}
.antenna-ball{
  width:16px;height:16px;border-radius:50%;
  background:var(--yellow);
  border:3px solid var(--ink);
  margin-top:-4px;
  box-shadow:0 0 10px var(--yellow);
}

.head{
  position:relative;
  width:110px;
  height:90px;
  background:var(--pink);
  border:4px solid var(--ink);
  border-radius:28px 28px 22px 22px;
  margin:0 auto;
  display:flex;
  align-items:center;
  justify-content:center;
}

.eye{
  position:absolute;
  top:32px;
  width:20px;
  height:24px;
  background:#fff;
  border:3px solid var(--ink);
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  transition:height .1s ease;
}
.eye-left{left:22px;}
.eye-right{right:22px;}
.pupil{
  width:9px;height:9px;
  background:var(--ink);
  border-radius:50%;
}

.cheek{
  position:absolute;
  bottom:22px;
  width:14px;height:8px;
  background:var(--pink-dark);
  border-radius:50%;
  opacity:.7;
}
.cheek-left{left:12px;}
.cheek-right{right:12px;}

.mouth{
  position:absolute;
  bottom:16px;
  left:50%;
  transform:translateX(-50%);
  width:22px;
  height:8px;
  border-bottom:4px solid var(--ink);
  border-radius:0 0 12px 12px;
  transition:all .12s ease;
}

.body{
  position:relative;
  width:80px;
  height:56px;
  background:var(--blue);
  border:4px solid var(--ink);
  border-radius:20px;
  margin:-6px auto 0;
  display:flex;
  align-items:center;
  justify-content:center;
}
.panel-light{
  width:14px;height:14px;
  background:var(--mint);
  border:2px solid var(--ink);
  border-radius:4px;
}

.arm{
  position:absolute;
  top:14px;
  width:16px;height:34px;
  background:var(--blue);
  border:3px solid var(--ink);
  border-radius:10px;
  transform-origin:top center;
}
.arm-left{left:-16px; animation:armIdleLeft 2.4s ease-in-out infinite;}
.arm-right{right:-16px; animation:armIdleRight 2.4s ease-in-out infinite;}
@keyframes armIdleLeft{0%,100%{transform:rotate(0deg);}50%{transform:rotate(-6deg);}}
@keyframes armIdleRight{0%,100%{transform:rotate(0deg);}50%{transform:rotate(6deg);}}

.hand{
  position:absolute;
  bottom:-9px;
  left:50%;
  transform:translateX(-50%);
  width:16px;
  height:14px;
  background:var(--pink);
  border:3px solid var(--ink);
  border-radius:50%;
}
.finger{
  position:absolute;
  bottom:-5px;
  width:4px;
  height:7px;
  background:var(--pink);
  border:2px solid var(--ink);
  border-radius:3px;
}
.finger.f1{left:-1px;}
.finger.f2{left:5px;}
.finger.f3{left:11px;}

.feet{
  display:flex;
  justify-content:center;
  gap:20px;
  margin-top:4px;
}
.foot{
  position:relative;
  width:26px;height:12px;
  background:var(--lavender);
  border:3px solid var(--ink);
  border-radius:8px;
}
.toe{
  position:absolute;
  bottom:-6px;
  width:6px;height:8px;
  background:var(--lavender);
  border:2px solid var(--ink);
  border-radius:3px;
}
.toe.t1{left:1px;}
.toe.t2{left:9px;}
.toe.t3{left:17px;}

/* ---------- STATES / EKSPRESI ---------- */
.robot.happy .head{background:var(--yellow);}
.robot.happy .mouth{
  width:30px;height:16px;
  border:4px solid var(--ink);
  border-top:none;
  border-radius:0 0 20px 20px;
}
.robot.happy{animation:happyBounce .5s ease;}
@keyframes happyBounce{
  0%{transform:scale(1);}
  40%{transform:scale(1.12,.88);}
  70%{transform:scale(.95,1.06);}
  100%{transform:scale(1);}
}

.robot.surprised .eye{height:26px;width:24px;}
.robot.surprised .mouth{
  width:16px;height:16px;
  border:4px solid var(--ink);
  border-radius:50%;
}

.robot.thinking .head{background:var(--mint);}
.robot.thinking .mouth{
  width:14px;height:4px;
  border-bottom:4px solid var(--ink);
  border-radius:0;
  transform:translateX(-50%) rotate(-8deg);
}
.robot.thinking .pupil{transform:translateY(-4px);}

.robot.talking .mouth{
  animation:talkFlap .28s ease-in-out infinite;
}
@keyframes talkFlap{
  0%,100%{height:6px; border-radius:0 0 12px 12px;}
  50%{height:16px; border-radius:50%;}
}

.robot.blink .eye{height:3px;}

/* ================= SAPAAN AWAL vs LOG PERCAKAPAN ================= */
.idle-greeting{
  text-align:center;
  padding:0 20px 16px;
}
.idle-greeting p{
  margin:0;
  background:#fff;
  border:3px solid var(--ink);
  border-radius:16px;
  padding:12px 16px;
  font-size:14px;
  font-weight:700;
  display:inline-block;
}
body.mode-chat .idle-greeting{ display:none; }

.message-log{
  display:none;
  min-height:0;
  overflow-y:auto;
  padding:14px 16px;
  flex-direction:column;
  gap:10px;
  -webkit-overflow-scrolling:touch;
}
body.mode-chat .message-log{
  display:flex;
  flex:1;
}

.msg{
  max-width:88%;
  padding:10px 14px;
  border:3px solid var(--ink);
  border-radius:14px;
  font-size:14px;
  font-weight:700;
  line-height:1.4;
}
.msg p{margin:0;}
.msg-esa{
  background:#fff;
  align-self:flex-start;
  border-bottom-left-radius:2px;
}
.msg-user{
  background:var(--yellow);
  align-self:flex-end;
  border-bottom-right-radius:2px;
  font-weight:600;
  opacity:.9;
}

.read-btn{
  margin-top:6px;
  align-self:flex-start;
  font-family:'Baloo 2',sans-serif;
  font-weight:700;
  font-size:12px;
  padding:6px 12px;
  border:2px solid var(--ink);
  border-radius:12px;
  background:var(--mint);
  cursor:pointer;
  box-shadow:2px 2px 0 var(--ink);
}
.read-btn:active{transform:translate(1px,1px); box-shadow:1px 1px 0 var(--ink);}

/* ================= BAR BAWAH ================= */
.bottom-bar{
  flex-shrink:0;
  border-top:3px dashed var(--ink);
  padding:10px 16px;
  display:flex;
  flex-direction:column;
  gap:8px;
  background:var(--cream);
}

.text-row{
  display:flex;
  gap:8px;
  width:100%;
  min-width:0;
}
.text-input{
  flex:1;
  min-width:0;
  font-family:'Baloo 2',sans-serif;
  font-size:14px;
  padding:12px;
  min-height:44px;
  border:3px solid var(--ink);
  border-radius:14px;
  background:#fff;
  color:var(--ink);
  outline:none;
}
.text-input:focus{background:var(--cream);}
.btn-send{background:var(--yellow); padding:10px 16px; min-height:44px; flex-shrink:0;}

.btn{
  font-family:'Baloo 2',sans-serif;
  font-weight:700;
  font-size:13px;
  padding:10px 16px;
  min-height:44px;
  border:3px solid var(--ink);
  border-radius:14px;
  background:var(--pink);
  color:var(--ink);
  box-shadow:3px 3px 0 var(--ink);
  cursor:pointer;
  transition:transform .1s ease;
}
.btn:active{transform:translate(2px,2px); box-shadow:1px 1px 0 var(--ink);}
.btn-mic{width:100%;}
.btn-mic.listening{background:var(--yellow); animation:pulseMic 1s ease-in-out infinite;}
@keyframes pulseMic{0%,100%{box-shadow:3px 3px 0 var(--ink);}50%{box-shadow:3px 3px 0 var(--ink),0 0 0 6px rgba(255,182,217,.5);}}

/* ================= RESPONSIVE: LAYAR LEBAR ================= */
@media (min-width:701px){
  .app-window{ max-width:640px; }
}
