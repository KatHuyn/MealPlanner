using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MealPlannerAPI.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    QuantityInStock = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false),
                    Calories = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    Protein = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    Carbs = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    Fat = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    Fiber = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    Keywords = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FullName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsAdmin = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HealthProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Weight = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    Height = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    Age = table.Column<int>(type: "int", nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ActivityLevel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Allergies = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    HealthConditions = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DietaryPreferences = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Goals = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HealthProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HealthProfiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MealPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    UserRequest = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PlanDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MealPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MealPlans_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    UserMessage = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    AiResponse = table.Column<string>(type: "nvarchar(max)", maxLength: 5000, nullable: true),
                    MealPlanId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatHistories_MealPlans_MealPlanId",
                        column: x => x.MealPlanId,
                        principalTable: "MealPlans",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ChatHistories_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Meals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MealPlanId = table.Column<int>(type: "int", nullable: false),
                    MealType = table.Column<int>(type: "int", nullable: false),
                    DishName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Recipe = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PrepTime = table.Column<int>(type: "int", nullable: true),
                    CookTime = table.Column<int>(type: "int", nullable: true),
                    Servings = table.Column<int>(type: "int", nullable: true),
                    TotalCalories = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    TotalProtein = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    TotalCarbs = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    TotalFat = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Meals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Meals_MealPlans_MealPlanId",
                        column: x => x.MealPlanId,
                        principalTable: "MealPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Orders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    MealPlanId = table.Column<int>(type: "int", nullable: true),
                    OrderCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ShippingFee = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    FinalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ShippingAddress = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ReceiverPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ReceiverName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ConfirmedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ShippedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeliveredAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CancellationReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Orders_MealPlans_MealPlanId",
                        column: x => x.MealPlanId,
                        principalTable: "MealPlans",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Orders_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MealPlanIngredients",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MealId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: true),
                    IngredientName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IsMatched = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MealPlanIngredients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MealPlanIngredients_Meals_MealId",
                        column: x => x.MealId,
                        principalTable: "Meals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MealPlanIngredients_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "OrderItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderItems_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrderItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Products",
                columns: new[] { "Id", "Calories", "Carbs", "Category", "CreatedAt", "Description", "Fat", "Fiber", "ImageUrl", "IsAvailable", "Keywords", "Name", "Price", "Protein", "QuantityInStock", "Unit", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, 165m, 0m, "Thịt", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 3.6m, null, null, true, "ức gà, chicken breast, thịt gà, gà", "Ức gà CP 500g", 45000m, 31m, 100m, "gói", null },
                    { 2, 250m, 0m, "Thịt", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 15m, null, null, true, "thịt bò, beef, bò", "Thịt bò Úc 500g", 150000m, 26m, 50m, "gói", null },
                    { 3, 143m, 0m, "Thịt", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 4m, null, null, true, "thịt heo, thịt lợn, pork", "Thịt heo nạc vai 500g", 65000m, 26m, 80m, "gói", null },
                    { 4, 208m, 0m, "Hải sản", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 13m, null, null, true, "cá hồi, salmon, cá", "Cá hồi phi lê 300g", 180000m, 20m, 30m, "gói", null },
                    { 5, 99m, 0m, "Hải sản", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 0.3m, null, null, true, "tôm, shrimp, tôm sú", "Tôm sú size 40 500g", 120000m, 24m, 40m, "gói", null },
                    { 6, 34m, 7m, "Rau củ", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 0.4m, null, null, true, "bông cải, broccoli, súp lơ", "Bông cải xanh hữu cơ 300g", 15000m, 2.8m, 100m, "gói", null },
                    { 7, 18m, 3.9m, "Rau củ", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 0.2m, null, null, true, "cà chua, tomato", "Cà chua Đà Lạt 500g", 20000m, 0.9m, 150m, "gói", null },
                    { 8, 19m, 3m, "Rau củ", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 0.2m, null, null, true, "rau muống, morning glory", "Rau muống 300g", 8000m, 2.6m, 200m, "bó", null },
                    { 9, 41m, 10m, "Rau củ", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 0.2m, null, null, true, "cà rốt, carrot", "Cà rốt 500g", 12000m, 0.9m, 120m, "gói", null },
                    { 10, 86m, 20m, "Rau củ", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 0.1m, null, null, true, "khoai lang, sweet potato", "Khoai lang 500g", 18000m, 1.6m, 80m, "gói", null },
                    { 11, 26m, 6.5m, "Rau củ", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 0.1m, null, null, true, "bí đỏ, pumpkin", "Bí đỏ 500g", 15000m, 1m, 60m, "gói", null },
                    { 12, 567m, 16m, "Hạt", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 49m, null, null, true, "đậu phộng, peanut, lạc", "Đậu phộng rang 200g", 25000m, 26m, 100m, "gói", null },
                    { 13, 130m, 28m, "Tinh bột", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 0.3m, null, null, true, "gạo, rice, cơm", "Gạo ST25 5kg", 140000m, 2.7m, 50m, "bao", null },
                    { 14, 389m, 66m, "Tinh bột", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 7m, null, null, true, "yến mạch, oats, oat", "Yến mạch nguyên hạt 500g", 55000m, 17m, 60m, "gói", null },
                    { 15, 109m, 25m, "Tinh bột", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 0.2m, null, null, true, "bún, rice noodle", "Bún gạo 500g", 18000m, 0.9m, 100m, "gói", null },
                    { 16, 35m, 2m, "Gia vị", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 0m, null, null, true, "nước mắm, fish sauce", "Nước mắm Phú Quốc 500ml", 45000m, 6m, 80m, "chai", null },
                    { 17, 884m, 0m, "Gia vị", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 100m, null, null, true, "dầu ăn, cooking oil", "Dầu ăn 1L", 38000m, 0m, 100m, "chai", null },
                    { 18, 149m, 33m, "Gia vị", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 0.5m, null, null, true, "tỏi, garlic", "Tỏi băm 200g", 22000m, 6.4m, 120m, "hũ", null },
                    { 19, 80m, 18m, "Gia vị", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 0.8m, null, null, true, "gừng, ginger", "Gừng tươi 200g", 10000m, 1.8m, 150m, "gói", null },
                    { 20, 40m, 9m, "Gia vị", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 0.1m, null, null, true, "hành tím, shallot", "Hành tím 300g", 15000m, 1.1m, 100m, "gói", null },
                    { 21, 155m, 1.1m, "Trứng & Sữa", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 11m, null, null, true, "trứng, egg, trứng gà", "Trứng gà ta 10 quả", 35000m, 13m, 80m, "vỉ", null },
                    { 22, 61m, 4.8m, "Trứng & Sữa", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 3.3m, null, null, true, "sữa, milk, sữa tươi", "Sữa tươi Vinamilk 1L", 32000m, 3.2m, 100m, "hộp", null },
                    { 23, 313m, 1m, "Trứng & Sữa", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 26m, null, null, true, "phô mai, cheese", "Phô mai con bò cười 8 miếng", 28000m, 18m, 60m, "hộp", null },
                    { 24, 89m, 23m, "Trái cây", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 0.3m, null, null, true, "chuối, banana", "Chuối già 1kg", 25000m, 1.1m, 100m, "kg", null },
                    { 25, 52m, 14m, "Trái cây", new DateTime(2026, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), null, 0.2m, null, null, true, "táo, apple", "Táo Fuji 1kg", 60000m, 0.3m, 50m, "kg", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatHistories_MealPlanId",
                table: "ChatHistories",
                column: "MealPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatHistories_UserId",
                table: "ChatHistories",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_HealthProfiles_UserId",
                table: "HealthProfiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MealPlanIngredients_MealId",
                table: "MealPlanIngredients",
                column: "MealId");

            migrationBuilder.CreateIndex(
                name: "IX_MealPlanIngredients_ProductId",
                table: "MealPlanIngredients",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_MealPlans_UserId",
                table: "MealPlans",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Meals_MealPlanId",
                table: "Meals",
                column: "MealPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_OrderId",
                table: "OrderItems",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_ProductId",
                table: "OrderItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_MealPlanId",
                table: "Orders",
                column: "MealPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_OrderCode",
                table: "Orders",
                column: "OrderCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_UserId",
                table: "Orders",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Category",
                table: "Products",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Name",
                table: "Products",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatHistories");

            migrationBuilder.DropTable(
                name: "HealthProfiles");

            migrationBuilder.DropTable(
                name: "MealPlanIngredients");

            migrationBuilder.DropTable(
                name: "OrderItems");

            migrationBuilder.DropTable(
                name: "Meals");

            migrationBuilder.DropTable(
                name: "Orders");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropTable(
                name: "MealPlans");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
