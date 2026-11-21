using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddReservationPreOrderedTastingMenu : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PreOrderedTastingMenuId",
                table: "Reservations",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_PreOrderedTastingMenuId",
                table: "Reservations",
                column: "PreOrderedTastingMenuId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reservations_TastingMenus_PreOrderedTastingMenuId",
                table: "Reservations",
                column: "PreOrderedTastingMenuId",
                principalTable: "TastingMenus",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.Sql(@"
EXEC(N'
UPDATE r
SET
    r.[PreOrderedTastingMenuId] = tm.[Id],
    r.[Note] = CASE
        WHEN NULLIF(LTRIM(RTRIM(parsed.[CleanedNote])), N'''') IS NULL THEN NULL
        ELSE LTRIM(RTRIM(parsed.[CleanedNote]))
    END
FROM [Reservations] AS r
CROSS APPLY (
    SELECT CHARINDEX(N''[Set Menu đặt trước: '', r.[Note]) AS [StartIdx]
) AS s
CROSS APPLY (
    SELECT CHARINDEX(N'')]'', r.[Note], s.[StartIdx] + 21) AS [CloseIdx]
) AS c
CROSS APPLY (
    SELECT
        CASE
            WHEN c.[CloseIdx] >= s.[StartIdx] + 60
                 AND SUBSTRING(r.[Note], c.[CloseIdx] - 38, 2) = N'' (''
            THEN TRY_CONVERT(uniqueidentifier, SUBSTRING(r.[Note], c.[CloseIdx] - 36, 36))
            ELSE NULL
        END AS [ParsedMenuId],
        CASE
            WHEN UNICODE(SUBSTRING(r.[Note], c.[CloseIdx] + 2, 1)) = 32
            THEN STUFF(r.[Note], s.[StartIdx], c.[CloseIdx] - s.[StartIdx] + 3, N'''')
            ELSE STUFF(r.[Note], s.[StartIdx], c.[CloseIdx] - s.[StartIdx] + 2, N'''')
        END AS [CleanedNote]
) AS parsed
INNER JOIN [TastingMenus] AS tm
    ON tm.[Id] = parsed.[ParsedMenuId]
WHERE r.[Note] IS NOT NULL
  AND s.[StartIdx] > 0
  AND c.[CloseIdx] > 0
  AND parsed.[ParsedMenuId] IS NOT NULL;
');
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
UPDATE r
SET r.[Note] = LEFT(
    CASE
        WHEN r.[Note] IS NULL OR NULLIF(LTRIM(RTRIM(r.[Note])), N'') IS NULL
        THEN N'[Set Menu đặt trước: ' + tm.[Name] + N' (' + LOWER(CONVERT(nvarchar(36), tm.[Id])) + N')]'
        ELSE N'[Set Menu đặt trước: ' + tm.[Name] + N' (' + LOWER(CONVERT(nvarchar(36), tm.[Id])) + N')] ' + r.[Note]
    END,
    1000)
FROM [Reservations] AS r
INNER JOIN [TastingMenus] AS tm
    ON tm.[Id] = r.[PreOrderedTastingMenuId]
WHERE r.[PreOrderedTastingMenuId] IS NOT NULL;
");

            migrationBuilder.DropForeignKey(
                name: "FK_Reservations_TastingMenus_PreOrderedTastingMenuId",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_PreOrderedTastingMenuId",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "PreOrderedTastingMenuId",
                table: "Reservations");
        }
    }
}
