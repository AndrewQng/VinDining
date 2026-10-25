```plantuml
@startuml SD_UC_A4_Manage_Staff_Accounts
autonumber
skinparam style strictuml
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam defaultFontSize 16
skinparam sequenceActorFontSize 16
skinparam sequenceParticipantFontSize 16
skinparam sequenceArrowFontSize 15
skinparam sequenceGroupFontSize 15
skinparam sequenceGroupHeaderFontSize 15

actor "Quản trị viên" as Admin
boundary "Giao diện Web" as UI
control "AdminStaffController" as Controller
participant "StaffService" as Service
participant "StaffRepository" as Repo
database "SQL Server" as DB
participant "Email Service" as MailService

Admin -> UI: Nhập họ tên, email, vai trò & bấm Tạo tài khoản
UI -> Controller: POST /api/admin/staff (FullName, Email, Role)
Controller -> Service: CreateStaffAccount(dto)
Service -> Repo: InsertUserAndRole(dto)
Repo -> DB: INSERT Users & UserRoles (ASP.NET Identity)
DB --> Repo: OK(UserId)
Repo --> Service: Saved(UserId, TempPassword)
Service -> MailService: SendActivationEmail(Email, TempPassword)
MailService --> Service: Sent
Service --> Controller: Result(Success, UserId)
Controller --> UI: 201 Created
UI --> Admin: Hiển thị thông báo đã gửi email kích hoạt

opt Khóa tài khoản khi nghỉ việc
    Admin -> UI: Chọn nhân sự & bấm Khóa tài khoản
    UI -> Controller: PATCH /api/admin/staff/{id}/status (IsActive: false)
    Controller -> Service: LockStaffAccount(id)
    Service -> Repo: DeactivateUser(id)
    Repo -> DB: UPDATE Users SET IsActive = false
    DB --> Repo: OK
    Repo --> Service: OK
    Service --> Controller: Result(Success)
    Controller --> UI: 200 OK
    UI --> Admin: Cập nhật trạng thái tài khoản Đã khóa
end
@enduml
```

