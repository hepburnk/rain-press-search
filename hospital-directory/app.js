const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const KEY="hdir2026";let store={};try{store=JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}};
const fmt=n=>n.toLocaleString("ko-KR");

const TABS={
  "전국 현황":viewSummary,
  ["상급종합병원 ("+상급종합.length+")"]:()=>viewTable("tert",["권역","병원명","주소","대표전화","응급의료기관"],상급종합,
    "제5기 상급종합병원(보건복지부 지정, 2024.1.1~2026.12.31) 47개소. 대표전화·주소는 응급의료포털 공개 데이터(2026-11-23 조회). 명부 '7-바. 상급종합병원 현황'과 대조하세요."),
  ["군병원 ("+군병원.length+")"]:()=>viewTable("mil",["소속","병원명","주소","대표전화","비고"],군병원,
    "명부 '2-나. 군병원 현황'과 대조용. 군병원은 전국현황 집계(3,425개)에서 제외됩니다. 빈 칸은 공개 데이터에 없어 명부 확인이 필요합니다."),
  "환자경험평가 2026":viewPx,
};
let cur=Object.keys(TABS)[0],q="";
function tabs(){document.getElementById("tabs").innerHTML=Object.keys(TABS).map(t=>`<button class="${t===cur?"on":""}" data-t="${esc(t)}">${esc(t)}</button>`).join("")}
document.getElementById("tabs").onclick=e=>{const b=e.target.closest("button");if(!b)return;cur=b.dataset.t;q="";render()};
function render(){tabs();TABS[cur]()}

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
  <h3>명부 목차</h3><ol style="color:var(--sub);font-size:14px">
  <li>2026년도 전국 병원 현황</li><li>지역별 병원 및 병상 현황 집계 (가. 지역별 병원 현황 / 나. 군병원 현황)</li><li>지역별 시·구·군별 현황 집계</li><li>설립구분별 현황 집계</li><li>설립구분별 및 병상규모별 현황 집계</li><li>진료과목별 현황 집계</li>
  <li>기타현황: 가. 응급의료병원 · 나. 호스피스 전문기관 · 다. 보훈위탁병원 · 라. 간호간병통합서비스 운영기관 · 마. 전문병원 지정 · 바. 상급종합병원 · 사. 미래의료산업협의회 회원사</li></ol>`;
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
