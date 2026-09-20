# -*- coding: utf-8 -*-
"""
Full Academic Survey Report Generator for VinDining System
Produces: docs/phase1/BAO_CAO_KHAO_SAT_HE_THONG_VINDINING.docx
Standard Academic Format: Times New Roman, A4 (6.5 in printable width),
Header/Footer page numbers, Heading 1/2/3 with Word outline levels,
Complete 16-criteria matrix, exactly 10 formatted A4 pages in MS Word.
"""

import os
import sys
import docx

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.enum.section import WD_SECTION_START
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

from report_primitives import (
    COLOR_NAVY, COLOR_INDIGO, COLOR_SLATE, COLOR_BODY, COLOR_MUTED,
    HEX_NAVY, HEX_LIGHT_BLUE, HEX_ROW_ALT, HEX_BORDER,
    set_cell_background, set_cell_margins, set_table_styling, set_compact_table_styling, add_header_footer,
    add_callout, add_figure, add_p, add_bullet, add_h1, add_h2, add_h3, add_toc_entry
)

def create_survey_document():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_docx = os.path.join(base_dir, "BAO_CAO_KHAO_SAT_HE_THONG_VINDINING.docx")
    
    doc = docx.Document()
    
    # 1. Cấu hình lề trang chuẩn đồ án tốt nghiệp A4
    # Printable width: 8.27 - 0.98 - 0.79 = 6.5 inches (16.5 cm)
    for section in doc.sections:
        section.page_width = Inches(8.27)   # 21.0 cm
        section.page_height = Inches(11.69) # 29.7 cm
        section.top_margin = Inches(0.85)    # 2.15 cm
        section.bottom_margin = Inches(0.85) # 2.15 cm
        section.left_margin = Inches(0.98)   # 2.5 cm (đóng gáy sách)
        section.right_margin = Inches(0.79)  # 2.0 cm
    
    # Cấu hình Normal style
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Times New Roman'
    style_normal.font.size = Pt(10.5)
    style_normal.font.color.rgb = COLOR_BODY
    
    # =========================================================================
    # TRANG BÌA (COVER PAGE - PAGE 1)
    # =========================================================================
    p_univ = doc.add_paragraph()
    p_univ.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_univ.paragraph_format.space_before = Pt(14)
    p_univ.paragraph_format.space_after = Pt(2)
    run_u1 = p_univ.add_run("BỘ GIÁO DỤC VÀ ĐÀO TẠO — HỆ THỐNG ĐÀO TẠO CÔNG NGHỆ\n")
    run_u1.font.name = "Times New Roman"
    run_u1.font.size = Pt(11.5)
    run_u1.font.bold = True
    run_u1.font.color.rgb = COLOR_SLATE
    run_u2 = p_univ.add_run("KHOA CÔNG NGHỆ THÔNG TIN — BỘ MÔN KỸ THUẬT PHẦN MỀM")
    run_u2.font.name = "Times New Roman"
    run_u2.font.size = Pt(11.5)
    run_u2.font.bold = True
    run_u2.font.color.rgb = COLOR_NAVY
    
    p_line = doc.add_paragraph()
    p_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_line.paragraph_format.space_before = Pt(4)
    p_line.paragraph_format.space_after = Pt(24)
    r_line = p_line.add_run("―" * 26)
    r_line.font.name = "Times New Roman"
    r_line.font.bold = True
    r_line.font.color.rgb = COLOR_INDIGO
    
    p_type = doc.add_paragraph()
    p_type.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_type.paragraph_format.space_before = Pt(8)
    p_type.paragraph_format.space_after = Pt(6)
    run_type = p_type.add_run("BÁO CÁO KHẢO SÁT HIỆN TRẠNG HỆ THỐNG\nVÀ ĐÁNH GIÁ TÍNH KHẢ THI")
    run_type.font.name = "Times New Roman"
    run_type.font.size = Pt(17)
    run_type.font.bold = True
    run_type.font.color.rgb = COLOR_NAVY
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(2)
    p_sub.paragraph_format.space_after = Pt(24)
    run_sub = p_sub.add_run("SYSTEM SURVEY & FEASIBILITY STUDY REPORT")
    run_sub.font.name = "Times New Roman"
    run_sub.font.size = Pt(11)
    run_sub.font.italic = True
    run_sub.font.color.rgb = COLOR_MUTED
    
    # Hộp đề tài
    tbl_title = doc.add_table(rows=1, cols=1)
    tbl_title.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_title.autofit = False
    tblPr = tbl_title._tbl.tblPr
    tblW = parse_xml(f'<w:tblW {nsdecls("w")} w:w="9360" w:type="dxa"/>')
    tblPr.append(tblW)
    
    c_title = tbl_title.cell(0, 0)
    c_title.width = Inches(6.5)
    set_cell_background(c_title, HEX_LIGHT_BLUE)
    set_cell_margins(c_title, top=140, bottom=140, left=180, right=180)
    
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="36" w:space="0" w:color="{HEX_NAVY}"/>'
        f'<w:top w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)
    
    p_box = c_title.paragraphs[0]
    p_box.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_box.paragraph_format.space_before = Pt(4)
    p_box.paragraph_format.space_after = Pt(4)
    r_de_tai = p_box.add_run("ĐỀ TÀI DỰ ÁN:\n")
    r_de_tai.font.name = "Times New Roman"
    r_de_tai.font.size = Pt(10.5)
    r_de_tai.font.bold = True
    r_de_tai.font.color.rgb = COLOR_INDIGO
    r_main_name = p_box.add_run("VINDINING — HỆ THỐNG QUẢN LÝ VÀ ĐẶT BÀN\nNHÀ HÀNG FINE DINING CAO CẤP\n")
    r_main_name.font.name = "Times New Roman"
    r_main_name.font.size = Pt(15)
    r_main_name.font.bold = True
    r_main_name.font.color.rgb = COLOR_NAVY
    r_en_name = p_box.add_run("(Fine Dining Restaurant Management & Reservation System)")
    r_en_name.font.name = "Times New Roman"
    r_en_name.font.size = Pt(11)
    r_en_name.font.italic = True
    r_en_name.font.color.rgb = COLOR_SLATE
    
    p_space_mid = doc.add_paragraph()
    p_space_mid.paragraph_format.space_before = Pt(28)
    p_space_mid.paragraph_format.space_after = Pt(0)
    
    # Bảng thông tin sinh viên & giảng viên (6.5 inches)
    tbl_info = doc.add_table(rows=5, cols=2)
    tbl_info.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_widths_info = [Inches(2.2), Inches(4.3)]
    
    info_data = [
        ("Giảng viên hướng dẫn:", "ThS. Phạm Hữu Tùng"),
        ("Sinh viên thực hiện 1:", "Nguyễn Mạnh Quyền — Kiến trúc Backend & CSDL"),
        ("Sinh viên thực hiện 2:", "Đặng Quốc Khánh — Lập trình Giao diện Web & E-Menu"),
        ("Sinh viên thực hiện 3:", "Nguyễn Hoàng Đạt — Phân hệ KDS & TableDisplay"),
        ("Giai đoạn đồ án:", "Phase 1: Khảo sát Hiện trạng & Đánh giá Khả thi")
    ]
    
    for idx, (label, val) in enumerate(info_data):
        row = tbl_info.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = col_widths_info[0]
        c1.width = col_widths_info[1]
        set_cell_margins(c0, top=50, bottom=50, left=60, right=60)
        set_cell_margins(c1, top=50, bottom=50, left=60, right=60)
        
        p0 = c0.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r0 = p0.add_run(label)
        r0.font.name = "Times New Roman"
        r0.font.bold = True
        r0.font.size = Pt(10.5)
        r0.font.color.rgb = COLOR_SLATE
        
        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r1 = p1.add_run(val)
        r1.font.name = "Times New Roman"
        r1.font.size = Pt(10.5)
        r1.font.color.rgb = COLOR_BODY
        if idx == 0:
            r1.font.bold = True
            r1.font.color.rgb = COLOR_NAVY
            
    tblInfoPr = tbl_info._tbl.tblPr
    tblInfoPr.append(parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:left w:val="none"/><w:top w:val="none"/><w:bottom w:val="none"/>'
        f'<w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    ))
    
    p_loc = doc.add_paragraph()
    p_loc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_loc.paragraph_format.space_before = Pt(45)
    p_loc.paragraph_format.space_after = Pt(0)
    r_loc = p_loc.add_run("THÀNH PHỐ HỒ CHÍ MINH — THÁNG 09 / 2026")
    r_loc.font.name = "Times New Roman"
    r_loc.font.size = Pt(10.5)
    r_loc.font.bold = True
    r_loc.font.color.rgb = COLOR_SLATE
    
    # Hết trang bìa -> Sang trang mới (Section 2: Đánh số trang bắt đầu từ 1)
    doc.add_section(WD_SECTION_START.NEW_PAGE)
    
    # =========================================================================
    # MỤC LỤC & TỔNG QUAN TÀI LIỆU (PAGE 2)
    # =========================================================================
    add_h1(doc, "MỤC LỤC BÁO CÁO KHẢO SÁT")
    
    add_toc_entry(doc, "CHƯƠNG 1: KHẢO SÁT HIỆN TRẠNG VẬN HÀNH FINE DINING TẠI VIỆT NAM", 3, level=1)
    add_toc_entry(doc, "1.1 Đặc thù phân khúc Fine Dining so với Nhà hàng đại chúng", 3, level=2)
    add_toc_entry(doc, "1.2 Khảo sát quy trình Đặt bàn & Thu tiền cọc thủ công", 3, level=2)
    add_toc_entry(doc, "1.3 Khảo sát quy trình Gọi món & Điều phối phục vụ theo Course", 3, level=2)
    add_toc_entry(doc, "1.4 Khảo sát quy trình Quầy Pass & Kiểm soát chất lượng món ăn", 4, level=2)
    add_toc_entry(doc, "1.5 Khảo sát quy trình Thanh toán & Cấn trừ tiền cọc cuối bữa", 4, level=2)
    add_toc_entry(doc, "1.6 Ma trận phân tích điểm nghẽn & Tổn thất vận hành (Pain Points Matrix)", 4, level=2)
    
    add_toc_entry(doc, "CHƯƠNG 2: KHẢO SÁT CHI TIẾT THỰC TẾ CÁC PHẦN MỀM THỊ TRƯỜNG", 5, level=1)
    add_toc_entry(doc, "2.1 Bối cảnh số hóa ngành F&B tại Việt Nam", 5, level=2)
    add_toc_entry(doc, "2.2 Khảo sát thực tế giải pháp iPOS.vn (KDS Maker & KDS Control)", 5, level=2)
    add_toc_entry(doc, "2.3 Khảo sát thực tế giải pháp MISA CukCuk (App Bếp/Bar & Lượt phục vụ)", 5, level=2)
    add_toc_entry(doc, "2.4 Khảo sát thực tế giải pháp KiotViet F&B (Màn hình 2 cột & Đặt ưu tiên)", 6, level=2)
    add_toc_entry(doc, "2.5 Khảo sát các giải pháp quốc tế (OpenTable, SevenRooms, Toast POS)", 6, level=2)
    
    add_toc_entry(doc, "CHƯƠNG 3: PHÂN TÍCH KHOẢNG TRỐNG VẬN HÀNH (GAP ANALYSIS) & MA TRẬN", 7, level=1)
    add_toc_entry(doc, "3.1 Phân tích 6 khoảng trống vận hành cốt lõi (Core Operational Gaps)", 7, level=2)
    add_toc_entry(doc, "3.2 Bảng Ma trận so sánh tính năng thực tế 100% giữa 4 hệ thống", 8, level=2)
    
    add_toc_entry(doc, "CHƯƠNG 4: BÁO CÁO ĐÁNH GIÁ TÍNH KHẢ THI (FEASIBILITY STUDY)", 9, level=1)
    add_toc_entry(doc, "4.1 Khảo sát nhu cầu các bên liên quan (Stakeholder Needs Assessment)", 9, level=2)
    add_toc_entry(doc, "4.2 Đánh giá Tính khả thi Kỹ thuật, Vận hành & Kinh tế", 9, level=2)
    add_toc_entry(doc, "4.3 Tính khả thi Thời gian & Lộ trình thực hiện 10 tuần", 9, level=2)
    
    add_toc_entry(doc, "CHƯƠNG 5: KẾT LUẬN & ĐỊNH HƯỚNG GIẢI PHÁP HỆ THỐNG VINDINING", 10, level=1)
    add_toc_entry(doc, "5.1 Tổng kết kết quả khảo sát và luận điểm khoa học", 10, level=2)
    add_toc_entry(doc, "5.2 Định hướng kiến trúc chuyển tiếp sang Phase 2", 10, level=2)

    add_h2(doc, "Tổng quan điều hành (Executive Summary)")
    add_p(doc, 
        "Tài liệu này trình bày kết quả nghiên cứu thực địa và khảo sát chuyên sâu về chu trình vận hành tại các nhà hàng ẩm thực cao cấp (Fine Dining) tại Việt Nam, đối chiếu toàn diện với năng lực hiện hữu của 3 phần mềm thị trường phổ biến (iPOS.vn, MISA CukCuk, KiotViet F&B) cùng các giải pháp quốc tế. Báo cáo lượng hóa các tổn thất vận hành đặc thù (bùng bàn gây thất thu 12-18% doanh thu ngày, nguy cơ sốc phản vệ do sót dị ứng, suy giảm nhiệt độ món ăn chuẩn Michelin và sai lệch đối soát cọc), từ đó xác lập 6 khoảng trống công nghệ cốt lõi và xây dựng luận cứ chứng minh tính khả thi toàn diện của dự án VinDining.")
        
    add_callout(doc, "Phương pháp luận khảo sát", 
        "Dữ liệu khảo sát được thu thập độc lập thông qua quan sát hiện trường tại 5 nhà hàng cao cấp (Quận 1, TP.HCM và Hoàn Kiếm, Hà Nội), phỏng vấn trực tiếp Bếp trưởng, Quản lý sảnh, Thu ngân, kết hợp trải nghiệm thực tế các bản phát hành thương mại mới nhất của iPOS, MISA và KiotViet.")

    doc.add_page_break()

    # =========================================================================
    # CHƯƠNG 1: KHẢO SÁT HIỆN TRẠNG VẬN HÀNH FINE DINING TẠI VIỆT NAM (PAGE 3 - 4)
    # =========================================================================
    add_h1(doc, "CHƯƠNG 1: KHẢO SÁT HIỆN TRẠNG QUY TRINH VẬN HÀNH FINE DINING TẠI VIỆT NAM")
    
    add_h2(doc, "1.1 Đặc thù phân khúc Fine Dining so với Nhà hàng đại chúng")
    add_p(doc, 
        "Khác biệt căn bản giữa Nhà hàng đại chúng (Mass Casual Dining) và Fine Dining nằm ở triết lý phục vụ: Ẩm thực đại chúng tối ưu hóa số lượng (volume) và tốc độ quay vòng bàn (turnover), trong khi Fine Dining tập trung vào trải nghiệm đa giác quan kéo dài từ 2 đến 3 giờ đồng hồ với các thực đơn nếm thử (Tasting Menu) gồm 6 đến 10 món ăn chuẩn mực.")
    add_p(doc, 
        "Mô hình này đặt ra những thách thức khắt khe: Chi phí nguyên liệu nhập khẩu đắt đỏ (bò Wagyu A5, nấm Truffle đen, gan ngỗng Foie Gras, trứng cá tầm Caviar) chiếm 35% - 45% giá thành; yêu cầu giữ nhiệt độ đĩa ăn chính xác khi hạ xuống bàn; sự hòa nhịp đón đầu của rượu vang (Wine Pairing); và đặc biệt là quản lý tuyệt đối thông tin dị ứng thực phẩm và ghi chú đặc biệt cho từng món ăn.")

    add_h2(doc, "1.2 Khảo sát quy trình Đặt bàn & Thu tiền cọc thủ công")
    add_p(doc, 
        "Khảo sát tại các nhà hàng Fine Dining cho thấy quy trình đặt chỗ hiện nay vẫn chủ yếu là bán thủ công qua Hotline, Fanpage hoặc Zalo tiếp tân:")
        
    add_figure(doc, "drawio/asis01_survey_reservation.png", "Hình 1.1: Sơ đồ hiện trạng Quy trình Đặt bàn và Thu tiền cọc truyền thống", base_dir, width_inches=3.0)
    
    add_p(doc, 
        "Trình tự diễn ra: Khách liên hệ, nhân viên tiếp tân tra cứu sổ bàn giấy hoặc Google Sheets. Nếu còn bàn, tiếp tân gửi số tài khoản ngân hàng yêu cầu khách chuyển cọc từ 500.000 đến 1.000.000 VNĐ/khách trong vòng 2-4 giờ. Khách chuyển khoản rồi chụp màn hình gửi lại; nhân viên hoặc kế toán kiểm tra biến động số dư ngân hàng thủ công rồi mới đánh dấu 'Đã cọc'.")
    add_bullet(doc, "Thời gian đối soát kéo dài từ 15 đến 30 phút trong giờ làm việc, gây đình trệ vào ban đêm hoặc ngày nghỉ lễ.", bold_prefix="Độ trễ đối soát cao: ")
    add_bullet(doc, "Sổ bàn giấy hoặc file Excel dễ bị ghi đè, dẫn đến tình trạng hai nhân viên cùng nhận một bàn VIP (Overbooking).", bold_prefix="Rủi ro xung đột dữ liệu: ")
    add_bullet(doc, "Yêu cầu dị ứng hoặc vị trí bàn yên tĩnh chỉ ghi chú viết tay rời rạc, rất dễ thất lạc khi bàn giao ca trực.", bold_prefix="Thất lạc dữ liệu cá nhân hóa: ")

    add_h2(doc, "1.3 Khảo sát quy trình Gọi món & Điều phối phục vụ theo Course")
    add_p(doc, 
        "Trong Fine Dining, món ăn được dọn theo trình tự Course Sequence: Khai vị chào bếp (Amuse-bouche) → Khai vị lạnh → Khai vị nóng → Súp → Món chính hải sản → Món chính thịt đỏ → Món giải vị (Sorbet) → Tráng miệng chính → Bánh ngọt kết thúc (Petit Fours).")
    
    add_p(doc, 
        "Thực tế hiện nay: Phục vụ ghi phiếu giấy (Order Pad) kèm lưu ý dị ứng, chạy bộ xuống bếp cắm phiếu vào thanh kẹp order. Bếp trưởng nhìn thanh ray điều phối thứ tự bằng trí nhớ và hô gọi phụ bếp nấu qua tiếng hô lớn.")
    add_bullet(doc, "Phiếu tay dễ nhòe nước sốt; việc bỏ sót ghi chú dị ứng (đậu phộng, hải sản thân mềm) gây nguy cơ sốc phản vệ đe dọa tính mạng thực khách.", bold_prefix="Nguy cơ y tế do sót dị ứng: ")
    add_bullet(doc, "Thiếu đồng hồ SLA chuẩn bị tự động, món kế tiếp thường bị nấu quá sớm (nằm chờ nguội lạnh, hỏng sốt) hoặc quá trễ (>25 phút gây gãy mạch tiệc).", bold_prefix="Lệch nhịp độ (Pacing Drift): ")

    add_h2(doc, "1.4 Khảo sát quy trình Quầy Pass & Kiểm soát chất lượng món ăn")
    add_p(doc, 
        "Quầy Pass là ranh giới ngăn cách giữa hậu cần chế biến (BOH) và sảnh phục vụ (FOH), trang bị đèn sưởi giữ nhiệt để kiểm tra chất lượng lần cuối. Tại các nhà hàng khảo sát, trạm Pass vận hành hoàn toàn bằng mắt thường và trí nhớ của nhân viên điều phối (Expediter). Khi món xong, bếp bấm chuông leng keng hoặc gọi to số bàn. Giờ cao điểm, hàng chục đĩa dồn ứ trên quầy Pass phát nhiệt, dễ dẫn đến bưng nhầm đĩa giữa các bàn và mất đi sự chính xác khi đối chiếu các yêu cầu dị ứng, ghi chú đặc biệt cho từng món ăn.")

    add_h2(doc, "1.5 Khảo sát quy trình Thanh toán & Cấn trừ tiền cọc cuối bữa")
    add_p(doc, 
        "Cuối bữa, khi khách yêu cầu hóa đơn, nhân viên báo thu ngân. Thu ngân ca tối phải tìm lại sổ tay hoặc tin nhắn Zalo ca sáng để xác minh số tiền đã cọc, sau đó dùng máy tính bấm tay để lấy tổng tiền món, cộng 5% phí phục vụ, 10% thuế VAT rồi trừ tiền cọc, sau đó sửa tay vào hóa đơn in ra. Nhiều trường hợp thu ngân quên cấn trừ cọc gây khiếu nại gay gắt tại bàn, hoặc cấn trừ hai lần gây thất thoát doanh thu. Thời gian đối soát kéo dài 7-12 phút/bàn, phá vỡ trải nghiệm hoàn hảo của bữa tiệc vào những phút cuối cùng.")

    add_h2(doc, "1.6 Ma trận phân tích điểm nghẽn & Tổn thất vận hành (Pain Points Matrix)")
    add_p(doc, 
        "Tổng hợp từ dữ liệu đối soát thực tế tại các nhà hàng cao cấp, nhóm nghiên cứu xây dựng Ma trận Tổn thất Vận hành định lượng:")
        
    # BẢNG MA TRẬN TỔN THẤT VẬN HÀNH (6.5 inches)
    tbl_loss = doc.add_table(rows=5, cols=4)
    loss_widths = [Inches(1.5), Inches(1.8), Inches(2.2), Inches(1.0)]
    
    headers_loss = ["Nhóm Điểm Nghẽn", "Biểu Hiện Thực Tế Vận Hành", "Tác Động Định Lượng & Rủi Ro", "Mức Nghiêm Trọng"]
    for idx, h in enumerate(headers_loss):
        tbl_loss.rows[0].cells[idx].paragraphs[0].add_run(h)
        
    loss_rows = [
        ("Bùng bàn đặt trước\n(No-show Table)", 
         "Khách đặt bàn đẹp giờ cao điểm cuối tuần nhưng không đến và không báo hủy trước.", 
         "Lãng phí nguyên liệu tươi nhập khẩu đã sơ chế (Wagyu, gan ngỗng); thất thu 12% - 18% doanh thu ngày.", 
         "Rất cao\n(Critical)"),
        ("Bỏ sót cảnh báo\nDị ứng thực phẩm", 
         "Phiếu ghi tay nhòe sốt, đầu bếp không chú ý ghi chú dị ứng và chế biến đặc biệt của món ăn.", 
         "Gây sốc phản vệ cho khách hàng, đối mặt khiếu kiện pháp lý và tổn thất vĩnh viễn uy tín thương hiệu.", 
         "Nguy cấp\n(Fatal)"),
        ("Gãy nhịp phục vụ\n(Course Pacing)", 
         "Món ra quá nhanh dồn đĩa hoặc trễ quá lâu (>25 phút); đĩa chín nằm chờ trên Pass nguội lạnh.", 
         "Nhiệt độ đĩa giảm 8-15°C, nước sốt bị đông, phá hủy cấu trúc hương vị món ăn chuẩn Michelin.", 
         "Cao\n(Major)"),
        ("Sai sót đối soát\nCấn trừ tiền cọc", 
         "Thu ngân quên cấn trừ tiền cọc hoặc tính nhầm số tiền cọc giữa các ca trực khác nhau.", 
         "Gây tranh cãi với khách hàng tại bàn; kéo dài thời gian chờ đợi thanh toán thêm 8-12 phút/bàn.", 
         "Đáng kể\n(Significant)")
    ]
    
    for r_idx, row_data in enumerate(loss_rows, start=1):
        for c_idx, val in enumerate(row_data):
            cell = tbl_loss.rows[r_idx].cells[c_idx]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx == 3 else WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            if c_idx == 3:
                r.font.bold = True
                if "Fatal" in val or "Critical" in val:
                    r.font.color.rgb = RGBColor(197, 48, 48)
                else:
                    r.font.color.rgb = RGBColor(194, 65, 12)
                    
    set_compact_table_styling(tbl_loss, loss_widths, font_size=Pt(8.5))
    
    doc.add_page_break()

    # =========================================================================
    # CHƯƠNG 2: KHẢO SÁT CHI TIẾT THỰC TẾ CÁC PHẦN MỀM THỊ TRƯỜNG (PAGE 5 - 6)
    # =========================================================================
    add_h1(doc, "CHƯƠNG 2: KHẢO SÁT CHI TIẾT THỰC TẾ CÁC PHẦN MỀM THỊ TRƯỜNG")
    
    add_h2(doc, "2.1 Bối cảnh số hóa ngành F&B tại Việt Nam")
    add_p(doc, 
        "Thị trường công nghệ F&B Việt Nam hiện bị chi phối bởi các nền tảng đại chúng như iPOS.vn, MISA CukCuk và KiotViet. Các giải pháp này được tối ưu hóa rất tốt cho chuỗi cà phê, trà sữa, lẩu nướng và thức ăn nhanh — nơi bài toán cốt lõi là giải tỏa nhanh hàng đợi, gom đơn số lượng lớn và thanh toán nhanh. Khi đưa vào Fine Dining, các hệ thống này lập tức bộc lộ sự không tương thích về mặt nghiệp vụ.")

    add_h2(doc, "2.2 Khảo sát thực tế giải pháp iPOS.vn")
    add_p(doc, 
        "iPOS.vn hiện là hệ sinh thái chiếm thị phần lớn nhất với 2 cấu phần điều phối bếp:")
    add_bullet(doc, "Lắp đặt tại trạm bar/bếp, hiển thị món cần làm được đẩy từ POS hoặc thiết bị cầm tay. Nhân viên bếp chạm màn hình để đổi trạng thái 'Chờ' → 'Đang làm' → 'Đã xong'.", bold_prefix="KDS Maker: ")
    add_bullet(doc, "Màn hình trung tâm tổng hợp toàn bộ món đang chờ trên các bàn. Tính năng nổi bật nhất là Gom đơn (Batching): Tổng hợp các món giống nhau (ví dụ 8 bàn cùng gọi Mì Ý, tổng 12 đĩa) để đầu bếp nấu chung một mẻ lớn nhằm tăng năng suất.", bold_prefix="KDS Control: ")
    add_bullet(doc, "Ứng dụng iPOS Booking ghi chép lịch hẹn tại quầy và in nhiệt phiếu chế biến K80 phân luồng theo trạm bếp.", bold_prefix="Đặt bàn & In ấn: ")

    add_p(doc, 
        "Hạn chế đối với Fine Dining:")
    add_bullet(doc, "Trong Fine Dining, mỗi đĩa ăn của từng bàn là một tác phẩm độc bản với thời gian chín, nhiệt độ thịt và độ đậm sốt điều chỉnh riêng cho từng khách. Việc gom mẻ nấu chung là điều tối kỵ.", bold_prefix="Xung đột triết lý chế biến: ")
    add_bullet(doc, "iPOS không có khái niệm Pacing theo Course. Toàn bộ món của bàn (từ khai vị đến tráng miệng) khi gửi vào bếp sẽ đồng loạt hiển thị trên KDS, khiến đầu bếp không biết món nào cần giữ lại (Hold) và món nào cần kích hoạt nấu (Fire).", bold_prefix="Thiếu Pacing tuần tự: ")
    add_bullet(doc, "iPOS Booking chỉ dừng lại ở ghi chép lịch hẹn hoặc cọc cố định tại quầy, chưa hỗ trợ cổng thanh toán trực tuyến tự động giải phóng bàn sau 17 phút và tự động cấn trừ cọc trên hóa đơn thanh toán.", bold_prefix="Bất cập quản lý cọc: ")

    add_h2(doc, "2.3 Khảo sát thực tế giải pháp MISA CukCuk")
    add_p(doc, 
        "MISA CukCuk là giải pháp quản trị nhà hàng đa chuỗi mạnh về kế toán kho:")
    add_bullet(doc, "Chạy trên máy tính bảng hoặc điện thoại, cho phép bếp xem món cần chế biến theo bàn hoặc theo thời gian gọi.", bold_prefix="App Bếp/Bar: ")
    add_bullet(doc, "Cho phép nhân viên phục vụ phân nhóm món ăn thành từng đợt trả món (Đợt 1: Khai vị, Đợt 2: Món chính, Đợt 3: Tráng miệng).", bold_prefix="Tính năng 'Lượt phục vụ': ")
    add_bullet(doc, "Quản lý định lượng kho nguyên vật liệu chính xác, kết nối xuất hóa đơn điện tử Meinvoice hợp chuẩn cơ quan thuế.", bold_prefix="Kế toán & Kho: ")

    add_p(doc, 
        "Hạn chế đối với Fine Dining:")
    add_bullet(doc, "Tính năng 'Lượt phục vụ' của CukCuk hoàn toàn tĩnh và thủ công. Phục vụ phải tự nhớ thời gian khách dùng xong để bấm nút chuyển đợt tiếp theo. Hệ thống không có đồng hồ đếm ngược thời gian chuẩn bị (Prep SLA) động, không thể tự động kích hoạt 'Fire' đón đầu thời điểm hoàn tất của món trước.", bold_prefix="Lượt phục vụ tĩnh & lệ thuộc con người: ")
    add_bullet(doc, "App Bếp bắt buộc đầu bếp phải liên tục chạm tay vào màn hình tablet. Trong môi trường bếp nóng fine dining (tiếp xúc bơ mỡ, nước sốt hoặc đeo găng vô trùng), thao tác chạm gây nguy cơ nhiễm khuẩn chéo và nhanh hỏng thiết bị.", bold_prefix="Rủi ro an toàn vệ sinh do tương tác chạm: ")
    add_bullet(doc, "Hoàn toàn thiếu vắng cơ chế điều phối rượu vang đồng bộ (Wine Pairing) đón đầu cho chuyên gia Sommelier.", bold_prefix="Thiếu đồng bộ phục vụ rượu: ")

    add_h2(doc, "2.4 Khảo sát thực tế giải pháp KiotViet F&B")
    add_p(doc, 
        "KiotViet F&B là nền tảng quản lý bán hàng phổ biến nhờ giao diện thân thiện và chi phí hợp lý:")
    add_bullet(doc, "Chia thành hai cột trực quan: Cột trái liệt kê món đang chờ chế biến; Cột phải hiển thị món đã nấu xong chờ nhân viên mang ra.", bold_prefix="Màn hình Nhà bếp 2 cột: ")
    add_bullet(doc, "Cho phép gắn cờ ưu tiên (dấu sao) cho món cụ thể để đẩy lên đầu hàng đợi bếp khi khách đang vội.", bold_prefix="Tính năng 'Đặt ưu tiên': ")

    add_p(doc, 
        "Hạn chế đối với Fine Dining:")
    add_bullet(doc, "Cơ chế danh sách phẳng (Flat List) 2 cột làm vỡ vụn trải nghiệm của bữa tiệc Fine Dining; không hiển thị được mối tương quan tổng thể giữa các giai đoạn của thực đơn nếm thử.", bold_prefix="Vỡ vụn bức tranh bàn tiệc: ")
    add_bullet(doc, "Tính năng 'Đặt ưu tiên' chỉ là giải pháp tình thế cục bộ, không thể điều phối nhịp nhàng liên trạm (Bếp lạnh, Bếp nóng, Bếp bánh) để các món trong cùng một Course mạ đĩa đồng thời.", bold_prefix="Không điều phối được liên trạm: ")
    add_bullet(doc, "Hoàn toàn không có giải pháp màn hình tại bàn (TableDisplay) kết nối thông tin thời gian thực cho thực khách.", bold_prefix="Thiếu phân hệ kết nối thực khách: ")

    add_h2(doc, "2.5 Khảo sát các giải pháp quốc tế (OpenTable, SevenRooms, Toast POS)")
    add_p(doc, 
        "Trên thị trường quốc tế, OpenTable và SevenRooms là tiêu chuẩn vàng cho nhà hàng Michelin nhờ hồ sơ khách hàng (Guest CRM) chi tiết và cọc qua thẻ quốc tế (Stripe). Toast POS cung cấp phần cứng chuyên biệt cho ngành F&B. Tuy nhiên, việc áp dụng tại Việt Nam gặp phải các rào cản bất khả thi:")
    add_bullet(doc, "Phí bản quyền từ 249 đến 700 USD/tháng, cộng phí hoa hồng 1 - 2.5 USD/khách đặt chỗ thành công — gánh nặng chi phí định kỳ quá lớn.", bold_prefix="Chi phí bản quyền quá cao: ")
    add_bullet(doc, "Không hỗ trợ các phương thức thanh toán nội địa phổ biến (VNPAY, VietQR, MoMo); chỉ chấp nhận thẻ tín dụng quốc tế qua Stripe.", bold_prefix="Không tích hợp cổng thanh toán nội địa: ")
    add_bullet(doc, "Máy chủ đặt ở nước ngoài gây độ trễ mạng và toàn bộ giao diện tiếng Anh gây trở ngại lớn cho nhân sự phổ thông tại Việt Nam.", bold_prefix="Bất đồng ngôn ngữ & độ trễ mạng: ")

    doc.add_page_break()

    # =========================================================================
    # CHƯƠNG 3: PHÂN TÍCH KHOẢNG TRỐNG VẬN HÀNH (PAGE 7)
    # =========================================================================
    add_h1(doc, "CHƯƠNG 3: PHÂN TÍCH KHOẢNG TRỐNG VẬN HÀNH (GAP ANALYSIS) VÀ MA TRẬN SO SÁNH TÍNH NĂNG")
    
    add_h2(doc, "3.1 Phân tích các khoảng trống vận hành cốt lõi (Core Operational Gaps)")
    add_p(doc, 
        "Từ kết quả khảo sát thực tế, nhóm nghiên cứu xác lập 6 khoảng trống vận hành cốt lõi mà một hệ thống chuyên biệt cho Fine Dining tại Việt Nam bắt buộc phải giải quyết:")

    add_p(doc, 
        "Trong Fine Dining, món Khai vị được phục vụ ngay, nhưng Món chính (Bò Wagyu A5, Cừu đút lò) mất 20-25 phút chế biến chuẩn nhiệt kế lõi và chỉ được kích hoạt khi khách sắp hoàn thành món trước. Khoảng trống công nghệ là hệ thống cần tự động tính toán thời gian chuẩn bị (Prep SLA) để phát lệnh 'Auto-Fire' đón đầu cho bếp mà không cần phục vụ phải nhớ canh giờ bấm tay.",
        bold_prefix="Khoảng trống 1: Cơ chế Hold & Fire tự động (Dynamic Course Pacing). ")

    add_p(doc, 
        "Rượu vang đi kèm từng món cần được rót trước khi đĩa ăn hạ xuống bàn từ 1-2 phút để rượu tiếp xúc không khí (thở) và đạt dải nhiệt độ phục vụ chuẩn xác. Các phần mềm thị trường hoàn toàn bỏ quên vai trò của Sommelier. Khoảng trống là hệ thống phải tự động bắn tín hiệu đồng bộ sang quầy Bar/Sommelier ngay khi bếp bước vào giai đoạn mạ đĩa cuối cùng.",
        bold_prefix="Khoảng trống 2: Đồng bộ nhịp phục vụ rượu vang đón đầu (Sommelier Early Sync). ")

    add_p(doc, 
        "Tại Fine Dining, đĩa ăn sau khi nấu xong bắt buộc phải trải qua Trạm Pass kiểm tra chất lượng 2 pha nghiêm ngặt: Pha 1 do Đầu bếp mạ đĩa đặt lên quầy; Pha 2 do Nhân viên Điều phối (Expediter) kiểm tra nhiệt độ, độ sạch mép đĩa, nước sốt và đối chiếu cảnh báo dị ứng trước khi ký duyệt 'Ready at Pass' để chuyển cho nhân viên bưng món.",
        bold_prefix="Khoảng trống 3: Trạm Pass QC 2 pha tách biệt (Two-Phase Pass Certification). ")

    add_p(doc, 
        "Các phần mềm hiện hành chỉ ghi chú chung cho cả bàn hoặc đơn hàng. Nhưng trong Fine Dining, mỗi món ăn cần gắn kèm ghi chú dị ứng và sở thích chế biến cụ thể (SpecialNotes trên từng OrderItem: bỏ tiêu, sốt riêng, kiêng giáp xác, không gluten), hiển thị bôi đậm cảnh báo nổi bật trên KDS Bếp và Pass Tablet để ngăn ngừa tuyệt đối sốc phản vệ thực phẩm.",
        bold_prefix="Khoảng trống 4: Quản lý cảnh báo dị ứng chi tiết theo món ăn (Item-level Special Notes). ")

    add_p(doc, 
        "Các E-Menu thông thường ép khách tự bấm chọn món hoặc có nút gọi phục vụ / yêu cầu thanh toán gây gián đoạn không gian tiệc. Khoảng trống cần lấp đầy là hệ sinh thái thiết bị kép (Dual Display): (1) Tablet E-Menu cầm tay (EMenuTablet) 100% chỉ xem (Passive View-only, tuyệt đối KHÔNG có nút bấm tương tác: không nút 'Gọi phục vụ', không nút 'Yêu cầu tính tiền', không giỏ hàng, không tự đặt món); và (2) Màn hình TableDisplay cố định tại bàn (Zero-Touch): hiển thị số bàn, luồng tiến độ món ăn ('Bếp đang chuẩn bị', 'Món đang được dọn lên!') và tự động hiển thị bảng kê hóa đơn cấn trừ cọc kèm mã VietQR động khi khách yêu cầu thanh toán với Waitstaff.",
        bold_prefix="Khoảng trống 5: Kiến trúc Thiết bị Kép tại bàn (Dual Display: EMenuTablet & TableDisplay). ")

    add_p(doc, 
        "Để triệt tiêu tổn thất bùng bàn (No-show), việc thu cọc trực tuyến và cấn trừ tự động là then chốt. Khoảng trống là cơ chế khóa giữ bàn tạm thời (17 phút) liên kết trực tiếp qua Webhook IPN của VNPAY, đồng thời tự động nhận diện và cấn trừ 100% khoản cọc vào hóa đơn thanh toán cuối bữa mà không cho phép thu ngân chỉnh sửa tay.",
        bold_prefix="Khoảng trống 6: Tự động cấn trừ 100% tiền cọc qua cổng VNPAY trên hóa đơn. ")

    # Ngắt trang để đưa Bảng ma trận 16 tiêu chí trọn vẹn lên Page 8
    doc.add_page_break()

    # =========================================================================
    # MA TRẬN SO SÁNH 16 TIÊU CHÍ (PAGE 8)
    # =========================================================================
    add_h2(doc, "3.2 Bảng ma trận so sánh tính năng thực tế 100% giữa 4 hệ thống")
    add_p(doc, 
        "Bảng ma trận so sánh toàn diện 16 tiêu chí chức năng dựa trên điều tra thực tế độc lập giữa iPOS.vn, MISA CukCuk, KiotViet F&B và Hệ thống VinDining đề xuất:")

    # BẢNG MA TRẬN SO SÁNH 16 TIÊU CHÍ (6.5 inches)
    tbl_matrix = doc.add_table(rows=17, cols=5)
    matrix_widths = [Inches(2.1), Inches(1.0), Inches(1.0), Inches(1.0), Inches(1.4)]
    
    headers_matrix = ["Tiêu Chí Khảo Sát & So Sánh", "iPOS.vn", "MISA CukCuk", "KiotViet F&B", "VinDining (Đề xuất)"]
    for idx, h in enumerate(headers_matrix):
        tbl_matrix.rows[0].cells[idx].paragraphs[0].add_run(h)
        
    matrix_data = [
        # Nhóm 1: Đặt bàn & Cọc
        ("1. Đặt bàn trực tuyến cổng VNPAY", "Không (Chỉ ghi nhận)", "Không có", "Không có", "Có (Tích hợp VNPAY IPN)"),
        ("2. Khóa giữ bàn tạm thời (Locking)", "Không hỗ trợ", "Không hỗ trợ", "Không hỗ trợ", "Tự động khóa 17 phút"),
        ("3. Tự động cấn trừ 100% cọc trên Hóa đơn", "Thủ công (Nhập tay)", "Thủ công (Nhập tay)", "Thủ công (Nhập tay)", "Tự động 100% hệ thống"),
        
        # Nhóm 2: Bếp KDS & Pacing
        ("4. Màn hình Bếp KDS chuyên biệt", "Có (KDS Maker/Control)", "Có (App Bếp/Bar)", "Có (Màn hình 2 cột)", "Có (KDS hiển thị trạm)"),
        ("5. Cơ chế Pacing theo Course tuần tự", "Không (Đẩy đồng loạt)", "Thủ công (Lượt phục vụ)", "Không hỗ trợ", "Tự động (Hold & Fire SLA)"),
        ("6. Tương tác KDS Bếp chống bám bẩn", "Chạm màn hình cảm ứng", "Chạm màn hình cảm ứng", "Chạm màn hình cảm ứng", "Rảnh tay (Hands-free view)"),
        ("7. Đồng hồ đếm ngược Prep SLA món", "Đếm tăng đơn thuần", "Đếm tăng đơn thuần", "Không có", "Đếm ngược linh hoạt theo món"),
        
        # Nhóm 3: Pass QC & Sommelier
        ("8. Trạm Pass QC 2 pha (Chef & Pass)", "Không (Bếp trả chung)", "Không (Bếp trả chung)", "Không (Bếp trả chung)", "Có (Quy trình 2 pha tách biệt)"),
        ("9. Tín hiệu đồng bộ Wine Pairing đón đầu", "Không có", "Không có", "Không có", "Có (Bắn tín hiệu Sommelier)"),
        
        # Nhóm 4: Phục vụ & Trải nghiệm khách
        ("10. Quản lý dị ứng & ghi chú món ăn", "Ghi chú chung cả bàn", "Ghi chú chung cả bàn", "Ghi chú chung cả bàn", "Chi tiết từng món (SpecialNotes)"),
        ("11. Màn hình TableDisplay không chạm tại bàn", "Không có", "Không có", "Không có", "Có (Zero-Touch kết nối khách)"),
        ("12. Thông báo món sắp ra bàn thời gian thực", "Gọi miệng / Rung chuông", "Rung chuông / Gọi miệng", "Gọi miệng / Nhìn cột", "Thông báo trên TableDisplay"),
        
        # Nhóm 5: Công nghệ & Chi phí
        ("13. Cơ chế giao tiếp thời gian thực", "HTTP Polling (Độ trễ cao)", "HTTP Polling (Độ trễ cao)", "HTTP Polling (Độ trễ cao)", "SignalR WebSockets (<100ms)"),
        ("14. Tương thích thiết bị phần cứng", "Máy POS chuyên dụng", "Tablet / Điện thoại", "Tablet / Điện thoại", "Đa nền tảng Web Responsive"),
        ("15. Kiến trúc mở & Tự chủ mã nguồn", "Đóng (Phần mềm đóng)", "Đóng (Phần mềm đóng)", "Đóng (Phần mềm đóng)", "Mở (.NET 9 Clean Arch)"),
        ("16. Chi phí bản quyền định kỳ", "Thuê bao tháng/năm", "Thuê bao tháng/năm", "Thuê bao tháng/năm", "Miễn phí bản quyền phần mềm")
    ]
    
    for r_idx, row_data in enumerate(matrix_data, start=1):
        for c_idx, val in enumerate(row_data):
            cell = tbl_matrix.rows[r_idx].cells[c_idx]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx >= 1 else WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            if c_idx == 4:
                r.font.bold = True
                r.font.color.rgb = COLOR_NAVY
            elif "Không" in val:
                r.font.color.rgb = COLOR_MUTED
                
    set_compact_table_styling(tbl_matrix, matrix_widths, font_size=Pt(8.0))
    
    add_callout(doc, "Nhận xét ma trận", 
        "Kết quả so sánh khẳng định: Trong khi các phần mềm thị trường chiếm ưu thế ở tính đại chúng, VinDining tạo ra sự vượt trội mang tính đột phá ở 6 bài toán chuyên biệt của Fine Dining: Tự động hóa cọc VNPAY, Pacing món theo Course, Trạm Pass QC 2 pha, Cảnh báo dị ứng theo từng món ăn, Màn hình TableDisplay không chạm và kiến trúc SignalR độ trễ cực thấp.")

    # Ngắt trang để đưa Chương 4 sang Page 9
    doc.add_page_break()

    # =========================================================================
    # CHƯƠNG 4: BÁO CÁO ĐÁNH GIÁ TÍNH KHẢ THI (PAGE 9)
    # =========================================================================
    add_h1(doc, "CHƯƠNG 4: BÁO CÁO ĐÁNH GIÁ TÍNH KHẢ THI (FEASIBILITY STUDY)")
    
    add_p(doc, 
        "Nhóm nghiên cứu đã thẩm định tính khả thi toàn diện trên 4 phương diện: Kỹ thuật công nghệ, Quy trình vận hành, Hiệu quả kinh tế (ROI) và Khả năng kiểm soát tiến độ thời gian.")

    add_h2(doc, "4.1 Khảo sát nhu cầu các bên liên quan (Stakeholder Needs Assessment)")
    add_p(doc, 
        "Hệ thống đáp ứng kỳ vọng của 5 nhóm tác nhân chính tham gia vào chu trình vận hành nhà hàng:")

    # Bảng nhu cầu các bên liên quan (6.5 inches)
    tbl_sh = doc.add_table(rows=6, cols=3)
    sh_widths = [Inches(1.5), Inches(1.8), Inches(3.2)]
    
    headers_sh = ["Tác Nhân (Stakeholder)", "Kênh Tương Tác", "Kỳ Vọng & Yêu Cầu Cốt Lõi Hệ Thống"]
    for idx, h in enumerate(headers_sh):
        tbl_sh.rows[0].cells[idx].paragraphs[0].add_run(h)
        
    sh_data = [
        ("1. Thực khách (Guest)", 
         "Smartphone cá nhân, Tablet E-Menu (EMenuTablet) &\nTableDisplay tại bàn", 
         "Đặt bàn và cọc VNPAY an toàn không cần tài khoản; xem thực đơn qua EMenuTablet 100% view-only (không nút tương tác); theo dõi tiến trình dọn món và bảng kê hóa đơn kèm mã VietQR qua TableDisplay không chạm; thanh toán trực tiếp với Waitstaff; cấn trừ cọc chính xác 100%."),
        ("2. Nhân viên Phục vụ (Waitstaff)", 
         "Tablet di động cầm tay\n(Sảnh phục vụ)", 
         "Nắm bắt sơ đồ bàn thời gian thực; check-in đón khách nhanh; tạo đơn gọi món chi tiết kèm ghi chú; nhận thông báo tức thời khi trạm Pass xác nhận món sẵn sàng bưng ra."),
        ("3. Nhân viên Điều phối (Expediter)", 
         "Tablet cảm ứng cố định\ntại quầy Pass", 
         "Kiểm soát chất lượng đĩa ăn từ bếp chuyển ra; đối chiếu tiêu chuẩn trang trí và cảnh báo dị ứng; bấm xác nhận thông qua món kích hoạt thông báo sảnh và TableDisplay."),
        ("4. Đội ngũ Nhà bếp (Kitchen Ops)", 
         "Màn hình KDS gắn tường\ntại trạm chế biến", 
         "Quan sát rảnh tay (không chạm màn hình); nắm bắt thứ tự chuẩn bị theo nhịp Course; đồng hồ đếm ngược SLA rõ ràng; cảnh báo dị ứng hiển thị nổi bật màu đỏ."),
        ("5. Quản lý & Chủ nhà hàng (Manager)", 
         "Cổng thông tin Web Admin\n(Máy tính / Laptop)", 
         "Giám sát tỷ lệ lấp đầy bàn ăn; triệt tiêu hoàn toàn rủi ro bùng bàn; xem báo cáo doanh thu theo ca; kiểm soát phân quyền chặt chẽ và duyệt ngoại lệ hoàn tiền cọc an toàn.")
    ]
    
    for r_idx, row_data in enumerate(sh_data, start=1):
        for c_idx, val in enumerate(row_data):
            cell = tbl_sh.rows[r_idx].cells[c_idx]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx == 0 else WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            if c_idx == 0:
                r.font.bold = True
                r.font.color.rgb = COLOR_NAVY
                
    set_compact_table_styling(tbl_sh, sh_widths, font_size=Pt(8.0))

    add_h2(doc, "4.2 Đánh giá Tính khả thi Kỹ thuật, Vận hành & Kinh tế")
    add_bullet(doc, "Kiến trúc .NET 9 Web API Clean Architecture 4 tầng, CQRS MediatR, SignalR Hubs WebSockets (<100ms), React 19 SPA Vite Tailwind và VNPAY IPN bảo mật HMAC-SHA512. Khả thi 100%.", bold_prefix="Khả thi Kỹ thuật: ")
    add_bullet(doc, "Bảo tồn phong thái Fine Dining qua TableDisplay thụ động không chạm (Zero-Touch), KDS bếp quan sát rảnh tay (Hands-free) chống nhiễm khuẩn và thao tác Một chạm (One-touch) rút ngắn đào tạo dưới 30 phút.", bold_prefix="Khả thi Vận hành: ")
    add_bullet(doc, "Cắt giảm 95% tổn thất No-show (tiết kiệm 30-60 triệu VNĐ nguyên liệu nhập khẩu/tháng), loại bỏ 100% sai sót hóa đơn cấn cọc, tăng 15-20% công suất đón khách. Hoàn vốn đầu tư (ROI) chỉ từ 3-5 tháng.", bold_prefix="Khả thi Kinh tế: ")

    add_h2(doc, "4.3 Tính khả thi Thời gian & Lộ trình thực hiện 10 tuần")
    add_p(doc, 
        "Dự án được phân rã thành 5 giai đoạn phát triển trong tổng thời gian 10 tuần, phân công trách nhiệm rõ ràng cho 3 thành viên kỹ thuật:")

    # Bảng tiến độ 10 tuần (6.5 inches)
    tbl_plan = doc.add_table(rows=6, cols=4)
    plan_widths = [Inches(1.0), Inches(1.4), Inches(2.7), Inches(1.4)]
    
    headers_plan = ["Giai Đoạn", "Thời Gian", "Nội Dung Công Việc Chính", "Phụ Trách Chính"]
    for idx, h in enumerate(headers_plan):
        tbl_plan.rows[0].cells[idx].paragraphs[0].add_run(h)
        
    plan_data = [
        ("Phase 1", "Tuần 1 – 2", "Khảo sát hiện trạng, phỏng vấn chuyên gia, phân tích yêu cầu BRS/SRS và lập báo cáo nghiên cứu khả thi.", "Toàn đội ngũ\n(Quyền chủ trì)"),
        ("Phase 2", "Tuần 3 – 4", "Thiết kế kiến trúc hệ thống, mô hình CSDL quan hệ SQL Server, thiết kế giao diện UI/UX và đặc tả OpenAPI.", "Quyền (Kiến trúc)\nKhánh (Giao diện)"),
        ("Phase 3", "Tuần 5 – 6", "Dựng khung dự án Clean Architecture .NET 9, cấu hình SignalR Hubs, thiết lập CSDL và khung Frontend React.", "Quyền (Backend)\nĐạt (SignalR)"),
        ("Phase 4", "Tuần 7 – 8", "Lập trình tính năng cốt lõi: Đặt bàn cọc VNPAY, KDS Bếp Hold/Fire, Pass QC 2 pha, TableDisplay và Hóa đơn cấn cọc.", "Toàn đội ngũ\n(TDD & Code)"),
        ("Phase 5", "Tuần 9 – 10", "Kiểm thử tích hợp toàn diện, kiểm thử chịu tải kịch bản cao điểm, hoàn thiện tài liệu kỹ thuật và bảo vệ đồ án.", "Toàn đội ngũ\n(Kiểm thử & Đóng gói)")
    ]
    
    for r_idx, row_data in enumerate(plan_data, start=1):
        for c_idx, val in enumerate(row_data):
            cell = tbl_plan.rows[r_idx].cells[c_idx]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx in (0, 1) else WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            if c_idx == 0:
                r.font.bold = True
                r.font.color.rgb = COLOR_NAVY
                
    set_compact_table_styling(tbl_plan, plan_widths, font_size=Pt(8.0))

    # Ngắt trang để đưa Chương 5 sang Page 10
    doc.add_page_break()

    # =========================================================================
    # CHƯƠNG 5: KẾT LUẬN & ĐỊNH HƯỚNG GIẢI PHÁP HỆ THỐNG VINDINING (PAGE 10)
    # =========================================================================
    add_h1(doc, "CHƯƠNG 5: KẾT LUẬN & ĐỊNH HƯỚNG GIẢI PHÁP HỆ THỐNG VINDINING")
    
    add_h2(doc, "5.1 Tổng kết kết quả khảo sát và luận điểm khoa học")
    add_bullet(doc, "Nhận diện chính xác 4 khâu vận hành trọng yếu và thiết lập Ma trận Tổn thất thực tế (bùng bàn gây thất thu 12-18% doanh thu, rủi ro y tế do sót dị ứng, trễ nhiệt độ món ăn và mất thời gian đối soát cọc).", bold_prefix="Nghiệp vụ thực tế: ")
    add_bullet(doc, "Đánh giá khách quan năng lực thực tế của 3 phần mềm trong nước (iPOS Maker/Control, MISA App Bếp & Lượt phục vụ, KiotViet Màn hình 2 cột); khẳng định rõ sự thiếu vắng của giải pháp chuyên biệt cho ẩm thực cao cấp tại Việt Nam.", bold_prefix="Thị trường phần mềm: ")
    add_bullet(doc, "Xác lập 6 khoảng trống vận hành cốt lõi và xây dựng Ma trận 16 tiêu chí chức năng độc lập chứng minh sự ưu việt toàn diện của hệ thống VinDining đề xuất.", bold_prefix="Khoảng trống công nghệ: ")
    add_bullet(doc, "Chứng minh tính khả thi tuyệt đối trên cả 4 trục: Kỹ thuật (.NET 9 + React + SignalR), Vận hành (bảo tồn văn hóa Fine Dining), Kinh tế (ROI hoàn vốn 3-5 tháng) và Thời gian (lộ trình 10 tuần kiểm soát chặt chẽ).", bold_prefix="Tính khả thi toàn diện: ")

    add_h2(doc, "5.2 Định hướng kiến trúc chuyển tiếp sang Phase 2")
    add_bullet(doc, "Xây dựng tài liệu Thiết kế Kiến trúc Hệ thống (System Architecture Document — SAD) chi tiết hóa 4 tầng Clean Architecture, luồng MediatR CQRS và phân tách SignalR Hubs chuyên biệt.", bold_prefix="Thiết kế Kiến trúc Chi tiết: ")
    add_bullet(doc, "Thiết kế chuẩn hóa lược đồ Cơ sở dữ liệu quan hệ (Database Schema Design) trên SQL Server ở dạng chuẩn 3NF, thiết lập các ràng buộc toàn vẹn dữ liệu cho bàn tiệc, đặt chỗ, đơn hàng và hóa đơn cấn cọc.", bold_prefix="Thiết kế Mô hình Dữ liệu: ")
    add_bullet(doc, "Xây dựng đặc tả hợp đồng giao tiếp API theo chuẩn OpenAPI 3.1 giữa Backend Web API và các ứng dụng Frontend React / Mobile Tablet.", bold_prefix="Hợp đồng Giao tiếp OpenAPI: ")

    add_callout(doc, "Lời cam kết của nhóm phát triển", 
        "Hệ thống VinDining cam kết giải quyết triệt để các bài toán hóc búa của ẩm thực Fine Dining, mang lại một công cụ số hóa đẳng cấp, chuẩn mực, nâng tầm trải nghiệm ẩm thực cao cấp tại Việt Nam.")

    # Bảng chữ ký xác nhận của Nhóm sinh viên & Giảng viên hướng dẫn
    p_sig_space = doc.add_paragraph()
    p_sig_space.paragraph_format.space_before = Pt(16)
    p_sig_space.paragraph_format.space_after = Pt(0)
    
    tbl_sig = doc.add_table(rows=2, cols=2)
    tbl_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_widths_sig = [Inches(3.2), Inches(3.3)]
    
    c_sig0 = tbl_sig.rows[0].cells[0]
    p_s0 = c_sig0.paragraphs[0]
    p_s0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s0_1 = p_s0.add_run("GIẢNG VIÊN HƯỚNG DẪN\n")
    r_s0_1.font.bold = True
    r_s0_1.font.size = Pt(10.5)
    r_s0_1.font.color.rgb = COLOR_NAVY
    r_s0_2 = p_s0.add_run("(Ký và ghi rõ họ tên)\n\n\n\n\n")
    r_s0_2.font.italic = True
    r_s0_2.font.size = Pt(9.5)
    r_s0_3 = p_s0.add_run("ThS. Phạm Hữu Tùng")
    r_s0_3.font.bold = True
    r_s0_3.font.size = Pt(11)
    
    c_sig1 = tbl_sig.rows[0].cells[1]
    p_s1 = c_sig1.paragraphs[0]
    p_s1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s1_1 = p_s1.add_run("ĐẠI DIỆN NHÓM SINH VIÊN\n")
    r_s1_1.font.bold = True
    r_s1_1.font.size = Pt(10.5)
    r_s1_1.font.color.rgb = COLOR_NAVY
    r_s1_2 = p_s1.add_run("(Ký và ghi rõ họ tên)\n\n\n\n\n")
    r_s1_2.font.italic = True
    r_s1_2.font.size = Pt(9.5)
    r_s1_3 = p_s1.add_run("Nguyễn Mạnh Quyền (Trưởng nhóm)")
    r_s1_3.font.bold = True
    r_s1_3.font.size = Pt(11)
    
    # Bỏ viền bảng chữ ký
    tblSigPr = tbl_sig._tbl.tblPr
    tblSigPr.append(parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:left w:val="none"/><w:top w:val="none"/><w:bottom w:val="none"/>'
        f'<w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    ))

    # =========================================================================
    # ÁP DỤNG HEADER / FOOTER
    # =========================================================================
    add_header_footer(doc)
    
    # Lưu file Word
    doc.save(output_docx)
    print(f"Báo cáo Word đã được tạo thành công tại: {output_docx}")
    
    backup_docx = os.path.join(base_dir, "02_BAO_CAO_KHAO_SAT.docx")
    doc.save(backup_docx)
    print(f"Đã cập nhật bản backup tại: {backup_docx}")
    
    return output_docx

if __name__ == "__main__":
    create_survey_document()
