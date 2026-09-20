# -*- coding: utf-8 -*-
"""
Full Academic System Analysis Report Generator for VinDining System
Produces:
- docs/phase1/03_BAO_CAO_PHAN_TICH.docx
- docs/phase1/BAO_CAO_PHAN_TICH_HE_THONG_VINDINING.docx
- BAO_CAO_PHAN_TICH.docx (Project Root)

Requirements:
1. Chữ đen toàn bộ (Pure black RGBColor(0, 0, 0) for text, headings, tables).
2. Cỡ chữ 14 (14pt) cho nội dung đọc (Body text, paragraphs, bullets, numbered lists).
3. Hạn chế tối đa viết tắt các luận điểm kiểu -a:aA -B:BBB, thay bằng luận điểm hoàn chỉnh -BBB.
4. Đầy đủ 7 Chương, 15 Use Case, 12 Activity Diagrams và 12 Sequence Diagrams nhúng ảnh vẽ từ Draw.io.
"""

import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls, qn

from analysis_report_data import (
    ACTORS_DATA, RBAC_MODULES, USE_CASES_DATA,
    ACTIVITY_DIAGRAMS_DATA, SEQUENCE_DIAGRAMS_DATA,
    BUSINESS_RULES_DATA, RTM_DATA, REFERENCES_DATA
)

COLOR_BLACK = RGBColor(0, 0, 0)
COLOR_MUTED_BLACK = RGBColor(0, 0, 0)
HEX_BLACK = "000000"
HEX_BORDER = "94A3B8"
HEX_HEADER_BG = "E2E8F0"
HEX_CALLOUT_BG = "F8FAFC"
HEX_CALLOUT_BORDER = "475569"
HEX_ROW_ALT = "F8FAFC"

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=70, bottom=70, left=110, right=110):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_outline_level(p, level):
    pPr = p._p.get_or_add_pPr()
    outlineLvl = parse_xml(f'<w:outlineLvl {nsdecls("w")} w:val="{level}"/>')
    pPr.append(outlineLvl)

def set_table_styling(table, col_widths=None, font_size=12.0):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="6" w:space="0" w:color="{HEX_BORDER}"/>'
        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="{HEX_BORDER}"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>'
        f'<w:insideV w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>'
        f'<w:left w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>'
        f'<w:right w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

    if col_widths:
        total_dxa = sum(int(w.inches * 1440) for w in col_widths)
        existing_tblW = tblPr.find(qn('w:tblW'))
        if existing_tblW is not None:
            tblPr.remove(existing_tblW)
        tblW = parse_xml(f'<w:tblW {nsdecls("w")} w:w="{total_dxa}" w:type="dxa"/>')
        tblPr.append(tblW)

        tblGrid = table._tbl.tblGrid
        if tblGrid is not None:
            for c in tblGrid.gridCol_lst:
                tblGrid.remove(c)
            for w in col_widths:
                col_dxa = int(w.inches * 1440)
                gridCol = parse_xml(f'<w:gridCol {nsdecls("w")} w:w="{col_dxa}"/>')
                tblGrid.append(gridCol)

    # Header row
    header_tr = table.rows[0]._tr.get_or_add_trPr()
    header_tr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))

    for r_idx, row in enumerate(table.rows):
        trPr = row._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

        for c_idx, cell in enumerate(row.cells):
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_margins(cell, top=65, bottom=65, left=95, right=95)
            if col_widths and c_idx < len(col_widths):
                cell.width = col_widths[c_idx]
                tcPr = cell._tc.get_or_add_tcPr()
                col_dxa = int(col_widths[c_idx].inches * 1440)
                tcW = parse_xml(f'<w:tcW {nsdecls("w")} w:w="{col_dxa}" w:type="dxa"/>')
                tcPr.append(tcW)

            if r_idx == 0:
                set_cell_background(cell, HEX_HEADER_BG)
                for p in cell.paragraphs:
                    p.paragraph_format.space_before = Pt(3)
                    p.paragraph_format.space_after = Pt(3)
                    p.paragraph_format.line_spacing = 1.15
                    for run in p.runs:
                        run.font.name = "Times New Roman"
                        run.font.bold = True
                        run.font.size = Pt(font_size)
                        run.font.color.rgb = COLOR_BLACK
            else:
                bg = HEX_ROW_ALT if r_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
                for p in cell.paragraphs:
                    p.paragraph_format.space_before = Pt(2.5)
                    p.paragraph_format.space_after = Pt(2.5)
                    p.paragraph_format.line_spacing = 1.15
                    for run in p.runs:
                        run.font.name = "Times New Roman"
                        run.font.size = Pt(font_size)
                        run.font.color.rgb = COLOR_BLACK

def add_header_footer(doc):
    for s_idx, section in enumerate(doc.sections):
        if s_idx == 0:
            section.different_first_page_header_footer = True
            header = section.first_page_header
            footer = section.first_page_footer
            header.is_linked_to_previous = False
            footer.is_linked_to_previous = False
        else:
            sectPr = section._sectPr
            existing_pnt = sectPr.find(qn('w:pgNumType'))
            if existing_pnt is not None:
                sectPr.remove(existing_pnt)
            pgNumType = parse_xml(f'<w:pgNumType {nsdecls("w")} w:start="2"/>')
            sectPr.append(pgNumType)

            header = section.header
            header.is_linked_to_previous = False
            hp = header.paragraphs[0]
            hp.text = ""
            hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            hp.paragraph_format.space_after = Pt(3)
            hrun = hp.add_run("VinDining — Báo cáo Phân tích Yêu cầu & Mô hình hóa Hệ thống")
            hrun.font.name = "Times New Roman"
            hrun.font.italic = True
            hrun.font.size = Pt(9.5)
            hrun.font.color.rgb = COLOR_MUTED_BLACK

            pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="4" w:space="2" w:color="{HEX_BORDER}"/></w:pBdr>')
            hp._element.get_or_add_pPr().append(pBdr)

            footer = section.footer
            footer.is_linked_to_previous = False
            fp = footer.paragraphs[0]
            fp.text = ""
            fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            fp.paragraph_format.space_before = Pt(3)

            frun1 = fp.add_run("Đồ án Chuyên đề Tốt nghiệp — Hệ thống VinDining\t\tTrang ")
            frun1.font.name = "Times New Roman"
            frun1.font.size = Pt(9.5)
            frun1.font.color.rgb = COLOR_MUTED_BLACK

            fld1 = parse_xml(
                f'<w:fldSimple {nsdecls("w")} w:instr="PAGE">'
                f'<w:r>'
                f'<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="{HEX_BLACK}"/><w:sz w:val="19"/></w:rPr>'
                f'<w:t>2</w:t>'
                f'</w:r>'
                f'</w:fldSimple>'
            )
            fp._p.append(fld1)

            frun2 = fp.add_run(" / ")
            frun2.font.name = "Times New Roman"
            frun2.font.size = Pt(9.5)
            frun2.font.color.rgb = COLOR_MUTED_BLACK

            fld2 = parse_xml(
                f'<w:fldSimple {nsdecls("w")} w:instr="NUMPAGES">'
                f'<w:r>'
                f'<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="{HEX_BLACK}"/><w:sz w:val="19"/></w:rPr>'
                f'<w:t>50</w:t>'
                f'</w:r>'
                f'</w:fldSimple>'
            )
            fp._p.append(fld2)

            pBdrF = parse_xml(f'<w:pBdr {nsdecls("w")}><w:top w:val="single" w:sz="4" w:space="2" w:color="{HEX_BORDER}"/></w:pBdr>')
            fp._element.get_or_add_pPr().append(pBdrF)

def add_callout(doc, text_content, border_hex=HEX_CALLOUT_BORDER, bg_hex=HEX_CALLOUT_BG):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False

    tblPr = tbl._tbl.tblPr
    tblW = parse_xml(f'<w:tblW {nsdecls("w")} w:w="9360" w:type="dxa"/>')
    tblPr.append(tblW)

    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_hex}"/>'
        f'<w:top w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    tcPr = cell._tc.get_or_add_tcPr()
    tcW = parse_xml(f'<w:tcW {nsdecls("w")} w:w="9360" w:type="dxa"/>')
    tcPr.append(tcW)

    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=100, bottom=100, left=140, right=140)

    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.25

    r_txt = p.add_run(text_content)
    r_txt.font.name = "Times New Roman"
    r_txt.font.italic = True
    r_txt.font.size = Pt(14)
    r_txt.font.color.rgb = COLOR_BLACK

    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_before = Pt(0)
    p_spacer.paragraph_format.space_after = Pt(3)

def add_figure(doc, img_rel_path, caption_text, base_dir, width_inches=6.0):
    full_path = os.path.normpath(os.path.join(base_dir, img_rel_path))
    if os.path.exists(full_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(2)
        run = p_img.add_run()
        run.add_picture(full_path, width=Inches(width_inches))

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(6)
        rcap = p_cap.add_run(caption_text)
        rcap.font.name = "Times New Roman"
        rcap.font.italic = True
        rcap.font.size = Pt(12.5)
        rcap.font.color.rgb = COLOR_BLACK

def add_p(doc, text, bold_prefix="", space_after=4.5, line_spacing=1.25, indent_inches=0.0):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    if indent_inches > 0:
        p.paragraph_format.left_indent = Inches(indent_inches)

    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Times New Roman"
        r_pre.font.bold = True
        r_pre.font.size = Pt(14)
        r_pre.font.color.rgb = COLOR_BLACK

    r_body = p.add_run(text)
    r_body.font.name = "Times New Roman"
    r_body.font.size = Pt(14)
    r_body.font.color.rgb = COLOR_BLACK
    return p

def add_bullet(doc, text, bold_prefix="", level=0):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3.5)
    p.paragraph_format.line_spacing = 1.25
    p.paragraph_format.left_indent = Inches(0.25 * (level + 1))

    bullet_char = "•  " if level == 0 else "–  "
    r_bullet = p.add_run(bullet_char)
    r_bullet.font.name = "Times New Roman"
    r_bullet.font.bold = True
    r_bullet.font.size = Pt(14)
    r_bullet.font.color.rgb = COLOR_BLACK

    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Times New Roman"
        r_pre.font.bold = True
        r_pre.font.size = Pt(14)
        r_pre.font.color.rgb = COLOR_BLACK

    r_body = p.add_run(text)
    r_body.font.name = "Times New Roman"
    r_body.font.size = Pt(14)
    r_body.font.color.rgb = COLOR_BLACK
    return p

def add_numbered(doc, number_str, text, bold_prefix=""):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3.5)
    p.paragraph_format.line_spacing = 1.25
    p.paragraph_format.left_indent = Inches(0.25)

    r_num = p.add_run(f"{number_str}.  ")
    r_num.font.name = "Times New Roman"
    r_num.font.bold = True
    r_num.font.size = Pt(14)
    r_num.font.color.rgb = COLOR_BLACK

    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Times New Roman"
        r_pre.font.bold = True
        r_pre.font.size = Pt(14)
        r_pre.font.color.rgb = COLOR_BLACK

    r_body = p.add_run(text)
    r_body.font.name = "Times New Roman"
    r_body.font.size = Pt(14)
    r_body.font.color.rgb = COLOR_BLACK
    return p

def add_h1(doc, title_text):
    p = doc.add_paragraph(style='Heading 1')
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    set_outline_level(p, 0)
    p.text = ""
    r = p.add_run(title_text)
    r.font.name = "Times New Roman"
    r.font.bold = True
    r.font.size = Pt(17)
    r.font.color.rgb = COLOR_BLACK

    pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="8" w:space="2" w:color="{HEX_BLACK}"/></w:pBdr>')
    p._element.get_or_add_pPr().append(pBdr)
    return p

def add_h2(doc, title_text):
    p = doc.add_paragraph(style='Heading 2')
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    set_outline_level(p, 1)
    p.text = ""
    r = p.add_run(title_text)
    r.font.name = "Times New Roman"
    r.font.bold = True
    r.font.size = Pt(15.5)
    r.font.color.rgb = COLOR_BLACK
    return p

def add_h3(doc, title_text):
    p = doc.add_paragraph(style='Heading 3')
    p.paragraph_format.space_before = Pt(9)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    set_outline_level(p, 2)
    p.text = ""
    r = p.add_run(title_text)
    r.font.name = "Times New Roman"
    r.font.bold = True
    r.font.size = Pt(14.5)
    r.font.color.rgb = COLOR_BLACK
    return p

def add_h4(doc, title_text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(7)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    set_outline_level(p, 3)
    r = p.add_run(title_text)
    r.font.name = "Times New Roman"
    r.font.bold = True
    r.font.size = Pt(14)
    r.font.color.rgb = COLOR_BLACK
    return p

def add_use_case_spec_table(doc, spec_dict):
    rows_data = [
        ("Mã Use Case", spec_dict.get("id", "")),
        ("Tên Use Case", spec_dict.get("name", "")),
        ("Tác nhân tham gia", spec_dict.get("actors", "")),
        ("Mức độ ưu tiên", spec_dict.get("priority", "")),
        ("Mối quan hệ", spec_dict.get("relations", "")),
        ("Mục tiêu chức năng", spec_dict.get("objective", "")),
        ("Điều kiện tiên quyết", spec_dict.get("preconditions", "")),
        ("Điều kiện kết thúc", spec_dict.get("postconditions", ""))
    ]

    table = doc.add_table(rows=len(rows_data), cols=2)
    col_widths = [Inches(1.8), Inches(4.7)]
    set_table_styling(table, col_widths, font_size=12.5)

    for r_idx, (attr, val) in enumerate(rows_data):
        cell0 = table.cell(r_idx, 0)
        cell0.text = ""
        p0 = cell0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(2.5)
        p0.paragraph_format.space_after = Pt(2.5)
        p0.paragraph_format.line_spacing = 1.15
        r0 = p0.add_run(attr)
        r0.font.name = "Times New Roman"
        r0.font.bold = True
        r0.font.size = Pt(12.5)
        r0.font.color.rgb = COLOR_BLACK
        set_cell_background(cell0, HEX_HEADER_BG)

        cell1 = table.cell(r_idx, 1)
        cell1.text = ""
        p1 = cell1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p1.paragraph_format.space_before = Pt(2.5)
        p1.paragraph_format.space_after = Pt(2.5)
        p1.paragraph_format.line_spacing = 1.15
        r1 = p1.add_run(val)
        r1.font.name = "Times New Roman"
        r1.font.size = Pt(12.5)
        r1.font.color.rgb = COLOR_BLACK
        set_cell_background(cell1, "FFFFFF")

    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_after = Pt(4)

def add_toc_entry(doc, title, page_num, level=1):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.2
    
    if level == 1:
        p.paragraph_format.left_indent = Inches(0.0)
    elif level == 2:
        p.paragraph_format.left_indent = Inches(0.2)
    else:
        p.paragraph_format.left_indent = Inches(0.4)
        
    pPr = p._p.get_or_add_pPr()
    tabs = parse_xml(
        f'<w:tabs {nsdecls("w")}>'
        f'<w:tab w:val="right" w:leader="dot" w:pos="9360"/>'
        f'</w:tabs>'
    )
    pPr.append(tabs)
    
    r_title = p.add_run(title)
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(12.5 if level > 1 else 13.5)
    r_title.font.bold = (level == 1)
    r_title.font.color.rgb = COLOR_BLACK
    
    r_tab = p.add_run("\t")
    r_tab.font.name = "Times New Roman"
    
    r_page = p.add_run(str(page_num))
    r_page.font.name = "Times New Roman"
    r_page.font.bold = (level == 1)
    r_page.font.size = Pt(12.5 if level > 1 else 13.5)
    r_page.font.color.rgb = COLOR_BLACK

# =============================================================================
# BUILDERS FOR INDIVIDUAL CHAPTERS
# =============================================================================

def build_cover_page(doc):
    p_univ = doc.add_paragraph()
    p_univ.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_univ.paragraph_format.space_before = Pt(16)
    p_univ.paragraph_format.space_after = Pt(2)
    run_u1 = p_univ.add_run("BỘ GIÁO DỤC VÀ ĐÀO TẠO — HỆ THỐNG ĐÀO TẠO CÔNG NGHỆ\n")
    run_u1.font.name = "Times New Roman"
    run_u1.font.size = Pt(12)
    run_u1.font.bold = True
    run_u1.font.color.rgb = COLOR_BLACK
    run_u2 = p_univ.add_run("KHOA CÔNG NGHỆ THÔNG TIN — BỘ MÔN KỸ THUẬT PHẦN MỀM")
    run_u2.font.name = "Times New Roman"
    run_u2.font.size = Pt(12)
    run_u2.font.bold = True
    run_u2.font.color.rgb = COLOR_BLACK

    p_line = doc.add_paragraph()
    p_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_line.paragraph_format.space_before = Pt(4)
    p_line.paragraph_format.space_after = Pt(28)
    r_line = p_line.add_run("―" * 28)
    r_line.font.name = "Times New Roman"
    r_line.font.bold = True
    r_line.font.color.rgb = COLOR_BLACK

    p_type = doc.add_paragraph()
    p_type.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_type.paragraph_format.space_before = Pt(10)
    p_type.paragraph_format.space_after = Pt(6)
    run_type = p_type.add_run("BÁO CÁO PHÂN TÍCH YÊU CẦU & MÔ HÌNH HÓA HỆ THỐNG")
    run_type.font.name = "Times New Roman"
    run_type.font.size = Pt(18)
    run_type.font.bold = True
    run_type.font.color.rgb = COLOR_BLACK

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(2)
    p_sub.paragraph_format.space_after = Pt(26)
    run_sub = p_sub.add_run("SYSTEM REQUIREMENTS ANALYSIS & MODELING REPORT")
    run_sub.font.name = "Times New Roman"
    run_sub.font.size = Pt(12)
    run_sub.font.italic = True
    run_sub.font.color.rgb = COLOR_MUTED_BLACK

    # Hộp thông tin đề tài
    tbl_topic = doc.add_table(rows=1, cols=1)
    tbl_topic.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_topic.autofit = False
    col_w = [Inches(6.2)]
    set_table_styling(tbl_topic, col_w)
    c_topic = tbl_topic.cell(0, 0)
    set_cell_background(c_topic, HEX_CALLOUT_BG)
    set_cell_margins(c_topic, top=140, bottom=140, left=160, right=160)
    p_topic = c_topic.paragraphs[0]
    p_topic.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_topic.paragraph_format.space_before = Pt(4)
    p_topic.paragraph_format.space_after = Pt(4)
    r_topic1 = p_topic.add_run("ĐỀ TÀI DỰ ÁN:\n")
    r_topic1.font.name = "Times New Roman"
    r_topic1.font.size = Pt(13)
    r_topic1.font.bold = True
    r_topic1.font.color.rgb = COLOR_BLACK
    r_topic2 = p_topic.add_run("VINDINING — HỆ THỐNG QUẢN LÝ VÀ ĐẶT BÀN\nNHÀ HÀNG FINE DINING CAO CẤP")
    r_topic2.font.name = "Times New Roman"
    r_topic2.font.size = Pt(16)
    r_topic2.font.bold = True
    r_topic2.font.color.rgb = COLOR_BLACK

    # Khoảng cách
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(20)
    p_sp.paragraph_format.space_after = Pt(10)

    # Thông tin giảng viên & sinh viên
    tbl_info = doc.add_table(rows=5, cols=2)
    tbl_info.alignment = WD_TABLE_ALIGNMENT.CENTER
    info_widths = [Inches(2.4), Inches(3.8)]
    set_table_styling(tbl_info, info_widths, font_size=12.5)

    info_data = [
        ("Giảng viên hướng dẫn:", "ThS. Phạm Hữu Tùng"),
        ("Sinh viên thực hiện 1:", "Nguyễn Mạnh Quyền"),
        ("Sinh viên thực hiện 2:", "Đặng Quốc Khánh"),
        ("Sinh viên thực hiện 3:", "Nguyễn Hoàng Đạt"),
        ("Giai đoạn đồ án:", "Phase 1: Phân tích Yêu cầu & Thiết kế Hệ thống")
    ]
    for r_idx, (k, v) in enumerate(info_data):
        c0 = tbl_info.cell(r_idx, 0)
        c0.text = ""
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(3)
        p0.paragraph_format.space_after = Pt(3)
        r0 = p0.add_run(k)
        r0.font.name = "Times New Roman"
        r0.font.bold = True
        r0.font.size = Pt(12.5)
        r0.font.color.rgb = COLOR_BLACK
        set_cell_background(c0, "FFFFFF")

        c1 = tbl_info.cell(r_idx, 1)
        c1.text = ""
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(3)
        p1.paragraph_format.space_after = Pt(3)
        r1 = p1.add_run(v)
        r1.font.name = "Times New Roman"
        r1.font.size = Pt(12.5)
        r1.font.color.rgb = COLOR_BLACK
        set_cell_background(c1, "FFFFFF")

    p_loc = doc.add_paragraph()
    p_loc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_loc.paragraph_format.space_before = Pt(40)
    p_loc.paragraph_format.space_after = Pt(0)
    r_loc = p_loc.add_run("THÀNH PHỐ HỒ CHÍ MINH — NĂM 2026")
    r_loc.font.name = "Times New Roman"
    r_loc.font.bold = True
    r_loc.font.size = Pt(12)
    r_loc.font.color.rgb = COLOR_BLACK

    doc.add_page_break()

def build_table_of_contents(doc):
    p_toc = doc.add_paragraph()
    p_toc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_toc.paragraph_format.space_before = Pt(8)
    p_toc.paragraph_format.space_after = Pt(16)
    r_toc = p_toc.add_run("MỤC LỤC BÁO CÁO PHÂN TÍCH HỆ THỐNG")
    r_toc.font.name = "Times New Roman"
    r_toc.font.bold = True
    r_toc.font.size = Pt(16)
    r_toc.font.color.rgb = COLOR_BLACK

    add_toc_entry(doc, "CHƯƠNG 1: TỔNG QUAN TÁC NHÂN & MA TRẬN PHÂN QUYỀN (STAKEHOLDER & RBAC)", 3, 1)
    add_toc_entry(doc, "1.1 Danh mục Tác nhân Hệ thống (System Actors)", 3, 2)
    add_toc_entry(doc, "1.2 Ma trận Phân quyền Chức năng (Role-Based Access Control - RBAC)", 4, 2)

    add_toc_entry(doc, "CHƯƠNG 2: MÔ HÌNH HÓA USE CASE (USE CASE MODELING)", 6, 1)
    add_toc_entry(doc, "2.1 Sơ đồ Use Case tổng quát toàn hệ thống (Overall Use Case Diagram)", 6, 2)
    add_toc_entry(doc, "2.2 Sơ đồ Use Case phân rã theo Phân hệ (Subsystem Use Case Diagrams)", 7, 2)
    add_toc_entry(doc, "2.3 Đặc tả chi tiết 15 Use Case hệ thống (Use Case Specifications)", 8, 2)
    add_toc_entry(doc, "2.3.1 Nhóm Use Case Khách hàng (UC-U1 đến UC-U4)", 8, 3)
    add_toc_entry(doc, "2.3.2 Nhóm Use Case Nhân viên Nội bộ (UC-E1 đến UC-E5)", 13, 3)
    add_toc_entry(doc, "2.3.3 Nhóm Use Case Quản trị & Quản lý (UC-A1 đến UC-A5)", 19, 3)
    add_toc_entry(doc, "2.3.4 Nhóm Use Case Hệ thống Tự động (UC-S1)", 25, 3)

    add_toc_entry(doc, "CHƯƠNG 3: MÔ HÌNH HÓA QUY TRÌNH NGHIỆP VỤ (SWIMLANE ACTIVITY DIAGRAMS)", 27, 1)
    for i in range(1, 13):
        title = ACTIVITY_DIAGRAMS_DATA[i-1]["title"]
        add_toc_entry(doc, f"3.{i} AD-{i:02d}: {title}", 27 + (i - 1) * 2, 2)

    add_toc_entry(doc, "CHƯƠNG 4: MÔ HÌNH HÓA TƯƠNG TÁC HỆ THỐNG (SEQUENCE DIAGRAMS)", 40, 1)
    for i in range(1, 13):
        title = SEQUENCE_DIAGRAMS_DATA[i-1]["title"]
        add_toc_entry(doc, f"4.{i} SD-{i:02d}: {title}", 40 + (i - 1) * 2, 2)

    add_toc_entry(doc, "CHƯƠNG 5: QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES MATRIX)", 53, 1)
    add_toc_entry(doc, "CHƯƠNG 6: MA TRẬN TRUY XUẤT NGUỒN GỐC YÊU CẦU (RTM MATRIX)", 55, 1)
    add_toc_entry(doc, "CHƯƠNG 7: DANH MỤC TÀI LIỆU THAM KHẢO (REFERENCES)", 57, 1)

    doc.add_page_break()

def build_chapter_1(doc):
    add_h1(doc, "CHƯƠNG 1: TỔNG QUAN TÁC NHÂN & MA TRẬN PHÂN QUYỀN (STAKEHOLDER & RBAC)")
    add_p(doc, "Chương này xác lập bức tranh tổng thể về toàn bộ các bên liên quan và tác nhân tương tác trực tiếp hoặc gián tiếp với hệ thống quản lý nhà hàng VinDining. Trên cơ sở đó, hệ thống xây dựng mô hình kiểm soát truy cập dựa trên vai trò (Role-Based Access Control - RBAC) nhằm bảo đảm tính toàn vẹn dữ liệu và phân tách trách nhiệm nghiệp vụ rõ ràng giữa từng bộ phận vận hành.")

    add_h2(doc, "1.1 Danh mục Tác nhân Hệ thống (System Actors)")
    add_p(doc, "Hệ thống phân định 5 tác nhân chính thuộc nhóm người dùng trực tiếp và 2 tác nhân phụ đóng vai trò là các hệ thống dịch vụ tích hợp bên ngoài:")

    table = doc.add_table(rows=len(ACTORS_DATA) + 1, cols=5)
    col_widths = [Inches(1.2), Inches(0.9), Inches(1.1), Inches(2.0), Inches(1.3)]
    set_table_styling(table, col_widths, font_size=11.0)

    headers = ["Tác nhân (Actor)", "Phân loại", "Thiết bị / Nền tảng", "Phạm vi quyền hạn", "Mục tiêu cốt lõi"]
    for c_idx, h in enumerate(headers):
        cell = table.cell(0, c_idx)
        cell.text = ""
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(h)
        r.font.name = "Times New Roman"
        r.font.bold = True
        r.font.size = Pt(11.0)
        r.font.color.rgb = COLOR_BLACK

    for r_idx, row in enumerate(ACTORS_DATA):
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx + 1, c_idx)
            cell.text = ""
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2.5)
            p.paragraph_format.space_after = Pt(2.5)
            p.paragraph_format.line_spacing = 1.15
            if c_idx in [0, 1, 2]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            r = p.add_run(val)
            r.font.name = "Times New Roman"
            if c_idx == 0:
                r.font.bold = True
            r.font.size = Pt(11.0)
            r.font.color.rgb = COLOR_BLACK

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_after = Pt(4)

    # Callout Ranh giới nghiệp vụ nhà bếp
    add_callout(
        doc,
        "Lưu ý kiến trúc về ranh giới nghiệp vụ Nhà bếp: Trong mô hình vận hành tiêu chuẩn của VinDining, bộ phận Nhà bếp và Đầu bếp hoàn toàn không tương tác cảm ứng vật lý với màn hình phần mềm để đảm bảo vệ sinh an toàn thực phẩm. Toàn bộ thông tin chế biến được tiếp nhận rảnh tay (Hands-free) thông qua hệ thống Màn hình KDS Bếp (Kitchen Display System) gắn tường tại các trạm bếp, hiển thị vé điện tử thời gian thực qua SignalR kèm đồng hồ đếm ngược SLA và cảnh báo dị ứng bôi đậm. Khi món ăn hoàn thành, đầu bếp đặt đĩa món ra quầy chuyển món Pass để Nhân viên Điều phối (Expediter) kiểm tra chất lượng và bấm xác nhận hoàn thành món (Served) trên máy tính bảng tại quầy Pass."
    )

    add_h2(doc, "1.2 Ma trận Phân quyền Chức năng (Role-Based Access Control - RBAC)")
    add_p(doc, "Ma trận phân quyền chi tiết thiết lập ranh giới thẩm quyền nghiêm ngặt giữa Khách hàng, Nhân viên Phục vụ, Quản lý Nhà hàng và Quản trị viên hệ thống:")

    total_rows = sum(len(m["features"]) for m in RBAC_MODULES) + 1
    table_rbac = doc.add_table(rows=total_rows, cols=6)
    col_w = [Inches(1.5), Inches(2.4), Inches(0.65), Inches(0.65), Inches(0.65), Inches(0.65)]
    set_table_styling(table_rbac, col_w, font_size=11.5)

    headers_rbac = ["Phân hệ chức năng", "Chức năng chi tiết", "Khách hàng", "Phục vụ", "Quản lý", "Quản trị"]
    for c_idx, h in enumerate(headers_rbac):
        cell = table_rbac.cell(0, c_idx)
        cell.text = ""
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(h)
        r.font.name = "Times New Roman"
        r.font.bold = True
        r.font.size = Pt(11.5)
        r.font.color.rgb = COLOR_BLACK

    curr_row = 1
    for mod in RBAC_MODULES:
        mod_name = mod["module"]
        for f_idx, (f_name, perms) in enumerate(mod["features"]):
            cell0 = table_rbac.cell(curr_row, 0)
            cell0.text = ""
            p0 = cell0.paragraphs[0]
            p0.paragraph_format.space_before = Pt(2.5)
            p0.paragraph_format.space_after = Pt(2.5)
            if f_idx == 0:
                r0 = p0.add_run(mod_name)
                r0.font.name = "Times New Roman"
                r0.font.bold = True
                r0.font.size = Pt(11.5)
                r0.font.color.rgb = COLOR_BLACK

            cell1 = table_rbac.cell(curr_row, 1)
            cell1.text = ""
            p1 = cell1.paragraphs[0]
            p1.paragraph_format.space_before = Pt(2.5)
            p1.paragraph_format.space_after = Pt(2.5)
            p1.paragraph_format.line_spacing = 1.15
            r1 = p1.add_run(f_name)
            r1.font.name = "Times New Roman"
            r1.font.size = Pt(11.5)
            r1.font.color.rgb = COLOR_BLACK

            for p_idx, perm_val in enumerate(perms):
                cell_p = table_rbac.cell(curr_row, 2 + p_idx)
                cell_p.text = ""
                pp = cell_p.paragraphs[0]
                pp.alignment = WD_ALIGN_PARAGRAPH.CENTER
                pp.paragraph_format.space_before = Pt(2.5)
                pp.paragraph_format.space_after = Pt(2.5)
                rp = pp.add_run(perm_val)
                rp.font.name = "Times New Roman"
                if perm_val in ["✓", "Expediter: ✓"]:
                    rp.font.bold = True
                rp.font.size = Pt(11.5)
                rp.font.color.rgb = COLOR_BLACK

            curr_row += 1

    p_sp2 = doc.add_paragraph()
    p_sp2.paragraph_format.space_after = Pt(6)
    doc.add_page_break()

def build_chapter_2(doc, base_dir):
    add_h1(doc, "CHƯƠNG 2: MÔ HÌNH HÓA USE CASE (USE CASE MODELING)")
    add_p(doc, "Mô hình hóa Use Case đóng vai trò xác định rõ ràng ranh giới phạm vi hệ thống, các luồng tương tác giữa tác nhân và hệ thống, cùng các ràng buộc nghiệp vụ kèm theo. Tài liệu phân tích chia tách cấu trúc Use Case thành 4 phân hệ độc lập: Phân hệ Khách hàng (User), Phân hệ Nhân viên Nội bộ (Employee), Phân hệ Quản trị & Quản lý (Admin & Manager) và Phân hệ Dịch vụ Hệ thống Tự động (System Services).")

    add_h2(doc, "2.1 Sơ đồ Use Case tổng quát toàn hệ thống (Overall Use Case Diagram)")
    add_p(doc, "Sơ đồ Use Case tổng quát trực quan hóa toàn bộ 15 trường hợp sử dụng trọng yếu trong không gian hoạt động của VinDining, đồng thời chỉ ra các mối liên kết với các hệ thống dịch vụ ngoại vi:")

    add_figure(doc, "drawio/use_case_overall.png", "Hình 2.1: Sơ đồ Use Case tổng quát toàn hệ thống VinDining", base_dir, width_inches=6.0)

    add_p(doc, "Diễn giải kiến trúc sơ đồ Use Case tổng quát:")
    add_bullet(doc, "Ranh giới hệ thống phân chia rõ ràng 4 nhóm chức năng cốt lõi, trong đó các trường hợp sử dụng của nhân viên nội bộ đều bao gồm quan hệ xác thực tập trung thông qua Use Case Đăng nhập hệ thống.")
    add_bullet(doc, "Hệ thống tích hợp trực tiếp với Cổng thanh toán trực tuyến VNPAY để xử lý giao dịch cọc và hoàn cọc tự động, cùng kết nối mạng thời gian thực SignalR tới hệ thống Màn hình KDS Bếp để điều phối vé gọi món điện tử rảnh tay.")
    add_bullet(doc, "Tác vụ chạy ngầm định kỳ được thiết kế như một tác nhân tự động mở rộng từ chức năng đặt bàn để bảo đảm tính sẵn sàng của tài nguyên bàn ăn khi quá hạn giữ chỗ.")

    add_h2(doc, "2.2 Sơ đồ Use Case phân rã theo Phân hệ")
    add_p(doc, "Sơ đồ phân rã chi tiết thể hiện các mối quan hệ phụ thuộc gồm quan hệ bao hàm (<<include>>) và quan hệ mở rộng (<<extend>>) giữa từng Use Case cụ thể trong từng phân hệ chức năng:")

    add_figure(doc, "drawio/use_case_subsystems.png", "Hình 2.2: Sơ đồ Use Case phân rã chi tiết theo từng phân hệ chức năng", base_dir, width_inches=6.0)

    add_p(doc, "Quy ước mã định danh và phân nhóm Use Case:")
    add_bullet(doc, "Nhóm chức năng dành cho Khách hàng phục vụ các trải nghiệm trực tiếp của thực khách trên thiết bị di động cá nhân và màn hình hiển thị tại bàn ăn.")
    add_bullet(doc, "Nhóm chức năng dành cho Nhân viên hỗ trợ các thao tác nghiệp vụ tại bàn, quầy điều phối món và quy trình thanh toán của đội ngũ phục vụ.")
    add_bullet(doc, "Nhóm chức năng Quản lý và Quản trị cung cấp công cụ quản trị danh mục thực đơn, cấu hình sơ đồ bàn ăn, duyệt xử lý hoàn cọc và theo dõi báo cáo thống kê.")
    add_bullet(doc, "Nhóm dịch vụ Hệ thống tự động đảm nhiệm các tác vụ chạy ngầm định kỳ nhằm giải phóng tài nguyên bàn ăn hết hạn giữ cọc và đồng bộ dữ liệu thời gian thực.")

    add_h2(doc, "2.3 Đặc tả chi tiết 15 Use Case hệ thống (Use Case Specifications)")
    add_p(doc, "Phần này cung cấp bảng đặc tả chuẩn kỹ thuật phần mềm cho toàn bộ 15 Use Case của dự án, bao gồm bảng thuộc tính, luồng sự kiện chính và các luồng xử lý ngoại lệ theo đúng nguyên tắc không sử dụng các tiền tố viết tắt.")

    current_subsystem = None
    for uc in USE_CASES_DATA:
        sub = uc["subsystem"]
        if sub != current_subsystem:
            current_subsystem = sub
            add_h3(doc, f"2.3.{['Khách hàng', 'Nhân viên Nội bộ', 'Quản lý & Quản trị', 'Hệ thống Tự động'].index(sub) + 1} Phân hệ {sub}")

        add_h4(doc, f"Đặc tả {uc['id']}: {uc['name']}")
        add_use_case_spec_table(doc, uc)

        add_p(doc, "Luồng sự kiện chính tuần tự:", bold_prefix="• ")
        for s_idx, step in enumerate(uc["basic_flow"]):
            add_numbered(doc, str(s_idx + 1), step)

        add_p(doc, "Các luồng sự kiện phụ và xử lý tình huống ngoại lệ:", bold_prefix="• ")
        for alt in uc["alt_flow"]:
            add_bullet(doc, alt)

        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_after = Pt(6)

    doc.add_page_break()

def build_chapter_3(doc, base_dir):
    add_h1(doc, "CHƯƠNG 3: MÔ HÌNH HÓA QUY TRÌNH NGHIỆP VỤ (SWIMLANE ACTIVITY DIAGRAMS)")
    add_p(doc, "Chương này mô hình hóa chi tiết 12 quy trình nghiệp vụ trọng yếu của hệ thống VinDining thông qua sơ đồ hoạt động phân làn (Swimlane Activity Diagrams). Mô hình phân làn giúp phân định tuyệt đối ranh giới trách nhiệm và chuỗi tương tác phối hợp tuần tự giữa Khách hàng, Nhân viên Phục vụ, Điều phối viên, Quản lý, Nhà bếp cùng các dịch vụ kỹ thuật hạ tầng.")

    for ad in ACTIVITY_DIAGRAMS_DATA:
        add_h2(doc, f"3.{int(ad['id'].split('-')[1])} {ad['id']}: {ad['title']}")
        add_p(doc, f"Phân làn trách nhiệm tham gia: {ad['lanes']}", bold_prefix="• ")

        add_figure(doc, f"drawio/{ad['img']}", f"Hình 3.{int(ad['id'].split('-')[1])}: Sơ đồ hoạt động {ad['title']}", base_dir, width_inches=6.0)

        add_p(doc, "Diễn giải các bước thực thi chi tiết trong quy trình:")
        for step in ad["desc"]:
            add_bullet(doc, step)

        p_sp = doc.add_paragraph()
        p_sp.paragraph_format.space_after = Pt(6)

    doc.add_page_break()

def build_chapter_4(doc, base_dir):
    add_h1(doc, "CHƯƠNG 4: MÔ HÌNH HÓA TƯƠNG TÁC HỆ THỐNG (SEQUENCE DIAGRAMS)")
    add_p(doc, "Chương này trình bày 12 sơ đồ tuần tự (Sequence Diagrams) thể hiện chuỗi trao đổi thông điệp theo trục thời gian giữa các thành phần kiến trúc Clean Architecture: Tác nhân người dùng, Lớp trình diễn (Frontend SPA / Web POS), Bộ điều khiển tiếp nhận (API Controller), Trạm điều phối trung gian (MediatR Handler), Thực thể nghiệp vụ miền (Domain Entities) và Cơ sở dữ liệu.")

    for sd in SEQUENCE_DIAGRAMS_DATA:
        add_h2(doc, f"4.{int(sd['id'].split('-')[1])} {sd['id']}: {sd['title']}")
        add_p(doc, f"Các thành phần tham gia tương tác: {sd.get('lifelines', sd.get('lanes', ''))}", bold_prefix="• ")

        add_figure(doc, f"drawio/{sd['img']}", f"Hình 4.{int(sd['id'].split('-')[1])}: Sơ đồ tuần tự {sd['title']}", base_dir, width_inches=6.0)

        add_p(doc, "Diễn giải chuỗi thông điệp và cơ chế bảo đảm an toàn dữ liệu:")
        for step in sd["desc"]:
            add_bullet(doc, step)

        p_sp = doc.add_paragraph()
        p_sp.paragraph_format.space_after = Pt(6)

    doc.add_page_break()

def build_chapter_5(doc):
    add_h1(doc, "CHƯƠNG 5: QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES MATRIX)")
    add_p(doc, "Các quy tắc nghiệp vụ cốt lõi (Core Business Rules) đóng vai trò định hình logic vận hành và được đóng gói trực tiếp bên trong các thực thể nghiệp vụ tầng Domain. Điều này bảo đảm các quy tắc tài chính, thời gian khóa giữ chỗ và quyền hạn xác nhận món ăn không bị phá vỡ bởi bất kỳ thay đổi nào từ tầng giao diện hay cơ sở dữ liệu.")

    table = doc.add_table(rows=len(BUSINESS_RULES_DATA) + 1, cols=4)
    col_w = [Inches(1.0), Inches(1.6), Inches(2.7), Inches(1.2)]
    set_table_styling(table, col_w, font_size=11.5)

    headers = ["Mã quy tắc", "Tên quy tắc", "Nội dung logic nghiệp vụ bắt buộc", "Tầng kiểm soát"]
    for c_idx, h in enumerate(headers):
        cell = table.cell(0, c_idx)
        cell.text = ""
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(h)
        r.font.name = "Times New Roman"
        r.font.bold = True
        r.font.size = Pt(11.5)
        r.font.color.rgb = COLOR_BLACK

    for r_idx, row in enumerate(BUSINESS_RULES_DATA):
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx + 1, c_idx)
            cell.text = ""
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2.5)
            p.paragraph_format.space_after = Pt(2.5)
            p.paragraph_format.line_spacing = 1.15
            if c_idx in [0, 1, 3]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            r = p.add_run(val)
            r.font.name = "Times New Roman"
            if c_idx == 0:
                r.font.bold = True
            r.font.size = Pt(11.5)
            r.font.color.rgb = COLOR_BLACK

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_after = Pt(6)

    add_h2(doc, "Phân tích chuyên sâu về Công thức Tài chính Hóa đơn")
    add_p(doc, "Công thức tính toán tài chính của VinDining tuân thủ nguyên tắc tính toán tuần tự nghiêm ngặt nhằm tránh các sai lệch về thuế suất và bảo toàn quyền lợi của nhà hàng:")
    add_bullet(doc, "Tổng tiền món ăn thực tế được tính bằng tổng đơn giá nhân số lượng của tất cả các món ăn đã được xác nhận phục vụ hoàn tất.")
    add_bullet(doc, "Phí phục vụ tiêu chuẩn nhà hàng cao cấp được ấn định mức 5% trên tổng tiền món ăn thực tế.")
    add_bullet(doc, "Thuế giá trị gia tăng VAT được tính mức 10% áp dụng trên tổng chi phí bao gồm cả tiền món ăn và phí phục vụ theo đúng quy định hiện hành.")
    add_bullet(doc, "Khoản tiền cọc đã thanh toán được khấu trừ trực tiếp vào tổng chi phí sau thuế, trong đó số tiền phải thu cuối cùng có cận dưới bằng 0 đồng để thực thi chính sách tiền cọc đóng vai trò là mức chi tiêu tối thiểu không hoàn lại.")

    doc.add_page_break()

def build_chapter_6(doc):
    add_h1(doc, "CHƯƠNG 6: MA TRẬN TRUY XUẤT NGUỒN GỐC YÊU CẦU (RTM MATRIX)")
    add_p(doc, "Ma trận truy xuất nguồn gốc yêu cầu (Requirements Traceability Matrix - RTM) bảo đảm tính nhất quán hai chiều, kết nối xuyên suốt từ yêu cầu nghiệp vụ cấp cao (REQ) tới các trường hợp sử dụng (Use Case), quy trình hoạt động (Activity Diagram), tương tác hệ thống (Sequence Diagram), quy tắc nghiệp vụ (Business Rules) và các kịch bản kiểm thử (Test Cases).")

    table = doc.add_table(rows=len(RTM_DATA) + 1, cols=7)
    col_w = [Inches(0.7), Inches(1.8), Inches(0.7), Inches(0.7), Inches(0.7), Inches(0.9), Inches(1.0)]
    set_table_styling(table, col_w, font_size=10.5)

    headers = ["Mã Y/C", "Tên yêu cầu nghiệp vụ", "Use Case", "Activity", "Sequence", "Quy tắc", "Test Case"]
    for c_idx, h in enumerate(headers):
        cell = table.cell(0, c_idx)
        cell.text = ""
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(h)
        r.font.name = "Times New Roman"
        r.font.bold = True
        r.font.size = Pt(10.5)
        r.font.color.rgb = COLOR_BLACK

    for r_idx, row in enumerate(RTM_DATA):
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx + 1, c_idx)
            cell.text = ""
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            if c_idx in [0, 2, 3, 4, 5, 6]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            r.font.name = "Times New Roman"
            if c_idx == 0:
                r.font.bold = True
            r.font.size = Pt(10.5)
            r.font.color.rgb = COLOR_BLACK

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_after = Pt(6)
    doc.add_page_break()

def build_chapter_7(doc):
    add_h1(doc, "CHƯƠNG 7: DANH MỤC TÀI LIỆU THAM KHẢO (REFERENCES)")
    add_p(doc, "Tài liệu phân tích hệ thống được nghiên cứu và xây dựng dựa trên các tài liệu quy chuẩn kỹ thuật phần mềm, các mô hình thiết kế doanh nghiệp kinh điển cùng thông số kỹ thuật chính thức từ các nhà cung cấp giải pháp đối tác:")

    for idx, (author, ref_title) in enumerate(REFERENCES_DATA):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4.5)
        p.paragraph_format.line_spacing = 1.25
        p.paragraph_format.left_indent = Inches(0.3)

        r_num = p.add_run(f"[{idx + 1}]  ")
        r_num.font.name = "Times New Roman"
        r_num.font.bold = True
        r_num.font.size = Pt(14)
        r_num.font.color.rgb = COLOR_BLACK

        r_author = p.add_run(f"{author}, ")
        r_author.font.name = "Times New Roman"
        r_author.font.bold = True
        r_author.font.size = Pt(14)
        r_author.font.color.rgb = COLOR_BLACK

        r_title = p.add_run(ref_title)
        r_title.font.name = "Times New Roman"
        r_title.font.size = Pt(14)
        r_title.font.color.rgb = COLOR_BLACK

# =============================================================================
# MAIN EXPORT ORCHESTRATOR
# =============================================================================

def generate_report():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = script_dir
    project_root = os.path.normpath(os.path.join(script_dir, "..", ".."))

    out_docx_phase1 = os.path.join(script_dir, "03_BAO_CAO_PHAN_TICH.docx")
    out_docx_full_name = os.path.join(script_dir, "BAO_CAO_PHAN_TICH_HE_THONG_VINDINING.docx")
    out_docx_root = os.path.join(project_root, "BAO_CAO_PHAN_TICH.docx")

    print(f"Generating full analysis report from base dir: {base_dir}")
    doc = docx.Document()

    # 1. Khổ giấy A4 và lề trang chuẩn đồ án (6.5 inches printable width)
    for section in doc.sections:
        section.page_width = Inches(8.27)
        section.page_height = Inches(11.69)
        section.top_margin = Inches(0.85)
        section.bottom_margin = Inches(0.85)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(0.79)

    # 2. Định dạng Normal Style chuẩn font Times New Roman, cỡ 14, chữ đen
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Times New Roman'
    style_normal.font.size = Pt(14)
    style_normal.font.color.rgb = COLOR_BLACK

    # 3. Header & Footer
    add_header_footer(doc)

    # 4. Dựng nội dung các chương
    print("Building Cover Page...")
    build_cover_page(doc)

    print("Building Table of Contents...")
    build_table_of_contents(doc)

    print("Building Chapter 1 (Stakeholders & RBAC)...")
    build_chapter_1(doc)

    print("Building Chapter 2 (Use Case Modeling & 15 Specifications)...")
    build_chapter_2(doc, base_dir)

    print("Building Chapter 3 (12 Swimlane Activity Diagrams)...")
    build_chapter_3(doc, base_dir)

    print("Building Chapter 4 (12 System Sequence Diagrams)...")
    build_chapter_4(doc, base_dir)

    print("Building Chapter 5 (Business Rules Matrix)...")
    build_chapter_5(doc)

    print("Building Chapter 6 (Requirements Traceability Matrix)...")
    build_chapter_6(doc)

    print("Building Chapter 7 (References)...")
    build_chapter_7(doc)

    # 5. Lưu tệp
    targets = [out_docx_phase1, out_docx_full_name, out_docx_root]
    for t in targets:
        try:
            doc.save(t)
            print(f"SUCCESS: Saved report to {t}")
        except PermissionError:
            alt_path = t.replace(".docx", "_UPDATED.docx")
            doc.save(alt_path)
            print(f"NOTICE: {t} is locked by Word. Saved to {alt_path} instead.")

if __name__ == "__main__":
    generate_report()
