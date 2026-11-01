using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace GameScore.Api.Migrations
{
    /// <inheritdoc />
    public partial class ConsolasVotosYCeroEstrellas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Ratings_Score",
                table: "Ratings");

            migrationBuilder.AddColumn<string>(
                name: "Family",
                table: "Platforms",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int[]>(
                name: "IgdbIds",
                table: "Platforms",
                type: "integer[]",
                nullable: false,
                defaultValue: new int[0]);

            migrationBuilder.AddColumn<int[]>(
                name: "PlatformIgdbIds",
                table: "Games",
                type: "integer[]",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ReviewVotes",
                columns: table => new
                {
                    RatingId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<short>(type: "smallint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReviewVotes", x => new { x.RatingId, x.UserId });
                    table.CheckConstraint("CK_ReviewVotes_Value", "\"Value\" IN (-1, 1)");
                    table.ForeignKey(
                        name: "FK_ReviewVotes_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReviewVotes_Ratings_RatingId",
                        column: x => x.RatingId,
                        principalTable: "Ratings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Family", "IgdbIds", "Name" },
                values: new object[] { "PC", new[] { 6 }, "PC (Windows)" });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "Family", "IgdbIds", "Name", "Slug", "SortOrder" },
                values: new object[] { "PlayStation", new[] { 167 }, "PlayStation 5", "ps5", 10 });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "Family", "IgdbIds", "Name", "Slug", "SortOrder" },
                values: new object[] { "Xbox", new[] { 169 }, "Xbox Series X|S", "xbox-series", 20 });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 30,
                columns: new[] { "Family", "IgdbIds", "Name", "Slug", "SortOrder" },
                values: new object[] { "Nintendo", new[] { 508 }, "Nintendo Switch 2", "switch-2", 30 });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 50,
                columns: new[] { "Family", "IgdbIds", "Name", "Slug", "SortOrder" },
                values: new object[] { "Otras", new[] { 34 }, "Android", "android", 50 });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 52,
                columns: new[] { "Family", "IgdbIds", "Name", "Slug", "SortOrder" },
                values: new object[] { "Otras", new[] { 384, 385, 386, 471 }, "Meta Quest", "meta-quest", 52 });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 56,
                columns: new[] { "Family", "IgdbIds", "Name", "Slug", "SortOrder" },
                values: new object[] { "Otras", new[] { 52 }, "Arcade", "arcade", 56 });

            migrationBuilder.InsertData(
                table: "Platforms",
                columns: new[] { "Id", "Family", "IgdbIds", "Name", "Slug", "SortOrder" },
                values: new object[,]
                {
                    { 2, "PC", new[] { 14 }, "Mac", "mac", 2 },
                    { 3, "PC", new[] { 3 }, "Linux", "linux", 3 },
                    { 4, "PC", new[] { 6 }, "Steam Deck", "steam-deck", 4 },
                    { 11, "PlayStation", new[] { 48 }, "PlayStation 4", "ps4", 11 },
                    { 12, "PlayStation", new[] { 9 }, "PlayStation 3", "ps3", 12 },
                    { 13, "PlayStation", new[] { 8 }, "PlayStation 2", "ps2", 13 },
                    { 14, "PlayStation", new[] { 7 }, "PlayStation", "ps1", 14 },
                    { 15, "PlayStation", new[] { 38 }, "PSP", "psp", 15 },
                    { 16, "PlayStation", new[] { 46 }, "PS Vita", "ps-vita", 16 },
                    { 17, "PlayStation", new[] { 165, 390 }, "PlayStation VR / VR2", "psvr", 17 },
                    { 21, "Xbox", new[] { 49 }, "Xbox One", "xbox-one", 21 },
                    { 22, "Xbox", new[] { 12 }, "Xbox 360", "xbox-360", 22 },
                    { 23, "Xbox", new[] { 11 }, "Xbox (original)", "xbox", 23 },
                    { 31, "Nintendo", new[] { 130 }, "Nintendo Switch", "switch", 31 },
                    { 32, "Nintendo", new[] { 41 }, "Wii U", "wii-u", 32 },
                    { 33, "Nintendo", new[] { 5 }, "Wii", "wii", 33 },
                    { 34, "Nintendo", new[] { 21 }, "GameCube", "gamecube", 34 },
                    { 35, "Nintendo", new[] { 4 }, "Nintendo 64", "n64", 35 },
                    { 36, "Nintendo", new[] { 19 }, "Super Nintendo", "snes", 36 },
                    { 37, "Nintendo", new[] { 18 }, "NES", "nes", 37 },
                    { 38, "Nintendo", new[] { 37 }, "Nintendo 3DS", "3ds", 38 },
                    { 39, "Nintendo", new[] { 20 }, "Nintendo DS", "ds", 39 },
                    { 40, "Nintendo", new[] { 24 }, "Game Boy Advance", "gba", 40 },
                    { 41, "Nintendo", new[] { 33, 22 }, "Game Boy / Color", "gameboy", 41 },
                    { 51, "Otras", new[] { 39 }, "iPhone / iPad", "ios", 51 },
                    { 53, "Otras", new[] { 23 }, "Sega Dreamcast", "dreamcast", 53 },
                    { 54, "Otras", new[] { 32 }, "Sega Saturn", "saturn", 54 },
                    { 55, "Otras", new[] { 29 }, "Sega Genesis / Mega Drive", "genesis", 55 }
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Ratings_Score",
                table: "Ratings",
                sql: "\"Score\" >= 0 AND \"Score\" <= 5");

            migrationBuilder.CreateIndex(
                name: "IX_ReviewVotes_UserId",
                table: "ReviewVotes",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReviewVotes");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Ratings_Score",
                table: "Ratings");

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 36);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 37);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 39);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 51);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 53);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 54);

            migrationBuilder.DeleteData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 55);

            migrationBuilder.DropColumn(
                name: "Family",
                table: "Platforms");

            migrationBuilder.DropColumn(
                name: "IgdbIds",
                table: "Platforms");

            migrationBuilder.DropColumn(
                name: "PlatformIgdbIds",
                table: "Games");

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 1,
                column: "Name",
                value: "PC");

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "Name", "Slug", "SortOrder" },
                values: new object[] { "PlayStation", "playstation", 2 });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "Name", "Slug", "SortOrder" },
                values: new object[] { "Xbox", "xbox-consolas", 3 });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 30,
                columns: new[] { "Name", "Slug", "SortOrder" },
                values: new object[] { "Nintendo", "nintendo", 4 });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 50,
                columns: new[] { "Name", "Slug", "SortOrder" },
                values: new object[] { "Móvil", "movil", 5 });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 52,
                columns: new[] { "Name", "Slug", "SortOrder" },
                values: new object[] { "Realidad virtual", "realidad-virtual", 6 });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 56,
                columns: new[] { "Name", "Slug", "SortOrder" },
                values: new object[] { "Retro / otras", "retro-otras", 7 });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Ratings_Score",
                table: "Ratings",
                sql: "\"Score\" >= 0.5 AND \"Score\" <= 5");
        }
    }
}
