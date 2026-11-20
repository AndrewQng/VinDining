using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Data.Migrations
{
    /// <inheritdoc />
    public partial class SyncLiveFeBeSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CheckoutRequestedAt",
                table: "Tables",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CurrentGuestCount",
                table: "Tables",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "PrepTimeMinutes",
                table: "MenuItems",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldDefaultValue: 15);

            migrationBuilder.AddColumn<int>(
                name: "AmbienceRating",
                table: "Feedbacks",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FoodRating",
                table: "Feedbacks",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ServiceRating",
                table: "Feedbacks",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CheckoutRequestedAt",
                table: "Tables");

            migrationBuilder.DropColumn(
                name: "CurrentGuestCount",
                table: "Tables");

            migrationBuilder.DropColumn(
                name: "AmbienceRating",
                table: "Feedbacks");

            migrationBuilder.DropColumn(
                name: "FoodRating",
                table: "Feedbacks");

            migrationBuilder.DropColumn(
                name: "ServiceRating",
                table: "Feedbacks");

            migrationBuilder.AlterColumn<int>(
                name: "PrepTimeMinutes",
                table: "MenuItems",
                type: "int",
                nullable: false,
                defaultValue: 15,
                oldClrType: typeof(int),
                oldType: "int");
        }
    }
}
