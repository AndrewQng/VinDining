using Application.Common.Interfaces;
using Domain.Common;
using Domain.Entities;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>, IApplicationDbContext
{
    public DbSet<Staff> Staffs => Set<Staff>();
    public DbSet<Guest> Guests => Set<Guest>();
    public DbSet<Table> Tables => Set<Table>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Deposit> Deposits => Set<Deposit>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();
    public DbSet<TastingMenu> TastingMenus => Set<TastingMenu>();
    public DbSet<TastingMenuItem> TastingMenuItems => Set<TastingMenuItem>();

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override int SaveChanges()
    {
        UpdateAuditFields();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateAuditFields();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateAuditFields()
    {
        var utcNow = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<IHasCreatedAt>())
        {
            if (entry.State == EntityState.Added && entry.Entity.CreatedAt == default)
            {
                entry.Entity.CreatedAt = utcNow;
            }
        }
    }
}
