using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace GameScore.Api.Migrations
{
    /// <inheritdoc />
    public partial class PlataformasPorFamilia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Family",
                table: "Platforms",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Family", "Name" },
                values: new object[] { "PC", "PC (Windows)" });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "Family", "Name", "Slug", "SortOrder" },
                values: new object[] { "PlayStation", "PlayStation 5", "ps5", 10 });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "Family", "Name", "Slug", "SortOrder" },
                values: new object[] { "Xbox", "Xbox Series X|S", "xbox-series", 20 });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 30,
                columns: new[] { "Family", "Name", "Slug", "SortOrder" },
                values: new object[] { "Nintendo", "Nintendo Switch 2", "switch-2", 30 });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 50,
                columns: new[] { "Family", "Name", "Slug", "SortOrder" },
                values: new object[] { "Otras", "Android", "android", 50 });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 52,
                columns: new[] { "Family", "Name", "Slug", "SortOrder" },
                values: new object[] { "Otras", "Meta Quest", "meta-quest", 52 });

            migrationBuilder.UpdateData(
                table: "Platforms",
                keyColumn: "Id",
                keyValue: 56,
                columns: new[] { "Family", "Name", "Slug", "SortOrder" },
                values: new object[] { "Otras", "Arcade / recreativas", "arcade", 56 });

            migrationBuilder.InsertData(
                table: "Platforms",
                columns: new[] { "Id", "Family", "Name", "Slug", "SortOrder" },
                values: new object[,]
                {
                    { 2, "PC", "Mac", "mac", 2 },
                    { 3, "PC", "Linux", "linux", 3 },
                    { 4, "PC", "Steam Deck", "steam-deck", 4 },
                    { 11, "PlayStation", "PlayStation 4", "ps4", 11 },
                    { 12, "PlayStation", "PlayStation 3", "ps3", 12 },
                    { 13, "PlayStation", "PlayStation 2", "ps2", 13 },
                    { 14, "PlayStation", "PlayStation", "ps1", 14 },
                    { 15, "PlayStation", "PSP", "psp", 15 },
                    { 16, "PlayStation", "PS Vita", "ps-vita", 16 },
                    { 17, "PlayStation", "PlayStation VR2", "psvr2", 17 },
                    { 21, "Xbox", "Xbox One", "xbox-one", 21 },
                    { 22, "Xbox", "Xbox 360", "xbox-360", 22 },
                    { 23, "Xbox", "Xbox (original)", "xbox", 23 },
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
                    { 51, "Otras", "iPhone / iPad", "ios", 51 },
                    { 53, "Otras", "Sega Dreamcast", "dreamcast", 53 },
                    { 54, "Otras", "Sega Saturn", "saturn", 54 },
                    { 55, "Otras", "Sega Genesis / Mega Drive", "genesis", 55 }
                });
        }
    }
}
