// 데이터.js 에서 전역 상수 `보도자료`([{번호, 부처, 제목, 본문}])를 불러온다.
// fetch 없이 동작하므로 로컬 더블클릭·정적 호스팅 어디서나 실행된다.
const data = 보도자료;

const q      = document.getElementById('q');
const clear  = document.getElementById('clear');
const list   = document.getElementById('list');
const count  = document.getElementById('count');
const depts  = document.getElementById('depts');

let currentDept = '전체';

// ---------- 유틸 ----------
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 마크다운 표식(# 제목, **강조**, --- 구분선) 제거 — 카드 본문 가독성용
function cleanBody(t) {
  return t
    .replace(/^#.*\n+/, '')        // 첫 줄 제목(카드 제목과 중복)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\n-{3,}\s*$/g, '')
    .trim();
}

// 키워드 하이라이트 (대소문자 무시)
function highlight(text, kw) {
  const safe = esc(text);
  if (!kw) return safe;
  return safe.replace(new RegExp(escRe(esc(kw)), 'gi'), m => `<mark>${m}</mark>`);
}

// ---------- 필터 ----------
function filtered() {
  const kw = q.value.trim().toLowerCase();
  return data.filter(a => {
    if (currentDept !== '전체' && a.부처 !== currentDept) return false;
    if (!kw) return true;
    return a.본문.toLowerCase().includes(kw)
        || a.제목.toLowerCase().includes(kw)
        || a.부처.toLowerCase().includes(kw);
  });
}

// ---------- 렌더 ----------
function render() {
  const arr = filtered();
  const kw  = q.value.trim();
  count.textContent = `결과 ${arr.length}건 / 전체 ${data.length}건`;
  clear.classList.toggle('show', kw.length > 0);

  if (arr.length === 0) {
    list.innerHTML = `<div class="empty">"${esc(kw)}"${currentDept !== '전체' ? ` (${esc(currentDept)})` : ''} 에 해당하는 보도자료가 없습니다.</div>`;
    return;
  }

  list.innerHTML = arr.map(a => {
    const body = cleanBody(a.본문);
    const long = body.length > 220;
    return `
    <article class="card" data-dept="${esc(a.부처)}">
      <div class="meta"><span class="label">${highlight(a.부처, kw)}</span><span>보도자료 ${esc(a.번호)}호</span></div>
      <h2 class="title">${highlight(a.제목, kw)}</h2>
      <div class="body ${long && !kw ? 'collapsed' : ''}">${highlight(body, kw)}</div>
      ${long && !kw ? '<button class="more" type="button">전문 보기 ▾</button>' : ''}
    </article>`;
  }).join('');
}

// 부처 필터 버튼 (데이터에 등장한 순서대로)
function renderDepts() {
  const names = ['전체', ...new Set(data.map(a => a.부처))];
  depts.innerHTML = names.map(n => {
    const c = n === '전체' ? data.length : data.filter(a => a.부처 === n).length;
    return `<button type="button" data-dept="${esc(n)}" class="${n === currentDept ? 'active' : ''}">${esc(n)}<span class="n">${c}</span></button>`;
  }).join('');
}

// ---------- 이벤트 ----------
q.addEventListener('input', render);
clear.addEventListener('click', () => { q.value = ''; q.focus(); render(); });
depts.addEventListener('click', e => {
  const b = e.target.closest('button[data-dept]');
  if (!b) return;
  currentDept = b.dataset.dept;
  renderDepts();
  render();
});
list.addEventListener('click', e => {
  const b = e.target.closest('.more');
  if (!b) return;
  const body = b.previousElementSibling;
  const open = body.classList.toggle('collapsed');
  b.textContent = open ? '전문 보기 ▾' : '접기 ▴';
});

// ---------- 초기 로드 ----------
renderDepts();
render();
