using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GameScore.Api.Migrations
{
    /// <inheritdoc />
    public partial class TemporizadorYPortadas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "QuestionShownAt",
                table: "OlderNewerRuns",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateTable(
                name: "CoverQuizRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    Round = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: false),
                    Attempts = table.Column<int>(type: "integer", nullable: false),
                    RoundOver = table.Column<bool>(type: "boolean", nullable: false),
                    Finished = table.Column<bool>(type: "boolean", nullable: false),
                    GameId = table.Column<int>(type: "integer", nullable: false),
                    GameName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    CoverUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    UsedGameIds = table.Column<int[]>(type: "integer[]", nullable: false),
                    RoundStartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoverQuizRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CoverQuizRuns_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CoverQuizRuns_UpdatedAt",
                table: "CoverQuizRuns",
                column: "UpdatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CoverQuizRuns_UserId_Score",
                table: "CoverQuizRuns",
                columns: new[] { "UserId", "Score" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CoverQuizRuns");

            migrationBuilder.DropColumn(
                name: "QuestionShownAt",
                table: "OlderNewerRuns");
        }
    }
}
