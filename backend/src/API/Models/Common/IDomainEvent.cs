namespace API.Models.Common;

public interface IDomainEvent
{
    DateTime OccurredOnUtc { get; }
}
