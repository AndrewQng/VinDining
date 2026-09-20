# -*- coding: utf-8 -*-
"""
Script định nghĩa các hàm dựng phần tử Word chuẩn học thuật cho Báo cáo Khảo sát Hiện trạng VinDining.
Thiết kế theo Executive Theme (#1B365D, #2B6CB0, #2D3748), canh lề chuẩn A4 (6.5 in printable width),
Heading 1/2/3 tích hợp outlineLvl và Word Style cho Navigation Pane, bảng biểu chống tràn trang,
hộp ghi chú Callout, đánh số trang động chuẩn và Mục lục chuyên nghiệp với dot leaders.
"""

import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

# Định nghĩa bảng màu thiết kế chuyên nghiệp (Executive Theme)
COLOR_NAVY = RGBColor(27, 54, 93)      # #1B365D - Tiêu đề chính, Header bảng
COLOR_INDIGO = RGBColor(43, 108, 176)  # #2B6CB0 - Tiêu đề cấp 2
COLOR_SLATE = RGBColor(45, 55, 72)     # #2D3748 - Tiêu đề cấp 3, văn bản nhấn
COLOR_BODY = RGBColor(40, 40, 40)      # #282828 - Thân văn bản chính
COLOR_MUTED = RGBColor(113, 128, 150)  # #718096 - Chú thích, Header/Footer
HEX_NAVY = "1B365D"
HEX_INDIGO = "2B6CB0"
HEX_SLATE = "2D3748"
HEX_LIGHT_BLUE = "EBF8FF"
HEX_ROW_ALT = "F7FAFC"
HEX_BORDER = "CBD5E0"
HEX_BORDER_CALLOUT = "3182CE"
HEX_ALERT_BG = "FFF5F5"
HEX_ALERT_BORDER = "E53E3E"
HEX_MUTED = "718096"

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=80, bottom=80, left=120, right=120):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_styling(table, col_widths=None):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="6" w:space="0" w:color="{HEX_NAVY}"/>'
        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="{HEX_NAVY}"/>'
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
            set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
            if col_widths and c_idx < len(col_widths):
                cell.width = col_widths[c_idx]
                tcPr = cell._tc.get_or_add_tcPr()
                col_dxa = int(col_widths[c_idx].inches * 1440)
                tcW = parse_xml(f'<w:tcW {nsdecls("w")} w:w="{col_dxa}" w:type="dxa"/>')
                tcPr.append(tcW)
            
            if r_idx == 0:
                set_cell_background(cell, HEX_NAVY)
                for p in cell.paragraphs:
                    p.paragraph_format.space_before = Pt(3)
                    p.paragraph_format.space_after = Pt(3)
                    p.paragraph_format.line_spacing = 1.12
                    for run in p.runs:
                        run.font.name = "Times New Roman"
                        run.font.bold = True
                        run.font.size = Pt(9.5)
                        run.font.color.rgb = RGBColor(255, 255, 255)
            else:
                bg = HEX_ROW_ALT if r_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
                for p in cell.paragraphs:
                    p.paragraph_format.space_before = Pt(2.5)
                    p.paragraph_format.space_after = Pt(2.5)
                    p.paragraph_format.line_spacing = 1.12
                    for run in p.runs:
                        run.font.name = "Times New Roman"
                        run.font.size = Pt(9.0)
                        run.font.color.rgb = COLOR_BODY

def set_compact_table_styling(table, col_widths=None, font_size=Pt(8.5)):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="6" w:space="0" w:color="{HEX_NAVY}"/>'
        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="{HEX_NAVY}"/>'
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
            set_cell_margins(cell, top=35, bottom=35, left=70, right=70)
            if col_widths and c_idx < len(col_widths):
                cell.width = col_widths[c_idx]
                tcPr = cell._tc.get_or_add_tcPr()
                col_dxa = int(col_widths[c_idx].inches * 1440)
                tcW = parse_xml(f'<w:tcW {nsdecls("w")} w:w="{col_dxa}" w:type="dxa"/>')
                tcPr.append(tcW)
            
            if r_idx == 0:
                set_cell_background(cell, HEX_NAVY)
                for p in cell.paragraphs:
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    p.paragraph_format.line_spacing = 1.05
                    for run in p.runs:
                        run.font.name = "Times New Roman"
                        run.font.bold = True
                        run.font.size = Pt(9.0)
                        run.font.color.rgb = RGBColor(255, 255, 255)
            else:
                bg = HEX_ROW_ALT if r_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
                for p in cell.paragraphs:
                    p.paragraph_format.space_before = Pt(1.2)
                    p.paragraph_format.space_after = Pt(1.2)
                    p.paragraph_format.line_spacing = 1.05
                    for run in p.runs:
                        run.font.name = "Times New Roman"
                        run.font.size = font_size
                        run.font.color.rgb = COLOR_BODY

def add_header_footer(doc):
    for s_idx, section in enumerate(doc.sections):
        if s_idx == 0:
            # Trang bìa không header footer
            section.different_first_page_header_footer = True
            header = section.first_page_header
            footer = section.first_page_footer
            header.is_linked_to_previous = False
            footer.is_linked_to_previous = False
        else:
            # Đánh số trang tiếp tục từ trang 2 ở Section 2 (Trang bìa là trang 1 nhưng không in số)
            sectPr = section._sectPr
            # Kiểm tra tránh trùng lặp pgNumType
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
            hrun = hp.add_run("VinDining — Báo cáo Khảo sát Hiện trạng & Đánh giá Tính khả thi")
            hrun.font.name = "Times New Roman"
            hrun.font.italic = True
            hrun.font.size = Pt(8.5)
            hrun.font.color.rgb = COLOR_MUTED
            
            pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="4" w:space="2" w:color="{HEX_BORDER}"/></w:pBdr>')
            hp._element.get_or_add_pPr().append(pBdr)

            footer = section.footer
            footer.is_linked_to_previous = False
            fp = footer.paragraphs[0]
            fp.text = ""
            fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            fp.paragraph_format.space_before = Pt(3)
            
            frun1 = fp.add_run("Đồ án Tốt nghiệp / Chuyên đề Kỹ thuật Phần mềm\t\tTrang ")
            frun1.font.name = "Times New Roman"
            frun1.font.size = Pt(9)
            frun1.font.color.rgb = COLOR_MUTED
            
            # Field Page có định dạng chuẩn (bắt đầu từ 2 trên trang Mục lục)
            fld1 = parse_xml(
                f'<w:fldSimple {nsdecls("w")} w:instr="PAGE">'
                f'<w:r>'
                f'<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="{HEX_MUTED}"/><w:sz w:val="18"/></w:rPr>'
                f'<w:t>2</w:t>'
                f'</w:r>'
                f'</w:fldSimple>'
            )
            fp._p.append(fld1)
            
            frun2 = fp.add_run(" / ")
            frun2.font.name = "Times New Roman"
            frun2.font.size = Pt(9)
            frun2.font.color.rgb = COLOR_MUTED
            
            # Field NumPages có định dạng chuẩn
            fld2 = parse_xml(
                f'<w:fldSimple {nsdecls("w")} w:instr="NUMPAGES">'
                f'<w:r>'
                f'<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:color w:val="{HEX_MUTED}"/><w:sz w:val="18"/></w:rPr>'
                f'<w:t>10</w:t>'
                f'</w:r>'
                f'</w:fldSimple>'
            )
            fp._p.append(fld2)
            
            pBdrF = parse_xml(f'<w:pBdr {nsdecls("w")}><w:top w:val="single" w:sz="4" w:space="2" w:color="{HEX_BORDER}"/></w:pBdr>')
            fp._element.get_or_add_pPr().append(pBdrF)

def add_callout(doc, text_prefix, text_content, border_hex=HEX_BORDER_CALLOUT, bg_hex=HEX_LIGHT_BLUE):
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
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    
    r_pre = p.add_run(text_prefix + ": ")
    r_pre.font.name = "Times New Roman"
    r_pre.font.bold = True
    r_pre.font.size = Pt(9.5)
    r_pre.font.color.rgb = COLOR_NAVY
    
    r_txt = p.add_run(text_content)
    r_txt.font.name = "Times New Roman"
    r_txt.font.italic = True
    r_txt.font.size = Pt(9.5)
    r_txt.font.color.rgb = COLOR_SLATE
    
    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_before = Pt(0)
    p_spacer.paragraph_format.space_after = Pt(3)

def add_figure(doc, img_rel_path, caption_text, base_dir, width_inches=3.5):
    full_path = os.path.normpath(os.path.join(base_dir, img_rel_path))
    if os.path.exists(full_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(4)
        p_img.paragraph_format.space_after = Pt(1)
        run = p_img.add_run()
        run.add_picture(full_path, width=Inches(width_inches))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(1)
        p_cap.paragraph_format.space_after = Pt(4)
        rcap = p_cap.add_run(caption_text)
        rcap.font.name = "Times New Roman"
        rcap.font.italic = True
        rcap.font.size = Pt(8.5)
        rcap.font.color.rgb = COLOR_MUTED

def add_p(doc, text, bold_prefix="", space_after=4, line_spacing=1.15, indent_inches=0.0):
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
        r_pre.font.size = Pt(11)
        r_pre.font.color.rgb = COLOR_BODY
        
    r_body = p.add_run(text)
    r_body.font.name = "Times New Roman"
    r_body.font.size = Pt(11)
    r_body.font.color.rgb = COLOR_BODY
    return p

def add_bullet(doc, text, bold_prefix=""):
    p = doc.add_paragraph(style='List Bullet')
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2.5)
    p.paragraph_format.line_spacing = 1.14
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Times New Roman"
        r_pre.font.bold = True
        r_pre.font.size = Pt(11)
        r_pre.font.color.rgb = COLOR_BODY
    r_body = p.add_run(text)
    r_body.font.name = "Times New Roman"
    r_body.font.size = Pt(11)
    r_body.font.color.rgb = COLOR_BODY
    return p

def set_outline_level(p, level):
    pPr = p._p.get_or_add_pPr()
    outlineLvl = parse_xml(f'<w:outlineLvl {nsdecls("w")} w:val="{level}"/>')
    pPr.append(outlineLvl)

def add_h1(doc, title_text):
    p = doc.add_paragraph(style='Heading 1')
    p.paragraph_format.space_before = Pt(13)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    set_outline_level(p, 0)
    p.text = ""
    r = p.add_run(title_text)
    r.font.name = "Times New Roman"
    r.font.bold = True
    r.font.size = Pt(14)
    r.font.color.rgb = COLOR_NAVY
    
    pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="6" w:space="2" w:color="{HEX_NAVY}"/></w:pBdr>')
    p._element.get_or_add_pPr().append(pBdr)
    return p

def add_h2(doc, title_text):
    p = doc.add_paragraph(style='Heading 2')
    p.paragraph_format.space_before = Pt(9)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    set_outline_level(p, 1)
    p.text = ""
    r = p.add_run(title_text)
    r.font.name = "Times New Roman"
    r.font.bold = True
    r.font.size = Pt(12)
    r.font.color.rgb = COLOR_INDIGO
    return p

def add_h3(doc, title_text):
    p = doc.add_paragraph(style='Heading 3')
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    set_outline_level(p, 2)
    p.text = ""
    r = p.add_run(title_text)
    r.font.name = "Times New Roman"
    r.font.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = COLOR_SLATE
    return p

def add_toc_entry(doc, title, page_num, level=1):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1.5)
    p.paragraph_format.space_after = Pt(1.5)
    p.paragraph_format.line_spacing = 1.15
    
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
    if level == 1:
        r_title.font.bold = True
        r_title.font.size = Pt(10)
        r_title.font.color.rgb = COLOR_NAVY
    elif level == 2:
        r_title.font.size = Pt(9.5)
        r_title.font.color.rgb = COLOR_SLATE
    else:
        r_title.font.size = Pt(9.0)
        r_title.font.color.rgb = COLOR_BODY
        
    r_tab = p.add_run("\t")
    r_tab.font.name = "Times New Roman"
    
    r_page = p.add_run(str(page_num))
    r_page.font.name = "Times New Roman"
    if level == 1:
        r_page.font.bold = True
    r_page.font.size = Pt(10 if level == 1 else 9.5)
    r_page.font.color.rgb = COLOR_NAVY if level == 1 else COLOR_SLATE
    return p

print("Enhanced academic primitives loaded successfully.")
