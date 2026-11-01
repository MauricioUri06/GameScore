using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GameScore.Api.Migrations
{
    /// <inheritdoc />
    public partial class Categorias : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CategoryRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    Round = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: false),
                    Lives = table.Column<int>(type: "integer", nullable: false),
                    RoundOver = table.Column<bool>(type: "boolean", nullable: false),
                    Finished = table.Column<bool>(type: "boolean", nullable: false),
                    Won = table.Column<bool>(type: "boolean", nullable: false),
                    GenreId = table.Column<int>(type: "integer", nullable: false),
                    GenreName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UsedGameIds = table.Column<int[]>(type: "integer[]", nullable: false),
                    UsedGenreIds = table.Column<int[]>(type: "integer[]", nullable: false),
                    TotalSeconds = table.Column<double>(type: "double precision", nullable: false),
                    RoundStartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoryRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CategoryRuns_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CategoryRuns_UpdatedAt",
                table: "CategoryRuns",
                column: "UpdatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CategoryRuns_UserId_Won_TotalSeconds",
                table: "CategoryRuns",
                columns: new[] { "UserId", "Won", "TotalSeconds" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CategoryRuns");
        }
    }
}
