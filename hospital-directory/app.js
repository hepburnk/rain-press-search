const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const KEY="hdir2026";let store={};try{store=JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}};
const fmt=n=>n.toLocaleString("ko-KR");

// ---- 명부 목차 구조 (id, 번호, 제목, 렌더러) ----
const PEND=(t,hint)=>()=>pending(t,hint);
const TOC=[
 {g:"머리말",items:[
  ["eth","","병원윤리강령",PEND("병원윤리강령")],
  ["org","","대한병원협회 사무국 조직도 및 연락처",PEND("사무국 조직도 및 연락처")],
  ["exe","","대한병원협회 임원(제43대)",PEND("임원(제43대)")],
  ["assoc","","시·도 및 직능 병원회, 직능 단체 현황",PEND("시·도 및 직능 병원회")]]},
 {g:"본문",items:[
  ["s1","1","2026년도 전국 병원 현황",viewSummary],
  ["s2a","2-가","지역별 병원 현황",PEND("지역별 병원 현황","종합병원 385곳 명단이 여기에 있으면 요청하신 '종합병원' 항목을 채울 수 있습니다.")],
  ["s2b","2-나","군병원 현황",()=>viewTable("mil",["소속","병원명","주소","대표전화","비고"],군병원,"군병원은 전국현황 집계(3,425개)에서 제외됩니다. 빈 칸은 공개 데이터에 없어 명부 확인이 필요합니다.")],
  ["s3","3","지역별 시·구·군별 현황 집계",PEND("시·구·군별 현황 집계")],
  ["s4","4","설립구분별 현황 집계",PEND("설립구분별 현황 집계")],
  ["s5","5","설립구분별 및 병상규모별 현황 집계",PEND("설립구분별·병상규모별 집계")],
  ["s6","6","진료과목별 현황 집계",PEND("진료과목별 현황 집계")]]},
 {g:"7. 기타현황",items:[
  ["s7a","7-가","응급의료병원 현황",viewEmerg],
  ["s7b","7-나","호스피스 전문기관 현황",PEND("호스피스 전문기관 현황")],
  ["s7c","7-다","보훈위탁병원 현황",PEND("보훈위탁병원 현황")],
  ["s7d","7-라","간호간병통합서비스 운영 기관 현황",PEND("간호간병통합서비스 운영 기관")],
  ["s7e","7-마","전문병원지정 현황",PEND("전문병원지정 현황","전문병원은 2026 환자경험평가 신규 대상입니다.")],
  ["s7f","7-바","상급종합병원 현황",()=>viewTable("tert",["권역","병원명","주소","대표전화","응급의료기관"],상급종합,"제5기 상급종합병원(보건복지부 지정, 2024.1.1~2026.12.31) 47개소. 대표전화·주소는 응급의료포털 공개 데이터(2026-11-23 조회).")],
  ["s7g","7-사","미래의료산업협의회 회원사 현황",PEND("미래의료산업협의회 회원사")]]},
 {g:"요청하신 내용",items:[
  ["req","★","요청 항목 점검표",viewReq],
  ["px","★","환자경험평가 2026",viewPx]]}
];
const ALL=TOC.flatMap(g=>g.items);
let cur="req",q="";
function tabs(){
  document.getElementById("tabs").innerHTML=TOC.map(g=>`<div class="grp"><div class="gt">${esc(g.g)}</div>${g.items.map(([id,n,t])=>{
    const done=!["eth","org","exe","assoc","s2a","s3","s4","s5","s6","s7b","s7c","s7d","s7e","s7g"].includes(id);
    return `<button class="${id===cur?"on":""}" data-t="${id}"><span class="no">${esc(n)}</span>${esc(t)}<span class="st ${done?"y":"n"}">${done?"●":"○"}</span></button>`}).join("")}</div>`).join("");
}
document.getElementById("tabs").onclick=e=>{const b=e.target.closest("button");if(!b)return;cur=b.dataset.t;q="";render();window.scrollTo(0,0)};
function render(){tabs();const it=ALL.find(x=>x[0]===cur);document.getElementById("ttl").textContent=(it[1]&&it[1]!=="★"?it[1]+". ":"")+it[2];it[3]()}

function pending(t,hint){
  document.getElementById("view").innerHTML=`<div class="note">「${esc(t)}」 쪽은 아직 사진을 받지 못해 비어 있습니다. 해당 쪽을 촬영해 보내주시면 표로 옮기고 합계를 검산합니다.${hint?`<br><b>${esc(hint)}</b>`:""}</div>`;
}

function viewEmerg(){
  const by={};상급종합.forEach(r=>{(by[r[4]]??=[]).push(r[1])});
  document.getElementById("view").innerHTML=`<div class="note">명부 전체 응급의료병원 목록은 사진 필요. 아래는 상급종합병원 47곳의 응급의료기관 구분(응급의료포털 공개 데이터)입니다.</div>
  <div class="wrap"><table><thead><tr><th>구분</th><th>수</th><th>병원</th></tr></thead><tbody>
  ${Object.entries(by).map(([k,v])=>`<tr><td>${esc(k)}</td><td class="num">${v.length}</td><td style="white-space:normal">${v.map(esc).join(", ")}</td></tr>`).join("")}</tbody></table></div>`;
}

// ---- 요청 항목 점검 ----
function filled(id,rows,f){return rows.filter(r=>(store[id+":"+r[1]]||{})[f]).length}
function viewReq(){
  const T=상급종합,M=군병원;
  const cell=(st,txt)=>`<td class="${st}">${{y:"✔",p:"✎",n:"✘"}[st]} ${txt}</td>`;
  const inp=(id,rows,f)=>{const n=filled(id,rows,f);return cell(n===rows.length?"y":"p",`입력 ${n}/${rows.length}`)};
  const milPhone=M.filter(r=>r[3]).length;
  const rows=[
   ["병원 대표전화",cell("y","47/47 확보"),cell("n","명단 없음 (2-가 사진 필요)"),cell(milPhone===M.length?"y":"p",`${milPhone}/${M.length} 확보`)],
   ["병원장",inp("tert",T,"병원장"),cell("n","명단 없음"),inp("mil",M,"병원장")],
   ["팩스",inp("tert",T,"팩스"),cell("n","명단 없음"),inp("mil",M,"팩스")],
   ["장비보유(CT·MRI·PET 등)",inp("tert",T,"장비보유(CT·MRI·PET 등)"),cell("n","명단 없음"),inp("mil",M,"장비보유(CT·MRI·PET 등)")],
   ["비급여 공개",inp("tert",T,"비급여 공개"),cell("n","명단 없음"),inp("mil",M,"비급여 공개")],
   ["환자경험평가 2026 대상",inp("tert",T,"환자경험평가 2026 대상"),cell("n","명단 없음"),inp("mil",M,"환자경험평가 2026 대상")],
   ["평가 담당자 이메일",inp("tert",T,"평가 담당자 이메일"),cell("n","명단 없음"),inp("mil",M,"평가 담당자 이메일")],
  ];
  document.getElementById("view").innerHTML=`
  <div class="note">처음 요청하신 항목(장비보유 · 상급종합병원 · 종합병원 · 군병원 · 비급여 · 병원장/전화 · 팩스 · 2026 환자경험평가 대상 · 담당자 이메일)을 병원 종류별로 얼마나 채웠는지 보여줍니다. 표에 입력하면 숫자가 바로 바뀝니다.</div>
  <div class="wrap"><table class="req"><thead><tr><th>요청 항목</th><th>상급종합병원 (47)</th><th>종합병원 (385)</th><th>군병원 (${M.length})</th></tr></thead><tbody>
  ${rows.map(r=>`<tr><th>${r[0]}</th>${r.slice(1).join("")}</tr>`).join("")}</tbody></table></div>
  <p class="legend">✔ 확보 · ✎ 명부 보고 입력 중 · ✘ 자료 없음</p>
  <h3>채우는 방법</h3><ul class="how">
  <li><b>대표전화</b>: 공개 데이터로 확보 완료(상급종합 47곳, 군병원 10곳).</li>
  <li><b>병원장·팩스</b>: 명부 본문에 있음 → <a href="#" data-go="s7f">7-바 상급종합병원</a>, <a href="#" data-go="s2b">2-나 군병원</a> 표의 주황 칸에 입력, 또는 해당 쪽 사진 전송.</li>
  <li><b>종합병원 385곳</b>: <a href="#" data-go="s2a">2-가 지역별 병원 현황</a> 쪽 사진이 필요합니다.</li>
  <li><b>장비보유·비급여</b>: 심평원 공공데이터(의료기관별 상세정보·비급여 진료비) API 인증키가 있으면 자동으로 채울 수 있습니다.</li>
  <li><b>2026 환자경험평가 대상·담당자 이메일</b>: 887곳 명단과 담당자 이메일은 공개 자료에 없습니다. 심평원 공지 또는 병원에서 받은 자료로 입력하세요.</li></ul>`;
  document.querySelectorAll("[data-go]").forEach(a=>a.onclick=e=>{e.preventDefault();cur=a.dataset.go;render()});
}

function viewSummary(){
  const sumI=전국현황.행.reduce((a,r)=>a+r[1],0),sumB=전국현황.행.reduce((a,r)=>a+r[2],0);
  const okI=sumI===전국현황.계[0],okB=sumB===전국현황.계[1];
  document.getElementById("view").innerHTML=`
  <div class="note">출처: ${esc(전국현황.출처)} · ${esc(전국현황.기준)}</div>
  <div class="wrap"><table><thead><tr><th>구분</th><th>기관수</th><th>병상수</th><th>기관당 평균 병상</th></tr></thead><tbody>
  ${전국현황.행.map(r=>`<tr><td>${r[0]}</td><td class="num">${fmt(r[1])}</td><td class="num">${fmt(r[2])}</td><td class="num">${fmt(Math.round(r[2]/r[1]))}</td></tr>`).join("")}
  <tr class="total"><td>계</td><td class="num">${fmt(전국현황.계[0])}</td><td class="num">${fmt(전국현황.계[1])}</td><td class="num">${fmt(Math.round(전국현황.계[1]/전국현황.계[0]))}</td></tr>
  </tbody></table></div>
  <p>검산: 기관수 합 ${fmt(sumI)} <span class="${okI?"ok":""}">${okI?"✔ 일치":"✘ 불일치"}</span> · 병상수 합 ${fmt(sumB)} <span class="${okB?"ok":""}">${okB?"✔ 일치":"✘ 불일치"}</span></p>
`;
}

function viewTable(id,cols,rows,note){
  const all=[...cols,...입력항목];
  document.getElementById("view").innerHTML=`<div class="note">${esc(note)}</div>
  <div class="bar"><input id="q" type="search" placeholder="병원명·지역·전화 검색" value="${esc(q)}"><span id="cnt" class="badge"></span><button id="csv">CSV 내려받기</button></div>
  <div class="wrap"><table><thead><tr><th>#</th>${all.map(c=>`<th>${esc(c)}</th>`).join("")}</tr></thead><tbody id="tb"></tbody></table></div>`;
  const tb=document.getElementById("tb"),inp=document.getElementById("q");
  const draw=()=>{const k=q.trim().toLowerCase();let n=0;
    tb.innerHTML=rows.map((r,i)=>{const key=id+":"+r[1];const ex=store[key]||{};
      const hay=(r.join(" ")+" "+Object.values(ex).join(" ")).toLowerCase();if(k&&!hay.includes(k))return"";n++;
      return `<tr><td>${i+1}</td>${r.map(v=>`<td>${esc(v)||'<span style="opacity:.5">—</span>'}</td>`).join("")}${입력항목.map(f=>`<td contenteditable data-k="${esc(key)}" data-f="${esc(f)}">${esc(ex[f]||"")}</td>`).join("")}</tr>`}).join("");
    document.getElementById("cnt").textContent=`${n} / ${rows.length}`};
  inp.oninput=()=>{q=inp.value;draw()};
  tb.oninput=e=>{const c=e.target.closest("td[contenteditable]");if(!c)return;(store[c.dataset.k]??={})[c.dataset.f]=c.textContent.trim();save()};
  document.getElementById("csv").onclick=()=>{
    const lines=[all.join(",")].concat(rows.map(r=>{const ex=store[id+":"+r[1]]||{};return [...r,...입력항목.map(f=>ex[f]||"")].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")}));
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+lines.join("\n")],{type:"text/csv"}));a.download=id+"_2026병원명부.csv";a.click()};
  draw();
}

function viewPx(){
  document.getElementById("view").innerHTML=`
  <div class="note">공개 자료로 확인된 내용만 적었습니다. 대상기관 887곳의 개별 명단과 병원별 담당자 이메일은 공개된 자료에 없습니다.</div>
  <div class="wrap"><table><tbody>
  <tr><th>회차</th><td>6차 환자경험평가 (2026년)</td></tr>
  <tr><th>대상기관</th><td>상급종합병원 · 종합병원 + <b>전문병원, 100병상 이상 병원</b> 신규 포함 → <b>총 887개소</b> (5차 376개소)</td></tr>
  <tr><th>조사</th><td>2026년 9~11월, 카카오톡·문자 모바일 웹 설문 (설문 문항·대상 환자는 5차와 동일)</td></tr>
  <tr><th>결과 공개</th><td>2027년 7월 예정 — 상급종합·종합병원은 기관별 등급, 병원급은 7개 영역별 점수 (신규 병원급은 1~5등급 미적용)</td></tr>
  <tr><th>발표</th><td>건강보험심사평가원 보도자료 2026-07-31 (5차 결과 + 6차 세부시행계획)</td></tr>
  </tbody></table></div>
  <p style="font-size:14px;color:var(--sub)">상급종합·군병원 표의 <b>'환자경험평가 2026 대상'</b>, <b>'평가 담당자 이메일'</b> 칸에 대상 여부와 이메일을 직접 적어 두면 검색과 CSV에 함께 나옵니다. 대상 명단은 심평원 요양기관업무포털 공지 또는 병원평가통합포털에서 확인할 수 있습니다.</p>`;
}
render();
