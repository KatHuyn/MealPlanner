-- Seed Data cho MealPlannerDB
-- Chạy script này sau khi migration để có dữ liệu mẫu

-- Xóa dữ liệu cũ (nếu có)
DELETE FROM OrderItems;
DELETE FROM Orders;
DELETE FROM MealPlanIngredients;
DELETE FROM Meals;
DELETE FROM MealPlans;
DELETE FROM ChatHistories;
DELETE FROM Products;
DELETE FROM HealthProfiles;
DELETE FROM Users;

-- Reset identity
DBCC CHECKIDENT ('Products', RESEED, 0);
DBCC CHECKIDENT ('Users', RESEED, 0);

-- ==========================================
-- 1. THÊM ADMIN USER
-- ==========================================
INSERT INTO Users (FullName, Email, PasswordHash, Phone, IsAdmin, CreatedAt)
VALUES 
    (N'Admin MealPlanner', 'admin@mealplanner.com', 'AQAAAAIAAYagAAAAEMxK7xR3RWL4SnVmNMxQ2g2x7q5X8nK3q1y5v6w8z9A0B1C2D3E4F5G6H7I8J9K0L1M2', '0901234567', 1, GETUTCDATE()),
    (N'Nguyễn Văn Test', 'test@example.com', 'AQAAAAIAAYagAAAAEMxK7xR3RWL4SnVmNMxQ2g2x7q5X8nK3q1y5v6w8z9A0B1C2D3E4F5G6H7I8J9K0L1M2', '0987654321', 0, GETUTCDATE());

-- Thêm Health Profile cho user test
INSERT INTO HealthProfiles (UserId, Weight, Height, Age, Gender, ActivityLevel, Allergies, HealthConditions, DietaryPreferences, Goals, CreatedAt)
VALUES (2, 65.5, 170, 30, N'Male', N'Moderate', N'Hải sản', N'Đau dạ dày', N'Ăn nhiều rau', N'Giảm cân, Tăng sức khỏe', GETUTCDATE());

-- ==========================================
-- 2. THÊM SẢN PHẨM - RAU CỦ
-- ==========================================
INSERT INTO Products (Name, Description, Price, Unit, QuantityInStock, Category, IsAvailable, Calories, Protein, Carbs, Fat, Fiber, Keywords, CreatedAt)
VALUES 
    (N'Rau muống', N'Rau muống tươi, giòn ngọt', 15000, N'bó', 50, N'Rau củ', 1, 19, 2.6, 3.4, 0.2, 2.1, N'rau muống, morning glory, rau xanh', GETUTCDATE()),
    (N'Cà chua Đà Lạt', N'Cà chua Đà Lạt chín đỏ, ngọt', 25000, N'kg', 30, N'Rau củ', 1, 18, 0.9, 3.9, 0.2, 1.2, N'cà chua, tomato, chua', GETUTCDATE()),
    (N'Cà rốt', N'Cà rốt tươi ngọt, giàu vitamin A', 20000, N'kg', 40, N'Rau củ', 1, 41, 0.9, 9.6, 0.2, 2.8, N'cà rốt, carrot, củ', GETUTCDATE()),
    (N'Bông cải xanh', N'Bông cải xanh hữu cơ, giàu chất xơ', 35000, N'kg', 25, N'Rau củ', 1, 34, 2.8, 7, 0.4, 2.6, N'bông cải xanh, broccoli, súp lơ xanh', GETUTCDATE()),
    (N'Bí đỏ', N'Bí đỏ ngọt, giàu vitamin A', 18000, N'kg', 35, N'Rau củ', 1, 26, 1, 6.5, 0.1, 0.5, N'bí đỏ, pumpkin', GETUTCDATE()),
    (N'Khoai lang', N'Khoai lang mật, ngọt bùi', 22000, N'kg', 40, N'Rau củ', 1, 86, 1.6, 20, 0.1, 3, N'khoai lang, sweet potato', GETUTCDATE()),
    (N'Hành tây', N'Hành tây tươi, giòn', 18000, N'kg', 45, N'Rau củ', 1, 40, 1.1, 9.3, 0.1, 1.7, N'hành tây, onion, củ hành', GETUTCDATE()),
    (N'Tỏi', N'Tỏi Việt Nam, thơm', 50000, N'kg', 20, N'Gia vị', 1, 149, 6.4, 33, 0.5, 2.1, N'tỏi, garlic', GETUTCDATE()),
    (N'Gừng', N'Gừng tươi, cay nồng', 45000, N'kg', 15, N'Gia vị', 1, 80, 1.8, 18, 0.8, 2, N'gừng, ginger', GETUTCDATE()),
    (N'Hành tím', N'Hành tím tươi', 30000, N'kg', 30, N'Gia vị', 1, 44, 1.3, 10, 0.1, 1.7, N'hành tím, shallot', GETUTCDATE()),
    (N'Xà lách', N'Xà lách tươi giòn', 20000, N'bó', 35, N'Rau củ', 1, 15, 1.4, 2.9, 0.2, 1.3, N'xà lách, lettuce, salad', GETUTCDATE()),
    (N'Dưa leo', N'Dưa leo tươi giòn mát', 15000, N'kg', 40, N'Rau củ', 1, 16, 0.7, 3.6, 0.1, 0.5, N'dưa leo, cucumber, dưa chuột', GETUTCDATE());

-- ==========================================
-- 3. THÊM SẢN PHẨM - THỊT
-- ==========================================
INSERT INTO Products (Name, Description, Price, Unit, QuantityInStock, Category, IsAvailable, Calories, Protein, Carbs, Fat, Fiber, Keywords, CreatedAt)
VALUES 
    (N'Ức gà CP', N'Ức gà tươi, giàu protein', 85000, N'kg', 30, N'Thịt', 1, 165, 31, 0, 3.6, 0, N'ức gà, gà, chicken breast, thịt gà', GETUTCDATE()),
    (N'Thịt heo ba chỉ', N'Thịt heo ba chỉ tươi', 95000, N'kg', 25, N'Thịt', 1, 518, 9, 0, 53, 0, N'thịt heo, ba chỉ, pork belly, heo', GETUTCDATE()),
    (N'Thịt bò Úc', N'Thịt bò Úc nhập khẩu', 280000, N'kg', 15, N'Thịt', 1, 250, 26, 0, 15, 0, N'thịt bò, beef, bò', GETUTCDATE()),
    (N'Sườn non heo', N'Sườn non heo tươi ngon', 110000, N'kg', 20, N'Thịt', 1, 277, 18, 0, 23, 0, N'sườn non, sườn heo, pork ribs', GETUTCDATE()),
    (N'Đùi gà góc tư', N'Đùi gà tươi ngon', 75000, N'kg', 35, N'Thịt', 1, 209, 20, 0, 14, 0, N'đùi gà, gà, chicken thigh', GETUTCDATE());

-- ==========================================
-- 4. THÊM SẢN PHẨM - HẢI SẢN
-- ==========================================
INSERT INTO Products (Name, Description, Price, Unit, QuantityInStock, Category, IsAvailable, Calories, Protein, Carbs, Fat, Fiber, Keywords, CreatedAt)
VALUES 
    (N'Cá hồi Na Uy', N'Cá hồi nhập khẩu, giàu omega-3', 450000, N'kg', 10, N'Hải sản', 1, 208, 20, 0, 13, 0, N'cá hồi, salmon, hồi', GETUTCDATE()),
    (N'Tôm sú', N'Tôm sú tươi sống', 250000, N'kg', 15, N'Hải sản', 1, 99, 24, 0.2, 0.3, 0, N'tôm sú, tôm, shrimp, prawn', GETUTCDATE()),
    (N'Cá basa fillet', N'Cá basa fillet sạch', 85000, N'kg', 25, N'Hải sản', 1, 92, 18, 0, 2, 0, N'cá basa, basa, fish', GETUTCDATE()),
    (N'Mực ống', N'Mực ống tươi', 180000, N'kg', 12, N'Hải sản', 1, 92, 18, 3, 1, 0, N'mực, squid, mực ống', GETUTCDATE());

-- ==========================================
-- 5. THÊM SẢN PHẨM - TRỨNG & SỮA
-- ==========================================
INSERT INTO Products (Name, Description, Price, Unit, QuantityInStock, Category, IsAvailable, Calories, Protein, Carbs, Fat, Fiber, Keywords, CreatedAt)
VALUES 
    (N'Trứng gà', N'Trứng gà ta tươi', 35000, N'chục', 50, N'Trứng & Sữa', 1, 155, 13, 1.1, 11, 0, N'trứng gà, trứng, egg', GETUTCDATE()),
    (N'Sữa tươi TH True Milk', N'Sữa tươi tiệt trùng', 32000, N'lít', 40, N'Trứng & Sữa', 1, 62, 3.2, 4.8, 3.5, 0, N'sữa tươi, milk, sữa', GETUTCDATE()),
    (N'Phô mai con bò cười', N'Phô mai mềm', 45000, N'hộp', 30, N'Trứng & Sữa', 1, 280, 17, 2, 22, 0, N'phô mai, cheese', GETUTCDATE());

-- ==========================================
-- 6. THÊM SẢN PHẨM - GẠO & NGŨ CỐC
-- ==========================================
INSERT INTO Products (Name, Description, Price, Unit, QuantityInStock, Category, IsAvailable, Calories, Protein, Carbs, Fat, Fiber, Keywords, CreatedAt)
VALUES 
    (N'Gạo ST25', N'Gạo ST25 ngon nhất thế giới', 45000, N'kg', 60, N'Gạo & Ngũ cốc', 1, 130, 2.7, 28, 0.3, 0.4, N'gạo, rice, ST25, cơm', GETUTCDATE()),
    (N'Yến mạch Quaker', N'Yến mạch nguyên hạt', 75000, N'hộp 500g', 35, N'Gạo & Ngũ cốc', 1, 389, 17, 66, 7, 11, N'yến mạch, oats, oatmeal', GETUTCDATE()),
    (N'Bún gạo', N'Bún gạo khô', 25000, N'gói 500g', 45, N'Gạo & Ngũ cốc', 1, 364, 3.4, 83, 0.4, 1.6, N'bún gạo, bún, rice noodle', GETUTCDATE()),
    (N'Phở khô', N'Phở khô Safoco', 28000, N'gói 500g', 40, N'Gạo & Ngũ cốc', 1, 340, 3, 80, 0.3, 1, N'phở, phở khô, pho', GETUTCDATE());

-- ==========================================
-- 7. THÊM SẢN PHẨM - GIA VỊ & NƯỚC CHẤM
-- ==========================================
INSERT INTO Products (Name, Description, Price, Unit, QuantityInStock, Category, IsAvailable, Calories, Protein, Carbs, Fat, Fiber, Keywords, CreatedAt)
VALUES 
    (N'Nước mắm Phú Quốc', N'Nước mắm truyền thống', 55000, N'chai 500ml', 40, N'Gia vị', 1, 35, 5, 4, 0, 0, N'nước mắm, fish sauce', GETUTCDATE()),
    (N'Dầu ăn Neptune', N'Dầu ăn cao cấp', 48000, N'chai 1L', 45, N'Gia vị', 1, 884, 0, 0, 100, 0, N'dầu ăn, cooking oil, dầu', GETUTCDATE()),
    (N'Nước tương Maggi', N'Nước tương đậm đặc', 25000, N'chai 300ml', 50, N'Gia vị', 1, 53, 8, 5, 0, 0, N'nước tương, soy sauce, xì dầu', GETUTCDATE()),
    (N'Đường trắng', N'Đường kính trắng', 22000, N'kg', 55, N'Gia vị', 1, 387, 0, 100, 0, 0, N'đường, sugar', GETUTCDATE()),
    (N'Muối hạt', N'Muối hạt tinh khiết', 8000, N'kg', 60, N'Gia vị', 1, 0, 0, 0, 0, 0, N'muối, salt', GETUTCDATE()),
    (N'Tiêu đen', N'Tiêu đen Phú Quốc', 120000, N'kg', 20, N'Gia vị', 1, 251, 10, 64, 3, 25, N'tiêu, pepper, tiêu đen', GETUTCDATE());

-- ==========================================
-- 8. THÊM SẢN PHẨM - TRÁI CÂY
-- ==========================================
INSERT INTO Products (Name, Description, Price, Unit, QuantityInStock, Category, IsAvailable, Calories, Protein, Carbs, Fat, Fiber, Keywords, CreatedAt)
VALUES 
    (N'Chuối Cavendish', N'Chuối nhập khẩu ngọt', 35000, N'nải', 40, N'Trái cây', 1, 89, 1.1, 23, 0.3, 2.6, N'chuối, banana', GETUTCDATE()),
    (N'Táo Envy', N'Táo Envy nhập khẩu', 95000, N'kg', 25, N'Trái cây', 1, 52, 0.3, 14, 0.2, 2.4, N'táo, apple', GETUTCDATE()),
    (N'Cam sành', N'Cam sành ngọt mọng nước', 45000, N'kg', 35, N'Trái cây', 1, 47, 0.9, 12, 0.1, 2.4, N'cam, orange', GETUTCDATE()),
    (N'Bơ sáp', N'Bơ sáp Đắk Lắk', 65000, N'kg', 20, N'Trái cây', 1, 160, 2, 9, 15, 7, N'bơ, avocado', GETUTCDATE());

-- ==========================================
-- 9. THÊM SẢN PHẨM - ĐẬU & HẠT
-- ==========================================
INSERT INTO Products (Name, Description, Price, Unit, QuantityInStock, Category, IsAvailable, Calories, Protein, Carbs, Fat, Fiber, Keywords, CreatedAt)
VALUES 
    (N'Đậu phụ non', N'Đậu phụ non mịn', 15000, N'miếng', 40, N'Đậu & Hạt', 1, 76, 8, 2, 4.8, 0.3, N'đậu phụ, tofu, đậu hũ', GETUTCDATE()),
    (N'Đậu xanh', N'Đậu xanh nguyên hạt', 35000, N'kg', 30, N'Đậu & Hạt', 1, 347, 24, 63, 1.2, 16, N'đậu xanh, mung bean', GETUTCDATE()),
    (N'Hạt điều rang muối', N'Hạt điều Bình Phước', 180000, N'kg', 15, N'Đậu & Hạt', 1, 553, 18, 30, 44, 3, N'hạt điều, cashew', GETUTCDATE());

-- ==========================================
-- KIỂM TRA DỮ LIỆU
-- ==========================================
SELECT Category, COUNT(*) as ProductCount FROM Products GROUP BY Category;
SELECT * FROM Users;
SELECT * FROM HealthProfiles;

PRINT N'Seed data hoàn tất!'
