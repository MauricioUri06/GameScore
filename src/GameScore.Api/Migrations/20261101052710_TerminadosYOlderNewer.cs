using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GameScore.Api.Migrations
{
    /// <inheritdoc />
    public partial class TerminadosYOlderNewer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OlderNewerRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    Score = table.Column<int>(type: "integer", nullable: false),
                    Finished = table.Column<bool>(type: "boolean", nullable: false),
                    LeftGameId = table.Column<int>(type: "integer", nullable: false),
                    LeftName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    LeftCover = table.Column<string>(type: "text", nullable: true),
                    LeftYear = table.Column<int>(type: "integer", nullable: false),
                    RightGameId = table.Column<int>(type: "integer", nullable: false),
                    RightName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    RightCover = table.Column<string>(type: "text", nullable: true),
                    RightYear = table.Column<int>(type: "integer", nullable: false),
                    UsedGameIds = table.Column<int[]>(type: "integer[]", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OlderNewerRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OlderNewerRuns_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OlderNewerRuns_UpdatedAt",
                table: "OlderNewerRuns",
                column: "UpdatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_OlderNewerRuns_UserId_Score",
                table: "OlderNewerRuns",
                columns: new[] { "UserId", "Score" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OlderNewerRuns");
        }
    }
}
