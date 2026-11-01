using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GameScore.Api.Migrations
{
    /// <inheritdoc />
    public partial class PlataformaEnResena : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PlatformId",
                table: "Ratings",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_PlatformId",
                table: "Ratings",
                column: "PlatformId");

            migrationBuilder.AddForeignKey(
                name: "FK_Ratings_Platforms_PlatformId",
                table: "Ratings",
                column: "PlatformId",
                principalTable: "Platforms",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Ratings_Platforms_PlatformId",
                table: "Ratings");

            migrationBuilder.DropIndex(
                name: "IX_Ratings_PlatformId",
                table: "Ratings");

            migrationBuilder.DropColumn(
                name: "PlatformId",
                table: "Ratings");
        }
    }
}
