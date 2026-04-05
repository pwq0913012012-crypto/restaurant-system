import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('a', 12)
  const waiterPassword = await bcrypt.hash('w', 12)
  const kitchenPassword = await bcrypt.hash('k', 12)

  await prisma.user.createMany({
    data: [
      { name: '管理員', email: 'a', password: adminPassword, role: 'ADMIN' },
      { name: '王小明', email: 'w', password: waiterPassword, role: 'WAITER' },
      { name: '李小華', email: 'w2', password: waiterPassword, role: 'WAITER' },
      { name: '張大廚', email: 'k', password: kitchenPassword, role: 'KITCHEN' },
      { name: '陳師傅', email: 'k2', password: kitchenPassword, role: 'KITCHEN' },
    ],
    skipDuplicates: true,
  })

  // Create categories
  const categoriesData = [
    { name: '前菜', sortOrder: 1 },
    { name: '湯品', sortOrder: 2 },
    { name: '主餐', sortOrder: 3 },
    { name: '海鮮', sortOrder: 4 },
    { name: '麵食', sortOrder: 5 },
    { name: '甜點', sortOrder: 6 },
    { name: '飲品', sortOrder: 7 },
  ]

  const categories: Record<string, string> = {}
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat })
    categories[cat.name] = created.id
  }

  // Create menu items (30+ items)
  const u = (id: string) => `https://images.unsplash.com/${id}?w=400&h=400&fit=crop`
  const menuItems = [
    // 前菜
    { categoryId: categories['前菜'], name: '涼拌小黃瓜', description: '清爽開胃的涼拌小菜', price: 80, isPopular: true, spicyLevel: 1, sortOrder: 1, image: u('photo-1625938145745-fe00f71b11a6') },
    { categoryId: categories['前菜'], name: '醬燒豆腐', description: '手工豆腐搭配秘製醬汁', price: 120, spicyLevel: 0, sortOrder: 2, image: u('photo-1546069901-ba9599a7e63c') },
    { categoryId: categories['前菜'], name: '椒麻雞絲', description: '川味椒麻醬汁拌手撕雞', price: 150, isPopular: true, spicyLevel: 2, sortOrder: 3, image: u('photo-1598103442097-8b74394b95c1') },
    { categoryId: categories['前菜'], name: '和風沙拉', description: '新鮮時蔬搭配和風醬', price: 100, spicyLevel: 0, sortOrder: 4, image: u('photo-1512621776951-a57141f2eefd') },
    { categoryId: categories['前菜'], name: '滷味拼盤', description: '招牌滷味精選五品', price: 200, isPopular: true, spicyLevel: 1, sortOrder: 5, image: u('photo-1544025162-d76694265947') },
    { categoryId: categories['前菜'], name: '泰式涼拌海鮮', description: '酸辣鮮蝦花枝搭配檸檬醬', price: 180, spicyLevel: 2, sortOrder: 6, image: u('photo-1559410545-0bdcd187e0a6') },
    { categoryId: categories['前菜'], name: '炸春捲', description: '酥脆外皮包裹鮮蔬豬肉', price: 90, spicyLevel: 0, sortOrder: 7, image: u('photo-1603133872878-684f208fb84b') },
    { categoryId: categories['前菜'], name: '皮蛋豆腐', description: '冰鎮豆腐搭配松花皮蛋', price: 80, spicyLevel: 0, sortOrder: 8, image: u('photo-1564834724105-918b73d1b9e0') },
    { categoryId: categories['前菜'], name: '蒜泥白肉', description: '薄切五花肉淋蒜泥醬汁', price: 160, spicyLevel: 1, sortOrder: 9, image: u('photo-1432139555190-58524dae6a55') },

    // 湯品
    { categoryId: categories['湯品'], name: '酸辣湯', description: '經典酸辣風味，料多實在', price: 120, isPopular: true, spicyLevel: 2, sortOrder: 1, image: u('photo-1547592180-85f173990554') },
    { categoryId: categories['湯品'], name: '蛤蜊絲瓜湯', description: '鮮甜蛤蜊搭配在地絲瓜', price: 150, spicyLevel: 0, sortOrder: 2, image: u('photo-1603105037880-880cd4edfb0d') },
    { categoryId: categories['湯品'], name: '牛肉清湯', description: '慢燉八小時牛骨高湯', price: 180, spicyLevel: 0, sortOrder: 3, image: u('photo-1547592166-23ac45744acd') },
    { categoryId: categories['湯品'], name: '味噌湯', description: '日式白味噌搭配豆腐海帶', price: 80, spicyLevel: 0, sortOrder: 4, image: u('photo-1607301405390-d831c242f59b') },
    { categoryId: categories['湯品'], name: '玉米濃湯', description: '香甜玉米搭配奶油濃縮', price: 100, spicyLevel: 0, sortOrder: 5, image: u('photo-1476718406336-bb5a9690ee2a') },
    { categoryId: categories['湯品'], name: '番茄蛋花湯', description: '家常風味番茄蛋花湯', price: 90, isPopular: true, spicyLevel: 0, sortOrder: 6, image: u('photo-1588166524941-3bf61a9c41db') },
    { categoryId: categories['湯品'], name: '藥膳排骨湯', description: '中藥材慢燉豬排骨', price: 200, spicyLevel: 0, sortOrder: 7, image: u('photo-1547592180-85f173990554') },

    // 主餐
    { categoryId: categories['主餐'], name: '紅燒牛腩飯', description: '慢燉牛腩搭配白飯，附小菜', price: 280, isPopular: true, spicyLevel: 1, sortOrder: 1, image: u('photo-1512058564366-18510be2db19') },
    { categoryId: categories['主餐'], name: '三杯雞腿飯', description: '九層塔香氣三杯雞，配白飯', price: 250, isPopular: true, spicyLevel: 1, sortOrder: 2, image: u('photo-1598103442097-8b74394b95c1') },
    { categoryId: categories['主餐'], name: '香煎豬排飯', description: '厚切豬排黃金酥炸', price: 260, spicyLevel: 0, sortOrder: 3, image: u('photo-1544025162-d76694265947') },
    { categoryId: categories['主餐'], name: '麻婆豆腐飯', description: '正宗川味麻婆豆腐', price: 220, spicyLevel: 3, sortOrder: 4, image: u('photo-1546069901-ba9599a7e63c') },
    { categoryId: categories['主餐'], name: '糖醋排骨飯', description: '酸甜糖醋醬汁裹排骨', price: 260, spicyLevel: 0, sortOrder: 5, image: u('photo-1529692236671-f1f6cf9683ba') },
    { categoryId: categories['主餐'], name: '宮保雞丁飯', description: '花生與乾辣椒的完美搭配', price: 240, isPopular: true, spicyLevel: 2, sortOrder: 6, image: u('photo-1455619452474-d2be8b1e70cd') },
    { categoryId: categories['主餐'], name: '滑蛋蝦仁飯', description: '嫩滑雞蛋搭配鮮蝦仁', price: 260, spicyLevel: 0, sortOrder: 7, image: u('photo-1565680018434-b513d5e5fd47') },
    { categoryId: categories['主餐'], name: '咖哩雞肉飯', description: '日式咖哩搭配嫩雞腿肉', price: 240, isPopular: true, spicyLevel: 1, sortOrder: 8, image: u('photo-1574484284002-952d92456975') },
    { categoryId: categories['主餐'], name: '蔥爆牛肉飯', description: '大火快炒牛肉搭配青蔥', price: 280, spicyLevel: 1, sortOrder: 9, image: u('photo-1504674900247-0877df9cc836') },
    { categoryId: categories['主餐'], name: '照燒鮭魚飯', description: '炙烤鮭魚搭配照燒醬', price: 320, spicyLevel: 0, sortOrder: 10, image: u('photo-1467003909585-2f8a72700288') },
    { categoryId: categories['主餐'], name: '泰式打拋豬飯', description: '九層塔炒豬肉搭配荷包蛋', price: 220, spicyLevel: 2, sortOrder: 11, image: u('photo-1559410545-0bdcd187e0a6') },
    { categoryId: categories['主餐'], name: '燒肉丼飯', description: '日式醬燒豬五花丼飯', price: 260, isPopular: true, spicyLevel: 0, sortOrder: 12, image: u('photo-1569050467447-ce54b3bbc37d') },

    // 海鮮
    { categoryId: categories['海鮮'], name: '清蒸鱸魚', description: '鮮活鱸魚清蒸，保留原味', price: 380, spicyLevel: 0, sortOrder: 1, image: u('photo-1467003909585-2f8a72700288') },
    { categoryId: categories['海鮮'], name: '蒜蓉蝦', description: '大蝦搭配蒜蓉粉絲蒸', price: 350, isPopular: true, spicyLevel: 0, sortOrder: 2, image: u('photo-1565680018434-b513d5e5fd47') },
    { categoryId: categories['海鮮'], name: '鐵板魷魚', description: '鐵板高溫快炒魷魚', price: 280, spicyLevel: 1, sortOrder: 3, image: u('photo-1565299624946-b28f40a0ae38') },
    { categoryId: categories['海鮮'], name: '避風塘蟹', description: '酥炸蒜酥搭配鮮蟹', price: 480, isPopular: true, spicyLevel: 1, sortOrder: 4, image: u('photo-1585032226651-759b368d7246') },
    { categoryId: categories['海鮮'], name: '奶油焗龍蝦', description: '波士頓龍蝦搭配奶油起司', price: 680, spicyLevel: 0, sortOrder: 5, image: u('photo-1553621042-f6e147245754') },
    { categoryId: categories['海鮮'], name: '椒鹽中卷', description: '酥炸中卷搭配椒鹽調味', price: 260, spicyLevel: 1, sortOrder: 6, image: u('photo-1551504734-5ee1c4a1479b') },
    { categoryId: categories['海鮮'], name: '蔥薑炒蛤蜊', description: '大火快炒搭配蔥薑提鮮', price: 220, spicyLevel: 0, sortOrder: 7, image: u('photo-1603105037880-880cd4edfb0d') },
    { categoryId: categories['海鮮'], name: '醬燒鮮魚', description: '當日新鮮魚貨紅燒入味', price: 360, isPopular: true, spicyLevel: 1, sortOrder: 8, image: u('photo-1519708227418-c8fd9a32b7a2') },

    // 麵食
    { categoryId: categories['麵食'], name: '牛肉麵', description: '招牌紅燒牛肉麵，肉大塊', price: 220, isPopular: true, spicyLevel: 1, sortOrder: 1, image: u('photo-1569718212165-3a8278d5f624') },
    { categoryId: categories['麵食'], name: '擔擔麵', description: '濃郁芝麻醬配辣油', price: 180, spicyLevel: 2, sortOrder: 2, image: u('photo-1552611052-33e04de1b100') },
    { categoryId: categories['麵食'], name: '陽春麵', description: '清湯掛麵，簡單美味', price: 100, spicyLevel: 0, sortOrder: 3, image: u('photo-1555126634-323283e090fa') },
    { categoryId: categories['麵食'], name: '炸醬麵', description: '北京風味炸醬拌麵', price: 160, spicyLevel: 1, sortOrder: 4, image: u('photo-1617196034183-421b4040ed20') },
    { categoryId: categories['麵食'], name: '海鮮炒麵', description: '蝦仁、花枝、蛤蜊大火快炒', price: 250, spicyLevel: 0, sortOrder: 5, image: u('photo-1603133872878-684f208fb84b') },
    { categoryId: categories['麵食'], name: '麻辣乾拌麵', description: '花椒辣油拌麵，麻而不燥', price: 150, isPopular: true, spicyLevel: 3, sortOrder: 6, image: u('photo-1552611052-33e04de1b100') },
    { categoryId: categories['麵食'], name: '餛飩湯麵', description: '鮮肉餛飩搭配清湯麵條', price: 140, spicyLevel: 0, sortOrder: 7, image: u('photo-1569718212165-3a8278d5f624') },
    { categoryId: categories['麵食'], name: '蕃茄牛肉麵', description: '蕃茄湯底搭配嫩牛肉塊', price: 240, spicyLevel: 0, sortOrder: 8, image: u('photo-1547592180-85f173990554') },
    { categoryId: categories['麵食'], name: '沙茶炒麵', description: '沙茶醬搭配豬肉蔬菜快炒', price: 180, spicyLevel: 1, sortOrder: 9, image: u('photo-1555126634-323283e090fa') },

    // 甜點
    { categoryId: categories['甜點'], name: '芒果冰淇淋', description: '季節限定，新鮮芒果製作', price: 120, isPopular: true, spicyLevel: 0, sortOrder: 1, image: u('photo-1497034825429-c343d7c6a68f') },
    { categoryId: categories['甜點'], name: '紅豆湯圓', description: '手工湯圓搭配綿密紅豆', price: 80, spicyLevel: 0, sortOrder: 2, image: u('photo-1563245372-f21724e3856d') },
    { categoryId: categories['甜點'], name: '提拉米蘇', description: '義式經典甜點', price: 150, spicyLevel: 0, sortOrder: 3, image: u('photo-1571877227200-a0d98ea607e9') },
    { categoryId: categories['甜點'], name: '烤布蕾', description: '法式焦糖烤布丁', price: 130, isPopular: true, spicyLevel: 0, sortOrder: 4, image: u('photo-1470324161839-ce2bb6fa6bc3') },
    { categoryId: categories['甜點'], name: '抹茶紅豆蛋糕', description: '日式抹茶搭配蜜紅豆', price: 140, spicyLevel: 0, sortOrder: 5, image: u('photo-1563729784474-d77dbb933a9e') },
    { categoryId: categories['甜點'], name: '巧克力熔岩蛋糕', description: '濃郁巧克力流心蛋糕', price: 160, isPopular: true, spicyLevel: 0, sortOrder: 6, image: u('photo-1578985545062-69928b1d9587') },
    { categoryId: categories['甜點'], name: '楊枝甘露', description: '芒果椰奶搭配西米露', price: 100, spicyLevel: 0, sortOrder: 7, image: u('photo-1546039907-7b3a4711b795') },
    { categoryId: categories['甜點'], name: '豆花', description: '傳統手工豆花，配料自選', price: 60, spicyLevel: 0, sortOrder: 8, image: u('photo-1488477181946-6428a0291777') },

    // 飲品
    { categoryId: categories['飲品'], name: '珍珠奶茶', description: '手搖珍珠奶茶，甜度可調', price: 70, isPopular: true, spicyLevel: 0, sortOrder: 1, image: u('photo-1558857563-b371033873b8') },
    { categoryId: categories['飲品'], name: '冬瓜茶', description: '古早味冬瓜茶', price: 50, spicyLevel: 0, sortOrder: 2, image: u('photo-1556679343-c7306c1976bc') },
    { categoryId: categories['飲品'], name: '鮮榨柳橙汁', description: '100%新鮮柳橙現榨', price: 90, spicyLevel: 0, sortOrder: 3, image: u('photo-1600271886742-f049cd451bba') },
    { categoryId: categories['飲品'], name: '烏龍茶', description: '高山烏龍冷泡茶', price: 60, spicyLevel: 0, sortOrder: 4, image: u('photo-1564890369478-c89ca6d9cde9') },
    { categoryId: categories['飲品'], name: '可樂', description: '冰涼可樂', price: 40, spicyLevel: 0, sortOrder: 5, image: u('photo-1527960471264-932f39eb5846') },
    { categoryId: categories['飲品'], name: '啤酒', description: '台灣金牌啤酒 330ml', price: 80, spicyLevel: 0, sortOrder: 6, image: u('photo-1608270586620-248524c67de9') },
    { categoryId: categories['飲品'], name: '檸檬紅茶', description: '新鮮檸檬搭配紅茶', price: 60, isPopular: true, spicyLevel: 0, sortOrder: 7, image: u('photo-1556679343-c7306c1976bc') },
    { categoryId: categories['飲品'], name: '百香果綠茶', description: '百香果搭配茉莉綠茶', price: 70, spicyLevel: 0, sortOrder: 8, image: u('photo-1544145945-f90425340c7e') },
    { categoryId: categories['飲品'], name: '西瓜汁', description: '當季西瓜鮮榨', price: 80, spicyLevel: 0, sortOrder: 9, image: u('photo-1600271886742-f049cd451bba') },
    { categoryId: categories['飲品'], name: '拿鐵咖啡', description: '義式濃縮搭配鮮奶', price: 100, spicyLevel: 0, sortOrder: 10, image: u('photo-1561047029-3000c68339ca') },
    { categoryId: categories['飲品'], name: '美式咖啡', description: '手沖單品美式', price: 80, spicyLevel: 0, sortOrder: 11, image: u('photo-1551030173-122aabc4489c') },
    { categoryId: categories['飲品'], name: '蜂蜜檸檬水', description: '天然蜂蜜搭配新鮮檸檬', price: 70, spicyLevel: 0, sortOrder: 12, image: u('photo-1523371683773-affb203e3a45') },
  ]

  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        isPopular: item.isPopular || false,
        image: item.image || '',
        tags: [],
      },
    })
  }

  // Create 30 tables across zones
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const tableData = []
  for (let i = 1; i <= 10; i++) {
    tableData.push({ number: i, seats: i <= 5 ? 4 : 6, zone: 'A區', qrCode: `${appUrl}/order/${i}` })
  }
  for (let i = 11; i <= 20; i++) {
    tableData.push({ number: i, seats: i <= 15 ? 4 : 6, zone: 'B區', qrCode: `${appUrl}/order/${i}` })
  }
  for (let i = 21; i <= 25; i++) {
    tableData.push({ number: i, seats: 4, zone: '露台', qrCode: `${appUrl}/order/${i}` })
  }
  for (let i = 26; i <= 30; i++) {
    tableData.push({ number: i, seats: i <= 28 ? 8 : 12, zone: '包廂', qrCode: `${appUrl}/order/${i}` })
  }

  await prisma.table.createMany({ data: tableData, skipDuplicates: true })

  console.log('Seed complete!')
  console.log('')
  console.log('Login accounts:')
  console.log('  Admin:   a / a')
  console.log('  Waiter:  w / w')
  console.log('  Kitchen: k / k')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
