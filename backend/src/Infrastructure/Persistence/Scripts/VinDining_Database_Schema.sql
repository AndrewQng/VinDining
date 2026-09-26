IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815131049_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetRoles] (
        [Id] uniqueidentifier NOT NULL,
        [Description] nvarchar(max) NULL,
        [Name] nvarchar(256) NULL,
        [NormalizedName] nvarchar(256) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815131049_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetUsers] (
        [Id] uniqueidentifier NOT NULL,
        [FullName] nvarchar(max) NOT NULL,
        [AvatarUrl] nvarchar(max) NULL,
        [RefreshToken] nvarchar(max) NULL,
        [RefreshTokenExpiryTime] datetime2 NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [IsActive] bit NOT NULL,
        [UserName] nvarchar(256) NULL,
        [NormalizedUserName] nvarchar(256) NULL,
        [Email] nvarchar(256) NULL,
        [NormalizedEmail] nvarchar(256) NULL,
        [EmailConfirmed] bit NOT NULL,
        [PasswordHash] nvarchar(max) NULL,
        [SecurityStamp] nvarchar(max) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [PhoneNumberConfirmed] bit NOT NULL,
        [TwoFactorEnabled] bit NOT NULL,
        [LockoutEnd] datetimeoffset NULL,
        [LockoutEnabled] bit NOT NULL,
        [AccessFailedCount] int NOT NULL,
        CONSTRAINT [PK_AspNetUsers] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815131049_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetRoleClaims] (
        [Id] int NOT NULL IDENTITY,
        [RoleId] uniqueidentifier NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoleClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815131049_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetUserClaims] (
        [Id] int NOT NULL IDENTITY,
        [UserId] uniqueidentifier NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815131049_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetUserLogins] (
        [LoginProvider] nvarchar(450) NOT NULL,
        [ProviderKey] nvarchar(450) NOT NULL,
        [ProviderDisplayName] nvarchar(max) NULL,
        [UserId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
        CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815131049_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetUserRoles] (
        [UserId] uniqueidentifier NOT NULL,
        [RoleId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_AspNetUserRoles] PRIMARY KEY ([UserId], [RoleId]),
        CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815131049_InitialCreate'
)
BEGIN
    CREATE TABLE [AspNetUserTokens] (
        [UserId] uniqueidentifier NOT NULL,
        [LoginProvider] nvarchar(450) NOT NULL,
        [Name] nvarchar(450) NOT NULL,
        [Value] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
        CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815131049_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AspNetRoleClaims_RoleId] ON [AspNetRoleClaims] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815131049_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [RoleNameIndex] ON [AspNetRoles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815131049_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AspNetUserClaims_UserId] ON [AspNetUserClaims] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815131049_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AspNetUserLogins_UserId] ON [AspNetUserLogins] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815131049_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AspNetUserRoles_RoleId] ON [AspNetUserRoles] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815131049_InitialCreate'
)
BEGIN
    CREATE INDEX [EmailIndex] ON [AspNetUsers] ([NormalizedEmail]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815131049_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UserNameIndex] ON [AspNetUsers] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815131049_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260815131049_InitialCreate', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    ALTER TABLE [AspNetUsers] ADD [StaffId] uniqueidentifier NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE TABLE [Categories] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [Description] nvarchar(500) NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Categories] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE TABLE [Guests] (
        [Id] uniqueidentifier NOT NULL,
        [FullName] nvarchar(150) NOT NULL,
        [PhoneNumber] nvarchar(20) NOT NULL,
        [Email] nvarchar(256) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Guests] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE TABLE [Staffs] (
        [Id] uniqueidentifier NOT NULL,
        [FullName] nvarchar(150) NOT NULL,
        [PhoneNumber] nvarchar(20) NOT NULL,
        [Username] nvarchar(100) NOT NULL,
        [Email] nvarchar(256) NOT NULL,
        [PasswordHash] nvarchar(500) NOT NULL,
        [Role] nvarchar(50) NOT NULL DEFAULT N'Waitstaff',
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Staffs] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE TABLE [Tables] (
        [Id] uniqueidentifier NOT NULL,
        [TableNumber] nvarchar(50) NOT NULL,
        [Capacity] int NOT NULL,
        [Zone] nvarchar(50) NOT NULL DEFAULT N'MainHall',
        [Status] nvarchar(50) NOT NULL DEFAULT N'Available',
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Tables] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE TABLE [MenuItems] (
        [Id] uniqueidentifier NOT NULL,
        [CategoryId] uniqueidentifier NOT NULL,
        [Name] nvarchar(150) NOT NULL,
        [Description] nvarchar(1000) NULL,
        [Price] decimal(18,2) NOT NULL,
        [ImageUrl] nvarchar(500) NULL,
        [Status] nvarchar(50) NOT NULL DEFAULT N'Available',
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_MenuItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MenuItems_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE TABLE [Reservations] (
        [Id] uniqueidentifier NOT NULL,
        [BookingCode] nvarchar(50) NOT NULL,
        [GuestId] uniqueidentifier NOT NULL,
        [TableId] uniqueidentifier NOT NULL,
        [ReservationTime] datetime2 NOT NULL,
        [Status] nvarchar(50) NOT NULL DEFAULT N'Pending',
        [Note] nvarchar(1000) NULL,
        [PartySize] int NOT NULL,
        [CancelledAt] datetime2 NULL,
        [CancelledReason] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Reservations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Reservations_Guests_GuestId] FOREIGN KEY ([GuestId]) REFERENCES [Guests] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Reservations_Tables_TableId] FOREIGN KEY ([TableId]) REFERENCES [Tables] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE TABLE [Deposits] (
        [Id] uniqueidentifier NOT NULL,
        [ReservationId] uniqueidentifier NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [TransactionId] nvarchar(100) NOT NULL,
        [PaymentMethod] nvarchar(50) NOT NULL,
        [Status] nvarchar(50) NOT NULL DEFAULT N'Pending',
        [PaidAt] datetime2 NULL,
        [RefundAmount] decimal(18,2) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Deposits] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Deposits_Reservations_ReservationId] FOREIGN KEY ([ReservationId]) REFERENCES [Reservations] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE TABLE [Feedbacks] (
        [Id] uniqueidentifier NOT NULL,
        [ReservationId] uniqueidentifier NOT NULL,
        [Rating] float NOT NULL,
        [Comment] nvarchar(1000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Feedbacks] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Feedbacks_Reservations_ReservationId] FOREIGN KEY ([ReservationId]) REFERENCES [Reservations] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE TABLE [Orders] (
        [Id] uniqueidentifier NOT NULL,
        [TableId] uniqueidentifier NOT NULL,
        [ReservationId] uniqueidentifier NULL,
        [CreateById] uniqueidentifier NOT NULL,
        [Status] nvarchar(50) NOT NULL DEFAULT N'Processing',
        [OpenedAt] datetime2 NOT NULL,
        [ClosedAt] datetime2 NULL,
        CONSTRAINT [PK_Orders] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Orders_Reservations_ReservationId] FOREIGN KEY ([ReservationId]) REFERENCES [Reservations] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_Orders_Staffs_CreateById] FOREIGN KEY ([CreateById]) REFERENCES [Staffs] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Orders_Tables_TableId] FOREIGN KEY ([TableId]) REFERENCES [Tables] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE TABLE [Invoices] (
        [Id] uniqueidentifier NOT NULL,
        [OrderId] uniqueidentifier NOT NULL,
        [SettleById] uniqueidentifier NOT NULL,
        [Subtotal] decimal(18,2) NOT NULL,
        [ServiceCharge] decimal(18,2) NOT NULL,
        [VatAmount] decimal(18,2) NOT NULL,
        [DeductedDeposit] decimal(18,2) NOT NULL,
        [PaymentMethod] nvarchar(50) NOT NULL DEFAULT N'Cash',
        [IsPaid] bit NOT NULL DEFAULT CAST(0 AS bit),
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Invoices] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Invoices_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Invoices_Staffs_SettleById] FOREIGN KEY ([SettleById]) REFERENCES [Staffs] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE TABLE [OrderItems] (
        [Id] uniqueidentifier NOT NULL,
        [OrderId] uniqueidentifier NOT NULL,
        [MenuItemId] uniqueidentifier NOT NULL,
        [Quantity] int NOT NULL,
        [UnitPrice] decimal(18,2) NOT NULL,
        [Status] nvarchar(50) NOT NULL DEFAULT N'Queued',
        [Note] nvarchar(500) NULL,
        [ServedById] uniqueidentifier NULL,
        [ServedAt] datetime2 NULL,
        CONSTRAINT [PK_OrderItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OrderItems_MenuItems_MenuItemId] FOREIGN KEY ([MenuItemId]) REFERENCES [MenuItems] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_OrderItems_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_OrderItems_Staffs_ServedById] FOREIGN KEY ([ServedById]) REFERENCES [Staffs] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_AspNetUsers_StaffId] ON [AspNetUsers] ([StaffId]) WHERE [StaffId] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Categories_Name] ON [Categories] ([Name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Deposits_ReservationId] ON [Deposits] ([ReservationId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Deposits_Status] ON [Deposits] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Deposits_TransactionId] ON [Deposits] ([TransactionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Feedbacks_Rating] ON [Feedbacks] ([Rating]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Feedbacks_ReservationId] ON [Feedbacks] ([ReservationId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Guests_PhoneNumber] ON [Guests] ([PhoneNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Invoices_IsPaid] ON [Invoices] ([IsPaid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Invoices_OrderId] ON [Invoices] ([OrderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Invoices_SettleById] ON [Invoices] ([SettleById]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_MenuItems_CategoryId] ON [MenuItems] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_MenuItems_CategoryId_Status] ON [MenuItems] ([CategoryId], [Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_MenuItems_Name] ON [MenuItems] ([Name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_MenuItems_Status] ON [MenuItems] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_OrderItems_MenuItemId] ON [OrderItems] ([MenuItemId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_OrderItems_OrderId] ON [OrderItems] ([OrderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_OrderItems_OrderId_Status] ON [OrderItems] ([OrderId], [Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_OrderItems_ServedById] ON [OrderItems] ([ServedById]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_OrderItems_Status] ON [OrderItems] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Orders_CreateById] ON [Orders] ([CreateById]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Orders_ReservationId] ON [Orders] ([ReservationId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Orders_Status] ON [Orders] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Orders_TableId] ON [Orders] ([TableId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Orders_TableId_Status] ON [Orders] ([TableId], [Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Reservations_BookingCode] ON [Reservations] ([BookingCode]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Reservations_GuestId] ON [Reservations] ([GuestId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Reservations_ReservationTime] ON [Reservations] ([ReservationTime]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Reservations_Status] ON [Reservations] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Reservations_TableId_ReservationTime] ON [Reservations] ([TableId], [ReservationTime]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Staffs_Email] ON [Staffs] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Staffs_Username] ON [Staffs] ([Username]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Tables_Status] ON [Tables] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Tables_TableNumber] ON [Tables] ([TableNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    CREATE INDEX [IX_Tables_Zone] ON [Tables] ([Zone]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    ALTER TABLE [AspNetUsers] ADD CONSTRAINT [FK_AspNetUsers_Staffs_StaffId] FOREIGN KEY ([StaffId]) REFERENCES [Staffs] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926130704_AddDatabaseDesign'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260926130704_AddDatabaseDesign', N'9.0.2');
END;

COMMIT;
GO

