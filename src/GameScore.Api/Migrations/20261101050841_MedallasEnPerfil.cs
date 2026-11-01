using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GameScore.Api.Migrations
{
    /// <inheritdoc />
    public partial class MedallasEnPerfil : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "HoursPlayed",
                table: "CurrentlyPlaying",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.CreateTable(
                name: "PlayingJournalEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    GameId = table.Column<int>(type: "integer", nullable: false),
                    Text = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayingJournalEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlayingJournalEntries_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlayingJournalEntries_Games_GameId",
                        column: x => x.GameId,
                        principalTable: "Games",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserShowcaseMedals",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    MedalId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserShowcaseMedals", x => new { x.UserId, x.MedalId });
                    table.ForeignKey(
                        name: "FK_UserShowcaseMedals_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_CurrentlyPlaying_Hours",
                table: "CurrentlyPlaying",
                sql: "\"HoursPlayed\" >= 0");

            migrationBuilder.CreateIndex(
                name: "IX_PlayingJournalEntries_GameId",
                table: "PlayingJournalEntries",
                column: "GameId");

            migrationBuilder.CreateIndex(
                name: "IX_PlayingJournalEntries_UserId_GameId_CreatedAt",
                table: "PlayingJournalEntries",
                columns: new[] { "UserId", "GameId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlayingJournalEntries");

            migrationBuilder.DropTable(
                name: "UserShowcaseMedals");

            migrationBuilder.DropCheckConstraint(
                name: "CK_CurrentlyPlaying_Hours",
                table: "CurrentlyPlaying");

            migrationBuilder.DropColumn(
                name: "HoursPlayed",
                table: "CurrentlyPlaying");
        }
    }
}
