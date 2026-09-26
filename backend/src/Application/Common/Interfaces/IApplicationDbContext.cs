using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Staff> Staffs { get; }
    DbSet<Guest> Guests { get; }
    DbSet<Table> Tables { get; }
    DbSet<Category> Categories { get; }
    DbSet<MenuItem> MenuItems { get; }
    DbSet<Reservation> Reservations { get; }
    DbSet<Deposit> Deposits { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<Invoice> Invoices { get; }
    DbSet<Feedback> Feedbacks { get; }

    int SaveChanges();
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
