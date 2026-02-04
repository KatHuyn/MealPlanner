using Microsoft.EntityFrameworkCore;
using MealPlannerAPI.Models;

namespace MealPlannerAPI.Data;

public class MealPlannerDbContext : DbContext
{
    public MealPlannerDbContext(DbContextOptions<MealPlannerDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<HealthProfile> HealthProfiles { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<MealPlan> MealPlans { get; set; }
    public DbSet<Meal> Meals { get; set; }
    public DbSet<MealPlanIngredient> MealPlanIngredients { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<ChatHistory> ChatHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasOne(u => u.HealthProfile)
                  .WithOne(h => h.User)
                  .HasForeignKey<HealthProfile>(h => h.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Product configuration
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.Category);
        });

        // MealPlan configuration
        modelBuilder.Entity<MealPlan>(entity =>
        {
            entity.HasOne(mp => mp.User)
                  .WithMany(u => u.MealPlans)
                  .HasForeignKey(mp => mp.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Meal configuration
        modelBuilder.Entity<Meal>(entity =>
        {
            entity.HasOne(m => m.MealPlan)
                  .WithMany(mp => mp.Meals)
                  .HasForeignKey(m => m.MealPlanId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // MealPlanIngredient configuration
        modelBuilder.Entity<MealPlanIngredient>(entity =>
        {
            entity.HasOne(mpi => mpi.Meal)
                  .WithMany(m => m.Ingredients)
                  .HasForeignKey(mpi => mpi.MealId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(mpi => mpi.Product)
                  .WithMany(p => p.MealPlanIngredients)
                  .HasForeignKey(mpi => mpi.ProductId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Order configuration
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasIndex(e => e.OrderCode).IsUnique();
            
            entity.HasOne(o => o.User)
                  .WithMany(u => u.Orders)
                  .HasForeignKey(o => o.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(o => o.MealPlan)
                  .WithMany()
                  .HasForeignKey(o => o.MealPlanId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        // OrderItem configuration
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasOne(oi => oi.Order)
                  .WithMany(o => o.OrderItems)
                  .HasForeignKey(oi => oi.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(oi => oi.Product)
                  .WithMany(p => p.OrderItems)
                  .HasForeignKey(oi => oi.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ChatHistory configuration
        modelBuilder.Entity<ChatHistory>(entity =>
        {
            entity.HasOne(ch => ch.User)
                  .WithMany(u => u.ChatHistories)
                  .HasForeignKey(ch => ch.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ch => ch.MealPlan)
                  .WithMany()
                  .HasForeignKey(ch => ch.MealPlanId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        // Seed sample products
        SeedProducts(modelBuilder);
    }

    private void SeedProducts(ModelBuilder modelBuilder)
    {
        var seedDate = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc);
        
        modelBuilder.Entity<Product>().HasData(
            // Thịt
            new Product { Id = 1, Name = "Ức gà CP 500g", Category = "Thịt", Price = 45000, Unit = "gói", QuantityInStock = 100, Calories = 165, Protein = 31, Carbs = 0, Fat = 3.6m, Keywords = "ức gà, chicken breast, thịt gà, gà", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 2, Name = "Thịt bò Úc 500g", Category = "Thịt", Price = 150000, Unit = "gói", QuantityInStock = 50, Calories = 250, Protein = 26, Carbs = 0, Fat = 15, Keywords = "thịt bò, beef, bò", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 3, Name = "Thịt heo nạc vai 500g", Category = "Thịt", Price = 65000, Unit = "gói", QuantityInStock = 80, Calories = 143, Protein = 26, Carbs = 0, Fat = 4, Keywords = "thịt heo, thịt lợn, pork", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 4, Name = "Cá hồi phi lê 300g", Category = "Hải sản", Price = 180000, Unit = "gói", QuantityInStock = 30, Calories = 208, Protein = 20, Carbs = 0, Fat = 13, Keywords = "cá hồi, salmon, cá", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 5, Name = "Tôm sú size 40 500g", Category = "Hải sản", Price = 120000, Unit = "gói", QuantityInStock = 40, Calories = 99, Protein = 24, Carbs = 0, Fat = 0.3m, Keywords = "tôm, shrimp, tôm sú", IsAvailable = true, CreatedAt = seedDate },
            
            // Rau củ
            new Product { Id = 6, Name = "Bông cải xanh hữu cơ 300g", Category = "Rau củ", Price = 15000, Unit = "gói", QuantityInStock = 100, Calories = 34, Protein = 2.8m, Carbs = 7, Fat = 0.4m, Keywords = "bông cải, broccoli, súp lơ", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 7, Name = "Cà chua Đà Lạt 500g", Category = "Rau củ", Price = 20000, Unit = "gói", QuantityInStock = 150, Calories = 18, Protein = 0.9m, Carbs = 3.9m, Fat = 0.2m, Keywords = "cà chua, tomato", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 8, Name = "Rau muống 300g", Category = "Rau củ", Price = 8000, Unit = "bó", QuantityInStock = 200, Calories = 19, Protein = 2.6m, Carbs = 3, Fat = 0.2m, Keywords = "rau muống, morning glory", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 9, Name = "Cà rốt 500g", Category = "Rau củ", Price = 12000, Unit = "gói", QuantityInStock = 120, Calories = 41, Protein = 0.9m, Carbs = 10, Fat = 0.2m, Keywords = "cà rốt, carrot", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 10, Name = "Khoai lang 500g", Category = "Rau củ", Price = 18000, Unit = "gói", QuantityInStock = 80, Calories = 86, Protein = 1.6m, Carbs = 20, Fat = 0.1m, Keywords = "khoai lang, sweet potato", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 11, Name = "Bí đỏ 500g", Category = "Rau củ", Price = 15000, Unit = "gói", QuantityInStock = 60, Calories = 26, Protein = 1, Carbs = 6.5m, Fat = 0.1m, Keywords = "bí đỏ, pumpkin", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 12, Name = "Đậu phộng rang 200g", Category = "Hạt", Price = 25000, Unit = "gói", QuantityInStock = 100, Calories = 567, Protein = 26, Carbs = 16, Fat = 49, Keywords = "đậu phộng, peanut, lạc", IsAvailable = true, CreatedAt = seedDate },
            
            // Tinh bột
            new Product { Id = 13, Name = "Gạo ST25 5kg", Category = "Tinh bột", Price = 140000, Unit = "bao", QuantityInStock = 50, Calories = 130, Protein = 2.7m, Carbs = 28, Fat = 0.3m, Keywords = "gạo, rice, cơm", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 14, Name = "Yến mạch nguyên hạt 500g", Category = "Tinh bột", Price = 55000, Unit = "gói", QuantityInStock = 60, Calories = 389, Protein = 17, Carbs = 66, Fat = 7, Keywords = "yến mạch, oats, oat", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 15, Name = "Bún gạo 500g", Category = "Tinh bột", Price = 18000, Unit = "gói", QuantityInStock = 100, Calories = 109, Protein = 0.9m, Carbs = 25, Fat = 0.2m, Keywords = "bún, rice noodle", IsAvailable = true, CreatedAt = seedDate },
            
            // Gia vị
            new Product { Id = 16, Name = "Nước mắm Phú Quốc 500ml", Category = "Gia vị", Price = 45000, Unit = "chai", QuantityInStock = 80, Calories = 35, Protein = 6, Carbs = 2, Fat = 0, Keywords = "nước mắm, fish sauce", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 17, Name = "Dầu ăn 1L", Category = "Gia vị", Price = 38000, Unit = "chai", QuantityInStock = 100, Calories = 884, Protein = 0, Carbs = 0, Fat = 100, Keywords = "dầu ăn, cooking oil", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 18, Name = "Tỏi băm 200g", Category = "Gia vị", Price = 22000, Unit = "hũ", QuantityInStock = 120, Calories = 149, Protein = 6.4m, Carbs = 33, Fat = 0.5m, Keywords = "tỏi, garlic", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 19, Name = "Gừng tươi 200g", Category = "Gia vị", Price = 10000, Unit = "gói", QuantityInStock = 150, Calories = 80, Protein = 1.8m, Carbs = 18, Fat = 0.8m, Keywords = "gừng, ginger", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 20, Name = "Hành tím 300g", Category = "Gia vị", Price = 15000, Unit = "gói", QuantityInStock = 100, Calories = 40, Protein = 1.1m, Carbs = 9, Fat = 0.1m, Keywords = "hành tím, shallot", IsAvailable = true, CreatedAt = seedDate },
            
            // Trứng & Sữa
            new Product { Id = 21, Name = "Trứng gà", Category = "Trứng & Sữa", Price = 35000, Unit = "chục", QuantityInStock = 80, Calories = 155, Protein = 13, Carbs = 1.1m, Fat = 11, Keywords = "trứng, egg, trứng gà", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 22, Name = "Sữa tươi", Category = "Trứng & Sữa", Price = 32000, Unit = "lít", QuantityInStock = 100, Calories = 61, Protein = 3.2m, Carbs = 4.8m, Fat = 3.3m, Keywords = "sữa, milk, sữa tươi", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 23, Name = "Phô mai", Category = "Trứng & Sữa", Price = 28000, Unit = "hộp", QuantityInStock = 60, Calories = 313, Protein = 18, Carbs = 1, Fat = 26, Keywords = "phô mai, cheese", IsAvailable = true, CreatedAt = seedDate },
            
            // Trái cây
            new Product { Id = 24, Name = "Chuối già 1kg", Category = "Trái cây", Price = 25000, Unit = "kg", QuantityInStock = 100, Calories = 89, Protein = 1.1m, Carbs = 23, Fat = 0.3m, Keywords = "chuối, banana", IsAvailable = true, CreatedAt = seedDate },
            new Product { Id = 25, Name = "Táo Fuji 1kg", Category = "Trái cây", Price = 60000, Unit = "kg", QuantityInStock = 50, Calories = 52, Protein = 0.3m, Carbs = 14, Fat = 0.2m, Keywords = "táo, apple", IsAvailable = true, CreatedAt = seedDate }
        );
    }
}
