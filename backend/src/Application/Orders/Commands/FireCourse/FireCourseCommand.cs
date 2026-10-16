using Domain.Enums;
using MediatR;

namespace Application.Orders.Commands.FireCourse;

public record FireCourseCommand(
    Guid OrderId,
    CourseType CourseType,
    bool IsPriority = false
) : IRequest<int>;
