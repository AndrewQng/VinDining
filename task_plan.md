# Phase 1 Task Plan: Requirements Engineering & System Analysis (Weeks 1–2)

## Goal
Hoàn thiện toàn bộ bộ tài liệu Phase 1 của dự án Quản lý nhà hàng Fine Dining theo đúng chuẩn học thuật và quy định kỹ thuật:
1. Project Proposal (chuẩn hóa, loại bỏ xung đột phạm vi delivery/fine-dining)
2. Báo cáo khảo sát hệ thống (Khảo sát hiện trạng, giải pháp thị trường, tính khả thi)
3. Báo cáo phân tích hệ thống (SRS/BRS, Use Case Specifications & Diagrams, Activity Diagrams, Sequence Diagrams)

## Current Phase
Phase 1: Gap Analysis & Phase 1 Planning

## Status
- **Status:** in_progress

## Next Step
Trình bày báo cáo khoảng cách (Gap Analysis) chi tiết và lộ trình triển khai hoàn thiện 3 tài liệu của Phase 1 cho người dùng.

## Phases

### Phase 1: Gap Analysis & Requirement Baseline (Week 1)
- [x] Đọc và trích xuất nội dung `PROJECT PROPOSAL.docx` v1 vào `findings.md`.
- [x] Rà soát đối chiếu yêu cầu Phase 1 và quy chuẩn kỹ thuật tại `AGENTS.md`.
- [ ] Phân tích chi tiết các điểm thiếu sót, xung đột phạm vi (Delivery vs Fine Dining) và các hạng mục cần bổ sung.
- **Status:** in_progress

### Phase 2: Refine & Standardize Project Proposal (Week 1)
- [ ] Cập nhật thông tin sinh viên, GVHD, mã số SV.
- [ ] Thống nhất 100% phạm vi nghiệp vụ: tập trung Fine Dining Restaurant Management (bỏ tàn dư Online Delivery/Shipper ngoài lề gây loãng).
- [ ] Hoàn thiện các mục mục tiêu, kiến trúc, công nghệ, kế hoạch 10 tuần.
- [ ] Xuất bản tài liệu `docs/01_PROJECT_PROPOSAL.md`.
- **Status:** pending

### Phase 3: Báo cáo khảo sát hệ thống (System Survey Report) (Week 1 - 2)
- [ ] Khảo sát hiện trạng quy trình vận hành nhà hàng truyền thống & pain points.
- [ ] Đánh giá so sánh các giải pháp trên thị trường (iPOS, CukCuk, Toast POS, OpenTable).
- [ ] Khảo sát chân dung & yêu cầu các nhóm người dùng (Guest, Host, Waiter, Chef, Manager, Admin).
- [ ] Đánh giá tính khả thi kỹ thuật (.NET 9, Clean Architecture, React, SignalR, SQL Server) và kinh tế/vận hành.
- [ ] Xuất bản tài liệu `docs/02_BAO_CAO_KHAO_SAT_HE_THONG.md`.
- **Status:** pending

### Phase 4: Báo cáo phân tích hệ thống (System Analysis & UML Models) (Week 2)
- [ ] Đặc tả chi tiết User Stories theo Mike Cohn + Gherkin Acceptance Criteria.
- [ ] Xây dựng bảng phân rã và đặc tả chi tiết Use Case (Use Case Specs).
- [ ] Thiết kế Use Case Diagrams (Tổng thể & Phân hệ).
- [ ] Thiết kế Activity Diagrams cho các luồng nghiệp vụ phức tạp.
- [ ] Thiết kế Sequence Diagrams (QR Ordering SignalR, Reservation & Deposit, Course Firing & Serving Confirmation, Invoice Settlement).
- [ ] Xuất bản tài liệu `docs/03_BAO_CAO_PHAN_TICH_HE_THONG.md`.
- **Status:** pending

## Decisions Made
| ID | Decision | Rationale |
|---|---|---|
| DEC-01 | Thống nhất domain: Fine Dining Restaurant Management System | Loại bỏ phần giao hàng ngoài (delivery/shipping) từ bản nháp cũ, tập trung vào Reservation + Deposit, QR Self-Ordering, KDS Course Firing, Table Management, Invoice Settlement theo AGENTS.md. |
| DEC-02 | Lưu trữ tài liệu dạng Markdown chuẩn GitHub kèm Mermaid diagrams | Dễ dàng quản lý phiên bản trên Git, đồng thời hỗ trợ chuyển đổi sang Word/PDF khi cần nộp báo cáo. |

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
| Python terminal encoding cp1252 khi in UTF-8 | 1 | Đọc file docx và ghi trực tiếp ra `findings.md` với encoding `utf-8`. |
