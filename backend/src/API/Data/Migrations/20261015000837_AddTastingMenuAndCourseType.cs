using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTastingMenuAndCourseType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CourseType",
                table: "MenuItems",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Appetizer");

            migrationBuilder.AddColumn<int>(
                name: "PrepTimeMinutes",
                table: "MenuItems",
                type: "int",
                nullable: false,
                defaultValue: 15);

            migrationBuilder.CreateTable(
                name: "TastingMenus",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TastingMenus", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TastingMenuItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TastingMenuId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MenuItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CourseOrder = table.Column<int>(type: "int", nullable: false),
                    CourseType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Appetizer")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TastingMenuItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TastingMenuItems_MenuItems_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "MenuItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TastingMenuItems_TastingMenus_TastingMenuId",
                        column: x => x.TastingMenuId,
                        principalTable: "TastingMenus",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MenuItems_CourseType",
                table: "MenuItems",
                column: "CourseType");

            migrationBuilder.CreateIndex(
                name: "IX_TastingMenuItems_MenuItemId",
                table: "TastingMenuItems",
                column: "MenuItemId");

            migrationBuilder.CreateIndex(
                name: "IX_TastingMenuItems_TastingMenuId_CourseOrder",
                table: "TastingMenuItems",
                columns: new[] { "TastingMenuId", "CourseOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_TastingMenus_IsActive",
                table: "TastingMenus",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_TastingMenus_Name",
                table: "TastingMenus",
                column: "Name");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TastingMenuItems");

            migrationBuilder.DropTable(
                name: "TastingMenus");

            migrationBuilder.DropIndex(
                name: "IX_MenuItems_CourseType",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "CourseType",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "PrepTimeMinutes",
                table: "MenuItems");
        }
    }
}
