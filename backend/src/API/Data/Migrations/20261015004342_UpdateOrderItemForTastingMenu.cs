using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateOrderItemForTastingMenu : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "MenuItemId",
                table: "OrderItems",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<Guid>(
                name: "TastingMenuId",
                table: "OrderItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_TastingMenuId",
                table: "OrderItems",
                column: "TastingMenuId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_TastingMenus_TastingMenuId",
                table: "OrderItems",
                column: "TastingMenuId",
                principalTable: "TastingMenus",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_TastingMenus_TastingMenuId",
                table: "OrderItems");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_TastingMenuId",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "TastingMenuId",
                table: "OrderItems");

            migrationBuilder.AlterColumn<Guid>(
                name: "MenuItemId",
                table: "OrderItems",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);
        }
    }
}
