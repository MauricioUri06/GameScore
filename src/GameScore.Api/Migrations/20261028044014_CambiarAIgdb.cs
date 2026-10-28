using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GameScore.Api.Migrations
{
    /// <inheritdoc />
    public partial class CambiarAIgdb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "RawgId",
                table: "Genres",
                newName: "ExternalId");

            migrationBuilder.RenameIndex(
                name: "IX_Genres_RawgId",
                table: "Genres",
                newName: "IX_Genres_ExternalId");

            migrationBuilder.RenameColumn(
                name: "RawgId",
                table: "Games",
                newName: "ExternalId");

            migrationBuilder.RenameIndex(
                name: "IX_Games_RawgId",
                table: "Games",
                newName: "IX_Games_ExternalId");

            migrationBuilder.AddColumn<string>(
                name: "CoverImage",
                table: "Games",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CoverImage",
                table: "Games");

            migrationBuilder.RenameColumn(
                name: "ExternalId",
                table: "Genres",
                newName: "RawgId");

            migrationBuilder.RenameIndex(
                name: "IX_Genres_ExternalId",
                table: "Genres",
                newName: "IX_Genres_RawgId");

            migrationBuilder.RenameColumn(
                name: "ExternalId",
                table: "Games",
                newName: "RawgId");

            migrationBuilder.RenameIndex(
                name: "IX_Games_ExternalId",
                table: "Games",
                newName: "IX_Games_RawgId");
        }
    }
}
