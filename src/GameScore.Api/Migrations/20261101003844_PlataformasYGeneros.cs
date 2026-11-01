using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace GameScore.Api.Migrations
{
    /// <inheritdoc />
    public partial class PlataformasYGeneros : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Genres_ExternalId",
                table: "Genres");

            migrationBuilder.DropColumn(
                name: "AvatarUrl",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Bio",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<int>(
                name: "Kind",
                table: "Genres",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Platforms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Family = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Platforms", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserPlatforms",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    PlatformId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPlatforms", x => new { x.UserId, x.PlatformId });
                    table.ForeignKey(
                        name: "FK_UserPlatforms_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserPlatforms_Platforms_PlatformId",
                        column: x => x.PlatformId,
                        principalTable: "Platforms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Platforms",
                columns: new[] { "Id", "Family", "Name", "Slug", "SortOrder" },
                values: new object[,]
                {
                    { 1, "PC", "PC (Windows)", "pc", 1 },
                    { 2, "PC", "Mac", "mac", 2 },
                    { 3, "PC", "Linux", "linux", 3 },
                    { 4, "PC", "Steam Deck", "steam-deck", 4 },
                    { 10, "PlayStation", "PlayStation 5", "ps5", 10 },
                    { 11, "PlayStation", "PlayStation 4", "ps4", 11 },
                    { 12, "PlayStation", "PlayStation 3", "ps3", 12 },
                    { 13, "PlayStation", "PlayStation 2", "ps2", 13 },
                    { 14, "PlayStation", "PlayStation", "ps1", 14 },
                    { 15, "PlayStation", "PSP", "psp", 15 },
                    { 16, "PlayStation", "PS Vita", "ps-vita", 16 },
                    { 17, "PlayStation", "PlayStation VR2", "psvr2", 17 },
                    { 20, "Xbox", "Xbox Series X|S", "xbox-series", 20 },
                    { 21, "Xbox", "Xbox One", "xbox-one", 21 },
                    { 22, "Xbox", "Xbox 360", "xbox-360", 22 },
                    { 23, "Xbox", "Xbox (original)", "xbox", 23 },
                    { 30, "Nintendo", "Nintendo Switch 2", "switch-2", 30 },
                    { 31, "Nintendo", "Nintendo Switch", "switch", 31 },
                    { 32, "Nintendo", "Wii U", "wii-u", 32 },
                    { 33, "Nintendo", "Wii", "wii", 33 },
                    { 34, "Nintendo", "GameCube", "gamecube", 34 },
                    { 35, "Nintendo", "Nintendo 64", "n64", 35 },
                    { 36, "Nintendo", "Super Nintendo", "snes", 36 },
                    { 37, "Nintendo", "NES", "nes", 37 },
                    { 38, "Nintendo", "Nintendo 3DS", "3ds", 38 },
                    { 39, "Nintendo", "Nintendo DS", "ds", 39 },
                    { 40, "Nintendo", "Game Boy Advance", "gba", 40 },
                    { 41, "Nintendo", "Game Boy / Color", "gameboy", 41 },
                    { 50, "Otras", "Android", "android", 50 },
                    { 51, "Otras", "iPhone / iPad", "ios", 51 },
                    { 52, "Otras", "Meta Quest", "meta-quest", 52 },
                    { 53, "Otras", "Sega Dreamcast", "dreamcast", 53 },
                    { 54, "Otras", "Sega Saturn", "saturn", 54 },
                    { 55, "Otras", "Sega Genesis / Mega Drive", "genesis", 55 },
                    { 56, "Otras", "Arcade / recreativas", "arcade", 56 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Genres_Kind_ExternalId",
                table: "Genres",
                columns: new[] { "Kind", "ExternalId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Genres_Slug",
                table: "Genres",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "IX_Platforms_Slug",
                table: "Platforms",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserPlatforms_PlatformId",
                table: "UserPlatforms",
                column: "PlatformId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserPlatforms");

            migrationBuilder.DropTable(
                name: "Platforms");

            migrationBuilder.DropIndex(
                name: "IX_Genres_Kind_ExternalId",
                table: "Genres");

            migrationBuilder.DropIndex(
                name: "IX_Genres_Slug",
                table: "Genres");

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "Genres");

            migrationBuilder.AddColumn<string>(
                name: "AvatarUrl",
                table: "AspNetUsers",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Bio",
                table: "AspNetUsers",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Genres_ExternalId",
                table: "Genres",
                column: "ExternalId",
                unique: true);
        }
    }
}
