using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MealPlannerAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddIsHiddenToProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsHidden",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsHidden",
                table: "Products");
        }
    }
}
