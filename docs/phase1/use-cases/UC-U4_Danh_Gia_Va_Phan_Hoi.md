```plantuml
@startuml SD_UC_U4_Submit_Feedback
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

actor "Khách hàng" as Guest
boundary "Giao diện Web" as UI
control "FeedbackController" as Controller
participant "FeedbackService" as Service
participant "FeedbackRepository" as Repo
database "SQL Server" as DB

Guest -> UI: Chấm sao (1-5) & nhập nhận xét
UI -> Controller: POST /api/feedbacks (BookingCode, Ratings, Comment)
Controller -> Service: SubmitFeedback(dto)
Service -> Repo: ValidateBooking(BookingCode)
Repo -> DB: SELECT Reservation WHERE Status = Completed
DB --> Repo: Valid
Repo --> Service: OK
Service -> Repo: SaveFeedback & UpdateCSAT(dto)
Repo -> DB: INSERT Feedback & UPDATE CSAT
DB --> Repo: OK
Repo --> Service: Saved
Service --> Controller: Result(Success)
Controller --> UI: 201 Created
UI --> Guest: Hiển thị thông báo cảm ơn
@enduml
```

