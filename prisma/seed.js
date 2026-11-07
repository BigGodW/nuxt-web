/**
 * 初始化种子数据
 * 运行：npm run db:seed
 * 可重复执行（全部使用 upsert，不会重复插入）
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const IMG = (n) => `/images/demo/${n}.svg`

const settings = [
  { key: 'siteName', label: '网站名称', value: '云涧', group: 'basic', type: 'text', sortOrder: 1 },
  { key: 'siteSlogan', label: '网站标语', value: '东方器物 · 生活美学', group: 'basic', type: 'text', sortOrder: 2 },
  { key: 'siteDescription', label: '网站简介', value: '云涧甄选东方器物、茶瓷文房，以器物为引，记录有温度的日常。', group: 'basic', type: 'textarea', sortOrder: 3 },
  { key: 'siteKeywords', label: 'SEO 关键词', value: '东方美学,茶器,青瓷,文房,手作,中国风', group: 'seo', type: 'text', sortOrder: 4 },
  { key: 'logoText', label: '印章文字', value: '云涧', group: 'basic', type: 'text', sortOrder: 5 },
  { key: 'homeHeroTitle', label: '首页主标题', value: '一器一物，自有山河', group: 'home', type: 'text', sortOrder: 6 },
  { key: 'homeHeroSubtitle', label: '首页副标题', value: '以器物为媒，重拾东方生活的从容与雅致', group: 'home', type: 'text', sortOrder: 7 },
  { key: 'homeQuote', label: '首页题句', value: '器以载道，物以养心', group: 'home', type: 'text', sortOrder: 8 },
  { key: 'aboutStory', label: '品牌故事', value: '云涧始于对日常器物的注视。我们相信，美不在远处，而在一只茶盏的温度、一缕沉香的起落之间。走访匠人、寻访古法，把经得起时间的东西带回当下。', group: 'about', type: 'textarea', sortOrder: 9 },
  { key: 'contactPhone', label: '联系电话', value: '400-800-2026', group: 'contact', type: 'text', sortOrder: 10 },
  { key: 'contactEmail', label: '联系邮箱', value: 'hello@yunjian.cn', group: 'contact', type: 'text', sortOrder: 11 },
  { key: 'address', label: '联系地址', value: '中国 · 杭州 · 西湖区云涧巷 8 号', group: 'contact', type: 'text', sortOrder: 12 },
  { key: 'wechatQr', label: '微信公众号二维码', value: '', group: 'contact', type: 'image', sortOrder: 13 },
  { key: 'icp', label: '备案号', value: '浙ICP备 00000000 号', group: 'contact', type: 'text', sortOrder: 14 },
  { key: 'footerNote', label: '页脚寄语', value: '愿日子清简，器物长伴。', group: 'contact', type: 'text', sortOrder: 15 }
]

const articleCategories = [
  { name: '器物志', slug: 'objects', description: '一器一物，皆有其来处', sortOrder: 1 },
  { name: '茶事', slug: 'tea', description: '茶烟起处，四时皆闲', sortOrder: 2 },
  { name: '生活美学', slug: 'lifestyle', description: '把审美落进日常', sortOrder: 3 },
  { name: '品牌纪事', slug: 'journal', description: '云涧的走访与记录', sortOrder: 4 }
]

const articles = [
  {
    title: '青瓷一盏，藏一整个江南的雨',
    slug: 'celadon-and-rain',
    categorySlug: 'objects',
    summary: '釉色如雨过天青，开片似岁月留痕。青瓷之美，在于不争。',
    coverImage: IMG(1),
    tags: ['青瓷', '器物', '匠人'],
    content: `## 雨过天青

> 器物最动人的部分，往往不是它有多完美，而是它容许时间留下痕迹。

青瓷的釉色，古人以「雨过天青云破处」形容。烧成温度、窑内气氛、冷却速度，任何一点偏差都会让那一抹青偏离分毫。匠人能做的，是把可控的部分做到极致，剩下的交给火。

### 一、泥与火

- 胎土需经多次淘洗，静置陈腐，方得细腻
- 施釉厚薄决定釉色的层次，往往要反复三至四次
- 还原焰中，铁元素由三价转为二价，青色由此浮现

### 二、开片

出窑之后，釉面随温度收缩而细细开裂。这不是瑕疵，而是器物继续呼吸的证据。用得越久，纹路越深，茶汤沿裂纹渗入，渐渐养出独属于主人的色泽。

**器以载道，物以养心。** 一只杯子被使用了十年，它便不再只是一件器物。`
  },
  {
    title: '春日吃茶：从一盏乌龙开始',
    slug: 'spring-oolong',
    categorySlug: 'tea',
    summary: '水温、器皿、出汤的节奏，决定了这一泡茶的性情。',
    coverImage: IMG(2),
    tags: ['乌龙', '茶事'],
    content: `## 一泡茶的时间

春茶贵在鲜，乌龙贵在香。用 95℃ 左右的水，温杯、投茶、快出汤，前三泡不讲究技巧，讲究的是不打扰。

### 建议节奏

1. 温器：沸水淋壶、淋杯，倒净
2. 醒茶：快速注水即出，唤醒叶片
3. 第一至三泡：5 秒出汤
4. 之后每泡递增 3–5 秒

茶席不必繁复，一只盖碗、两只小杯、一块素色茶巾，足够。`
  },
  {
    title: '书房里的一公尺，如何安放心神',
    slug: 'study-corner',
    categorySlug: 'lifestyle',
    summary: '不必大动干戈，一方桌面也能长出秩序感。',
    coverImage: IMG(3),
    tags: ['文房', '空间'],
    content: `## 留白比填满更难

书房的要义不在藏书多寡，而在于坐下时能立刻安静。

- **只留当日在读的三种书**，其余归架
- 一盏可调光的灯，色温 3000K 左右
- 笔、砚、镇纸各归其位，动线不超过一臂

> 器物有序，心才有序。

每周花十分钟整理桌面，比一次大扫除更有效。`
  },
  {
    title: '走访龙泉：一位守窑人的四十年',
    slug: 'longquan-visiting',
    categorySlug: 'journal',
    summary: '窑火不熄的四十年，他把一件事做到了极窄处。',
    coverImage: IMG(4),
    tags: ['走访', '匠人'],
    content: `## 山里的窑

清晨六点，窑温已经升到 800℃。老师傅不看仪表，只看火色：橘红、橙黄、近白，各有各的时刻。

「烧窑没什么秘诀，就是别偷懒。」他说。

### 我们记录了三件事

1. 一窑成品率约六成，瑕疵品当场敲碎
2. 釉料配方记在泛黄的笔记本上，不打字
3. 徒弟学成至少要七年

离开时山间起雾，回头看窑口那点红光，忽然明白所谓传承，不过是有人愿意把时间反复投进同一件事里。`
  },
  {
    title: '香席初识：从一支线香开始',
    slug: 'first-incense',
    categorySlug: 'lifestyle',
    summary: '不追求名贵，先学会辨认一味干净的木头香。',
    coverImage: IMG(5),
    tags: ['香事', '入门'],
    content: `## 先慢下来

初识香事，最容易被名词困住。其实只需要一支线香、一只素香插、一段不被打扰的十五分钟。

- 点燃后轻扇灭焰，勿用口吹
- 前三十秒闻烟火气，之后再辨本香
- 记录：凉意、甜意、木质、药气

> 香不是用来「闻」的，是用来把呼吸放慢的。`
  },
  {
    title: '白瓷不语：论器物中的克制之美',
    slug: 'white-porcelain',
    categorySlug: 'objects',
    summary: '把所有表达让给器形与光，是最高级的克制。',
    coverImage: IMG(6),
    tags: ['白瓷', '审美'],
    content: `## 少即是多

白瓷没有釉色可倚仗，只能靠线条、厚薄、口沿的弧度说话。差一毫米，气质就变了。

### 挑选时可看三处

1. **口沿**：薄而不利，触唇温润
2. **腹线**：收放有度，持握不坠手
3. **底足**：修足干净，落桌无声

素器最考验用的人，也最衬得起日常。`
  }
]

const productCategories = [
  { name: '茶', slug: 'tea', description: '山川叶脉，四时滋味', sortOrder: 1, image: IMG(2) },
  { name: '瓷', slug: 'porcelain', description: '泥火之间，釉色天成', sortOrder: 2, image: IMG(1) },
  { name: '香', slug: 'incense', description: '一缕清烟，半日闲光', sortOrder: 3, image: IMG(5) },
  { name: '文房', slug: 'stationery', description: '案头清供，笔墨从容', sortOrder: 4, image: IMG(3) },
  { name: '乌龙茶', slug: 'oolong', parentSlug: 'tea', sortOrder: 11 },
  { name: '青瓷', slug: 'celadon', parentSlug: 'porcelain', sortOrder: 21 },
  { name: '白瓷', slug: 'white-porcelain', parentSlug: 'porcelain', sortOrder: 22 }
]

const productTypes = [
  { name: '手作', slug: 'handmade', description: '匠人手工制作', sortOrder: 1 },
  { name: '限量', slug: 'limited', description: '限量发售', sortOrder: 2 },
  { name: '礼盒', slug: 'gift', description: '适合馈赠', sortOrder: 3 },
  { name: '典藏', slug: 'collection', description: '收藏级作品', sortOrder: 4 }
]

const products = [
  {
    name: '雨过天青 · 青瓷品茗杯', slug: 'celadon-tea-cup', subtitle: '龙泉手工 · 单杯',
    summary: '釉色温润如雨后初晴，开片随使用渐生。', categorySlug: 'celadon', typeSlug: 'handmade',
    price: 268, originalPrice: 328, stock: 36, unit: '只', origin: '浙江龙泉', material: '高岭土 · 青釉', craft: '柴窑还原烧',
    packageInfo: '桐木礼盒', specs: [{ name: '容量', value: '85ml' }, { name: '尺寸', value: '口径 6.5cm / 高 4.2cm' }, { name: '养护', value: '清水手洗，避免骤冷骤热' }],
    tags: ['青瓷', '茶器'], coverImage: IMG(1), isFeatured: true, isRecommend: true, sortOrder: 1,
    description: `## 一只杯子的来历

选自龙泉本地胎土，经陈腐、拉坯、修足、多次施釉，入柴窑以还原焰烧成。釉面在冷却中自然开片，每一只的纹路都不相同。

> 用得越久，越像自己的东西。

**注意**：手工器物存在细微色差与釉点，属正常工艺特征。`
  },
  {
    name: '春山 · 高山乌龙茶', slug: 'spring-mountain-oolong', subtitle: '2026 春茶 · 100g',
    summary: '高山云雾所育，兰香清扬，回甘绵长。', categorySlug: 'oolong', typeSlug: 'gift',
    price: 328, originalPrice: 398, stock: 88, unit: '罐', origin: '福建武夷', material: '乌龙茶青', craft: '传统炭焙',
    packageInfo: '锡罐 + 素麻布套', specs: [{ name: '净含量', value: '100g' }, { name: '烘焙度', value: '中轻火' }, { name: '保质期', value: '18 个月' }],
    tags: ['春茶', '乌龙'], coverImage: IMG(2), isFeatured: true, isRecommend: true, sortOrder: 2,
    description: `## 山场与火

海拔 900 米以上茶园，手工采摘一芽三叶，日光萎凋后传统炭焙三次。

### 冲泡建议

- 水温 95℃
- 盖碗 110ml / 投茶 7g
- 前三泡 5 秒出汤`
  },
  {
    name: '案上云 · 实木镇纸', slug: 'cloud-paperweight', subtitle: '黑胡桃木 · 一对',
    summary: '取云纹之意，压纸亦压心。', categorySlug: 'stationery', typeSlug: 'handmade',
    price: 198, originalPrice: null, stock: 52, unit: '对', origin: '江苏苏州', material: '北美黑胡桃', craft: '手工打磨 · 木蜡油',
    packageInfo: '棉麻袋', specs: [{ name: '单支尺寸', value: '22 × 3.2 × 2 cm' }, { name: '重量', value: '约 320g / 对' }],
    tags: ['文房', '木作'], coverImage: IMG(3), isFeatured: false, isRecommend: true, sortOrder: 3,
    description: `## 压住一页纸，也压住一段心绪

木纹顺器形走向，边缘倒圆角，握感温润。表面仅以木蜡油处理，保留木头呼吸的孔隙。

长期使用会随手部油脂渐生包浆。`
  },
  {
    name: '松风 · 沉香线香', slug: 'agilawood-incense', subtitle: '30 支 · 附素陶香插',
    summary: '木质清甜，尾调微凉，适合独处时点燃。', categorySlug: 'incense', typeSlug: 'limited',
    price: 158, originalPrice: 188, stock: 120, unit: '盒', origin: '广东东莞', material: '天然沉香粉', craft: '古法合香',
    packageInfo: '再生纸盒', specs: [{ name: '数量', value: '30 支' }, { name: '单支燃时', value: '约 25 分钟' }, { name: '线香长度', value: '10cm' }],
    tags: ['沉香', '香事'], coverImage: IMG(5), isFeatured: true, isRecommend: false, sortOrder: 4,
    description: `## 干净的一味木头香

不添加香精与助燃剂，仅以天然香粉与少量楠木粘粉合制。

> 点燃后轻扇灭焰，静待三十秒，再辨本香。`
  },
  {
    name: '素雪 · 白瓷盖碗', slug: 'white-porcelain-gaiwan', subtitle: '德化白瓷 · 110ml',
    summary: '薄胎透光，口沿温润，最宜细辨茶香。', categorySlug: 'white-porcelain', typeSlug: 'collection',
    price: 368, originalPrice: 428, stock: 24, unit: '套', origin: '福建德化', material: '高白泥', craft: '高温素烧',
    packageInfo: '锦盒', specs: [{ name: '容量', value: '110ml' }, { name: '组成', value: '碗身 / 碗盖 / 托碟' }],
    tags: ['白瓷', '茶器'], coverImage: IMG(6), isFeatured: false, isRecommend: true, sortOrder: 5,
    description: `## 把所有表达让给线条

无釉色可倚，便只在器形上下功夫。口沿薄而不利，腹线收放有度，落桌无声。

**提示**：薄胎传热快，温杯后建议以茶巾持握。`
  },
  {
    name: '四时茶礼 · 典藏礼盒', slug: 'four-seasons-gift', subtitle: '一茶一杯 · 双件礼盒',
    summary: '春茶与青瓷杯成对，赠人最宜。', categorySlug: 'tea', typeSlug: 'gift',
    price: 568, originalPrice: 688, stock: 40, unit: '盒', origin: '中国', material: '茶 / 瓷', craft: '组合礼盒',
    packageInfo: '桐木礼盒 + 手写笺', specs: [{ name: '内容', value: '高山乌龙 50g × 1、青瓷品茗杯 × 2' }, { name: '礼盒尺寸', value: '28 × 18 × 9 cm' }],
    tags: ['礼盒', '馈赠'], coverImage: IMG(4), isFeatured: true, isRecommend: true, sortOrder: 6,
    description: `## 一份不必多言的礼物

茶与器成对，附一张可代写的素笺。礼盒采用桐木，可长期收纳小物。`
  },
  {
    name: '烟岚 · 青瓷香插', slug: 'celadon-incense-holder', subtitle: '龙泉青瓷 · 单件',
    summary: '一孔一烟，山影自生。', categorySlug: 'celadon', typeSlug: 'handmade',
    price: 128, originalPrice: null, stock: 66, unit: '只', origin: '浙江龙泉', material: '青釉瓷', craft: '手工修坯',
    packageInfo: '纸盒', specs: [{ name: '尺寸', value: '直径 7cm / 高 2.4cm' }, { name: '适用', value: '线香（孔径 2mm）' }],
    tags: ['青瓷', '香器'], coverImage: IMG(1), isFeatured: false, isRecommend: false, sortOrder: 7,
    description: `## 山岚起于案头

器形取远山轮廓，中央一孔，青釉积釉处色深，如山中雾。`
  },
  {
    name: '墨痕 · 手工宣纸笔记本', slug: 'xuan-paper-notebook', subtitle: '线装 · 80 页',
    summary: '手工宣纸内页，钢笔毛笔皆宜。', categorySlug: 'stationery', typeSlug: 'limited',
    price: 88, originalPrice: null, stock: 150, unit: '册', origin: '安徽泾县', material: '手工宣纸', craft: '传统线装',
    packageInfo: '素纸封套', specs: [{ name: '页数', value: '80 页' }, { name: '尺寸', value: 'A5' }],
    tags: ['纸品', '文房'], coverImage: IMG(3), isFeatured: false, isRecommend: false, sortOrder: 8,
    description: `## 写给慢下来的字

内页采用半生熟宣，不洇墨，适合日常书写与小楷练习。封面为素色布纹纸，可自行题签。`
  }
]

const banners = [
  { title: '一器一物，自有山河', subtitle: '2026 春季新品 · 东方器物志', image: IMG(1), link: '/products', position: 'HOME', sortOrder: 1 },
  { title: '春茶初醒，山场入盏', subtitle: '高山乌龙 · 限时上新', image: IMG(2), link: '/products/spring-mountain-oolong', position: 'HOME', sortOrder: 2 },
  { title: '案头有云，心自安然', subtitle: '文房清供系列', image: IMG(3), link: '/articles', position: 'HOME', sortOrder: 3 }
]

async function main() {
  console.log('· 初始化管理员…')
  const passwordHash = await bcrypt.hash('admin123', 10)
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', passwordHash, nickname: '云涧主人', role: 'super_admin' }
  })

  console.log('· 初始化网站信息…')
  for (const item of settings) {
    await prisma.siteSetting.upsert({ where: { key: item.key }, update: { label: item.label, group: item.group, type: item.type, sortOrder: item.sortOrder }, create: item })
  }

  console.log('· 初始化文章分类与文章…')
  const articleCategoryMap = new Map()
  for (const item of articleCategories) {
    const row = await prisma.articleCategory.upsert({ where: { slug: item.slug }, update: { name: item.name, sortOrder: item.sortOrder }, create: item })
    articleCategoryMap.set(item.slug, row.id)
  }
  for (const [index, item] of articles.entries()) {
    const { categorySlug, ...rest } = item
    const data = {
      ...rest,
      categoryId: articleCategoryMap.get(categorySlug),
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - index * 86400000 * 3),
      isTop: index < 2,
      viewCount: 320 - index * 37
    }
    await prisma.article.upsert({ where: { slug: item.slug }, update: data, create: data })
  }

  console.log('· 初始化商品品类与类型…')
  const productCategoryMap = new Map()
  for (const item of productCategories) {
    const { parentSlug, ...rest } = item
    const row = await prisma.productCategory.upsert({
      where: { slug: item.slug },
      update: { name: item.name, sortOrder: item.sortOrder, parentId: parentSlug ? productCategoryMap.get(parentSlug) : null },
      create: { ...rest, parentId: parentSlug ? productCategoryMap.get(parentSlug) : null }
    })
    productCategoryMap.set(item.slug, row.id)
  }
  const productTypeMap = new Map()
  for (const item of productTypes) {
    const row = await prisma.productType.upsert({ where: { slug: item.slug }, update: { name: item.name, sortOrder: item.sortOrder }, create: item })
    productTypeMap.set(item.slug, row.id)
  }

  console.log('· 初始化商品与轮播图…')
  for (const item of products) {
    const { categorySlug, typeSlug, ...rest } = item
    const data = {
      ...rest,
      categoryId: productCategoryMap.get(categorySlug),
      typeId: productTypeMap.get(typeSlug),
      status: 'ON_SALE',
      viewCount: 210 - item.sortOrder * 13
    }
    const row = await prisma.product.upsert({ where: { slug: item.slug }, update: data, create: data })
    // 每张商品配 3 张轮播图（演示复用素材，后台可替换为七牛云真实图片）
    const count = await prisma.productImage.count({ where: { productId: row.id } })
    if (count === 0) {
      const base = (item.sortOrder % 6) + 1
      await prisma.productImage.createMany({
        data: [0, 1, 2].map((offset) => ({
          productId: row.id,
          url: IMG(((base + offset - 1) % 6) + 1),
          alt: `${item.name} 图 ${offset + 1}`,
          kind: 'CAROUSEL',
          sortOrder: offset
        }))
      })
    }
  }

  console.log('· 初始化首页轮播…')
  for (const item of banners) {
    const exists = await prisma.banner.findFirst({ where: { title: item.title, position: item.position } })
    if (exists) await prisma.banner.update({ where: { id: exists.id }, data: { ...item, status: 'ENABLED' } })
    else await prisma.banner.create({ data: { ...item, status: 'ENABLED' } })
  }

  console.log('\n✅ 种子数据完成；默认后台账号：admin / admin123（上线前请修改）')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
