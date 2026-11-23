"""data.js → 단일 HTML · CSV · Word(docx) 생성.  실행: python3 build.py"""
import csv, json, os, subprocess
from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor, Cm

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "output"); os.makedirs(OUT, exist_ok=True)
D = json.loads(subprocess.check_output(["node", "-e",
    "eval(require('fs').readFileSync(process.argv[1],'utf8')+';process.stdout.write(JSON.stringify({전국현황,상급종합,군병원,입력항목}))')",
    os.path.join(HERE, "data.js")]))
T, M, F, S = D["상급종합"], D["군병원"], D["입력항목"], D["전국현황"]
NAME = "2026_전국병원명부_정리"

TOC = [  # (번호, 제목, 상태, 비고)
 ("", "병원윤리강령", "○", "명부 사진 필요"),
 ("", "대한병원협회 사무국 조직도 및 연락처", "○", "명부 사진 필요"),
 ("", "대한병원협회 임원(제43대)", "○", "명부 사진 필요"),
 ("", "시·도 및 직능 병원회, 직능 단체 현황", "○", "명부 사진 필요"),
 ("1", "2026년도 전국 병원 현황", "●", "21쪽 표 입력·검산 완료"),
 ("2-가", "지역별 병원 현황", "○", "명부 사진 필요 (종합병원 385곳 명단)"),
 ("2-나", "군병원 현황", "●", f"{len(M)}곳, 대표전화 {sum(1 for r in M if r[3])}곳 확보"),
 ("3", "지역별 시·구·군별 현황 집계", "○", "명부 사진 필요"),
 ("4", "설립구분별 현황 집계", "○", "명부 사진 필요"),
 ("5", "설립구분별 및 병상규모별 현황 집계", "○", "명부 사진 필요"),
 ("6", "진료과목별 현황 집계", "○", "명부 사진 필요"),
 ("7-가", "응급의료병원 현황", "◐", "상급종합 47곳 응급의료기관 구분만"),
 ("7-나", "호스피스 전문기관 현황", "○", "명부 사진 필요"),
 ("7-다", "보훈위탁병원 현황", "○", "명부 사진 필요"),
 ("7-라", "간호간병통합서비스 운영 기관 현황", "○", "명부 사진 필요"),
 ("7-마", "전문병원지정 현황", "○", "명부 사진 필요 (2026 환자경험평가 신규 대상)"),
 ("7-바", "상급종합병원 현황", "●", "47곳, 대표전화 47곳 확보"),
 ("7-사", "미래의료산업협의회 회원사 현황", "○", "명부 사진 필요"),
]
milp = sum(1 for r in M if r[3])
REQ = [  # 요청 항목 × 병원 종류
 ("병원 대표전화", "확보 47/47", "명단 없음", f"확보 {milp}/{len(M)}"),
 ("병원장", "명부 보고 입력", "명단 없음", "명부 보고 입력"),
 ("팩스", "명부 보고 입력", "명단 없음", "명부 보고 입력"),
 ("장비보유(CT·MRI·PET 등)", "명부/심평원 API", "명단 없음", "명부 보고 입력"),
 ("비급여 공개", "명부/심평원 API", "명단 없음", "명부 보고 입력"),
 ("2026 환자경험평가 대상", "공개 명단 없음", "공개 명단 없음", "공개 명단 없음"),
 ("평가 담당자 이메일", "비공개", "비공개", "비공개"),
]
PX = [
 ("회차", "6차 환자경험평가 (2026년)"),
 ("대상기관", "상급종합병원·종합병원 + 전문병원, 100병상 이상 병원 신규 포함 → 총 887개소 (5차 376개소)"),
 ("조사", "2026년 9~11월, 카카오톡·문자 모바일 웹 설문 (설문 문항·대상 환자는 5차와 동일)"),
 ("결과 공개", "2027년 7월 예정 — 상급종합·종합병원은 기관별 등급, 병원급은 7개 영역별 점수 (신규 병원급은 1~5등급 미적용)"),
 ("발표", "건강보험심사평가원 보도자료 2026-07-31 (5차 결과 + 6차 세부시행계획)"),
 ("명단·담당자", "887곳 개별 명단과 병원별 담당자 이메일은 공개 자료에 없음"),
]
SRC = [
 "2026 전국병원명부(대한병원협회) 표지·목차·21쪽 사진",
 "보건복지부 제5기(’24~’26년) 상급종합병원 47개소 지정 보도자료 — https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&list_no=1479568&act=view",
 "국립중앙의료원 응급의료포털 공개 데이터(MedInfo) — 대표전화·주소·응급의료기관 구분, 2026-11-23 조회",
 "건강보험심사평가원 보도자료 — https://www.hira.or.kr/bbsDummy.do?pgmid=HIRAA020041000100&brdScnBltNo=4&brdBltNo=11870",
 "병원신문 — http://www.khanews.com/news/articleView.html?idxno=250260",
]
TH = ["권역", "병원명", "주소", "대표전화", "응급의료기관"]
MH = ["소속", "병원명", "주소", "대표전화", "비고"]

# ---------- CSV (엑셀에서 한글 안 깨지게 UTF-8 BOM) ----------
def wcsv(fn, head, rows):
    with open(os.path.join(OUT, fn), "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f); w.writerow(head); w.writerows(rows)
wcsv("00_명부_목차.csv", ["번호", "목차", "상태", "비고"], TOC)
wcsv("01_전국병원현황.csv", ["구분", "기관수", "병상수", "기관당 평균 병상"],
     [[r[0], r[1], r[2], round(r[2]/r[1])] for r in S["행"]] + [["계", *S["계"], round(S["계"][1]/S["계"][0])]])
wcsv("02_상급종합병원_47.csv", ["번호", *TH, *F], [[i+1, *r, *[""]*len(F)] for i, r in enumerate(T)])
wcsv("03_군병원.csv", ["번호", *MH, *F], [[i+1, *r, *[""]*len(F)] for i, r in enumerate(M)])
wcsv("04_요청항목_점검표.csv", ["요청 항목", "상급종합병원(47)", "종합병원(385)", f"군병원({len(M)})"], REQ)
wcsv("05_환자경험평가_2026.csv", ["항목", "내용"], PX)

# ---------- Word ----------
doc = Document()
st = doc.styles["Normal"]; st.font.name = "맑은 고딕"; st.font.size = Pt(9.5)
st.element.rPr.rFonts.set(qn("w:eastAsia"), "맑은 고딕")
for s in ("Title", "Heading 1", "Heading 2"):
    doc.styles[s].font.name = "맑은 고딕"; doc.styles[s].element.rPr.rFonts.set(qn("w:eastAsia"), "맑은 고딕")
    doc.styles[s].font.color.rgb = RGBColor(0x1d, 0x3d, 0x7a)
sec = doc.sections[0]
sec.orientation = WD_ORIENT.LANDSCAPE; sec.page_width, sec.page_height = Cm(29.7), Cm(21)
for m in ("left_margin", "right_margin", "top_margin", "bottom_margin"): setattr(sec, m, Cm(1.6))
fp = sec.footer.paragraphs[0]; fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = fp.add_run(); [r._r.append(e) for e in (lambda a, b, c: (a, b, c))(*[OxmlElement(t) for t in ("w:fldChar", "w:instrText", "w:fldChar")])]
r._r[0].set(qn("w:fldCharType"), "begin"); r._r[1].text = "PAGE"; r._r[2].set(qn("w:fldCharType"), "end")

def shade(cell, hexcol):
    tcPr = cell._tc.get_or_add_tcPr(); sh = OxmlElement("w:shd")
    sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), hexcol); tcPr.append(sh)

def table(head, rows, widths=None, input_from=None, bold_last=False):
    t = doc.add_table(rows=1, cols=len(head)); t.style = "Table Grid"; t.alignment = WD_TABLE_ALIGNMENT.CENTER
    hr = t.rows[0]; hr.repeat = True
    trPr = hr._tr.get_or_add_trPr(); h = OxmlElement("w:tblHeader"); h.set(qn("w:val"), "true"); trPr.append(h)
    for c, txt in zip(hr.cells, head):
        c.text = ""; run = c.paragraphs[0].add_run(str(txt)); run.bold = True; run.font.size = Pt(8.5); shade(c, "DCE6F4")
    for ri, row in enumerate(rows):
        cells = t.add_row().cells
        for ci, (c, txt) in enumerate(zip(cells, row)):
            run = c.paragraphs[0].add_run("" if txt is None else (f"{txt:,}" if isinstance(txt, int) else str(txt)))
            run.font.size = Pt(8.5)
            if isinstance(txt, int): c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
            if bold_last and ri == len(rows)-1: run.bold = True
            if input_from is not None and ci >= input_from: shade(c, "FFF4E5")
    if widths:
        t.autofit = False
        tblPr = t._tbl.tblPr; lay = OxmlElement("w:tblLayout"); lay.set(qn("w:type"), "fixed"); tblPr.append(lay)
        for gc, w in zip(t._tbl.tblGrid.findall(qn("w:gridCol")), widths): gc.set(qn("w:w"), str(int(w*567)))
        for row in t.rows:
            for c, w in zip(row.cells, widths): c.width = Cm(w)
    return t

NB = [False]
def newpage(): NB[0] = True
def brk(p):
    if NB[0]: p.paragraph_format.page_break_before = True; NB[0] = False
    return p
def H(txt, lv): return brk(doc.add_heading(txt, lv))

def note(txt):
    p = brk(doc.add_paragraph()); run = p.add_run(txt); run.font.size = Pt(8.5); run.font.color.rgb = RGBColor(0x66, 0x6e, 0x7c)

doc.add_paragraph("2026 전국병원명부 정리", style="Title")
note("대한병원협회 「2026 전국병원명부」 목차 구조에 공개 데이터를 대조해 정리 · 작성일 2026-11-23 · 주황 칸 = 명부를 보고 직접 기입")

H("명부 목차와 정리 현황", 1)
note("● 정리 완료 · ◐ 일부 · ○ 명부 사진 필요")
table(["번호", "목차", "상태", "비고"], TOC, [1.6, 9, 1.4, 14])

H("요청 항목 점검표", 1)
note("처음 요청한 항목(장비보유·상급종합병원·종합병원·군병원·비급여·병원장/전화·팩스·2026 환자경험평가 대상·담당자 이메일)의 확보 상태")
table(["요청 항목", "상급종합병원 (47)", "종합병원 (385)", f"군병원 ({len(M)})"], REQ, [6, 6.5, 6.5, 6.5])

newpage()
H("1. 2026년도 전국 병원 현황", 1)
note(f"출처: {S['출처']} · {S['기준']}")
rows = [[r[0], r[1], r[2], round(r[2]/r[1])] for r in S["행"]] + [["계", *S["계"], round(S["계"][1]/S["계"][0])]]
table(["구분", "기관수", "병상수", "기관당 평균 병상"], rows, [5, 4, 4, 4], bold_last=True)
si, sb = sum(r[1] for r in S["행"]), sum(r[2] for r in S["행"])
note(f"검산: 기관수 합 {si:,} {'✔ 일치' if si==S['계'][0] else '✘ 불일치'} · 병상수 합 {sb:,} {'✔ 일치' if sb==S['계'][1] else '✘ 불일치'}")

H("2-나. 군병원 현황", 1)
note("군병원은 전국현황 집계(3,425개)에서 제외. 주소·전화 빈 칸은 공개 데이터 미조회 → 명부 확인")
table(["#", "소속", "병원명", "주소", "대표전화", "비고"], [[i+1, *r] for i, r in enumerate(M)], [0.8, 2.6, 3.8, 7, 2.8, 9.5])
doc.add_paragraph()
note("군병원 — 명부 기입란")
table(["병원명", *F], [[r[1], *[""]*len(F)] for r in M], [4, 3, 3, 4, 3, 4, 5], input_from=1)

newpage()
H("7-가. 응급의료병원 현황 (상급종합병원 47곳 기준)", 1)
by = {}
for r in T: by.setdefault(r[4], []).append(r[1])
table(["구분", "수", "병원"], [[k, len(v), ", ".join(v)] for k, v in by.items()], [4, 1.5, 21])

H("7-바. 상급종합병원 현황 (제5기, 2024.1.1~2026.12.31)", 1)
note("보건복지부 지정 47개소 · 대표전화·주소: 응급의료포털 공개 데이터(2026-11-23 조회)")
table(["#", *TH], [[i+1, *r] for i, r in enumerate(T)], [0.8, 2.6, 7.5, 7.5, 3, 4])
newpage()
note("상급종합병원 — 명부 기입란")
table(["병원명", *F], [[r[1], *[""]*len(F)] for r in T], [6, 3, 3, 4, 2.5, 3.5, 4.5], input_from=1)

newpage()
H("환자경험평가 2026", 1)
table(["항목", "내용"], PX, [4, 22.5])
H("명부 사진이 필요한 목차", 2)
for n, t_, s_, _ in TOC:
    if s_ == "○": doc.add_paragraph(f"{n+'. ' if n else ''}{t_}", style="List Bullet")
H("출처", 2)
for s_ in SRC: doc.add_paragraph(s_, style="List Number")
doc.save(os.path.join(OUT, NAME + ".docx"))

# ---------- 단일 HTML (data.js·app.js 인라인) ----------
html = open(os.path.join(HERE, "index.html"), encoding="utf-8").read()
for js in ("data.js", "app.js"):
    html = html.replace(f'<script src="{js}"></script>', "<script>\n" + open(os.path.join(HERE, js), encoding="utf-8").read() + "\n</script>")
open(os.path.join(OUT, NAME + ".html"), "w", encoding="utf-8").write(html)
print("\n".join(sorted(os.listdir(OUT))))
