/**
 * 演示数据（仅在 DEMO_MODE=true 且数据库不可用时返回）
 * 与 prisma/seed.js 的结构保持一致，字段命名与 Prisma 查询结果对齐，
 * 因此上层页面无需区分「真实数据 / 演示数据」。
 * 接入 PostgreSQL 并 seed 后，这些静态数据不再被调用。
 */
const IMG = (n) => `/images/demo/${n}.svg`
const T = '2026-10-28T08:00:00.000Z'

export const demoSettingsList = [
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

export const demoSettings = Object.fromEntries(demoSettingsList.map((item) => [item.key, item.value]))

export const demoArticleCategories = [
  { id: 'ac-1', name: '器物志', slug: 'objects', description: '一器一物，皆有其来处', sortOrder: 1, count: 2 },
  { id: 'ac-2', name: '茶事', slug: 'tea', description: '茶烟起处，四时皆闲', sortOrder: 2, count: 1 },
  { id: 'ac-3', name: '生活美学', slug: 'lifestyle', description: '把审美落进日常', sortOrder: 3, count: 2 },
  { id: 'ac-4', name: '品牌纪事', slug: 'journal', description: '云涧的走访与记录', sortOrder: 4, count: 1 }
]

export const demoArticles = [
  {
    id: 'a-1', title: '青瓷一盏，藏一整个江南的雨', slug: 'celadon-and-rain',
    summary: '釉色如雨过天青，开片似岁月留痕。青瓷之美，在于不争。', coverImage: IMG(1),
    content: `## 雨过天青\n\n> 器物最动人的部分，往往不是它有多完美，而是它容许时间留下痕迹。\n\n青瓷的釉色，古人以「雨过天青云破处」形容。烧成温度、窑内气氛、冷却速度，任何一点偏差都会让那一抹青偏离分毫。\n\n### 一、泥与火\n\n- 胎土需经多次淘洗，静置陈腐，方得细腻\n- 施釉厚薄决定釉色的层次，往往要反复三至四次\n- 还原焰中，铁元素由三价转为二价，青色由此浮现\n\n### 二、开片\n\n出窑之后，釉面随温度收缩而细细开裂。这不是瑕疵，而是器物继续呼吸的证据。\n\n**器以载道，物以养心。**`,
    author: '云涧编辑部', tags: ['青瓷', '器物', '匠人'], status: 'PUBLISHED', isTop: true, viewCount: 328,
    publishedAt: T, createdAt: T, updatedAt: T, categoryId: 'ac-1', category: demoArticleCategories[0]
  },
  {
    id: 'a-2', title: '春日吃茶：从一盏乌龙开始', slug: 'spring-oolong',
    summary: '水温、器皿、出汤的节奏，决定了这一泡茶的性情。', coverImage: IMG(2),
    content: `## 一泡茶的时间\n\n春茶贵在鲜，乌龙贵在香。用 95℃ 左右的水，温杯、投茶、快出汤。\n\n### 建议节奏\n\n1. 温器：沸水淋壶、淋杯，倒净\n2. 醒茶：快速注水即出\n3. 第一至三泡：5 秒出汤\n\n茶席不必繁复，一只盖碗、两只小杯、一块素色茶巾，足够。`,
    author: '云涧编辑部', tags: ['乌龙', '茶事'], status: 'PUBLISHED', isTop: true, viewCount: 265,
    publishedAt: T, createdAt: T, updatedAt: T, categoryId: 'ac-2', category: demoArticleCategories[1]
  },
  {
    id: 'a-3', title: '书房里的一公尺，如何安放心神', slug: 'study-corner',
    summary: '不必大动干戈，一方桌面也能长出秩序感。', coverImage: IMG(3),
    content: `## 留白比填满更难\n\n书房的要义不在藏书多寡，而在于坐下时能立刻安静。\n\n- **只留当日在读的三种书**，其余归架\n- 一盏可调光的灯，色温 3000K 左右\n- 笔、砚、镇纸各归其位\n\n> 器物有序，心才有序。`,
    author: '云涧编辑部', tags: ['文房', '空间'], status: 'PUBLISHED', isTop: false, viewCount: 214,
    publishedAt: T, createdAt: T, updatedAt: T, categoryId: 'ac-3', category: demoArticleCategories[2]
  },
  {
    id: 'a-4', title: '走访龙泉：一位守窑人的四十年', slug: 'longquan-visiting',
    summary: '窑火不熄的四十年，他把一件事做到了极窄处。', coverImage: IMG(4),
    content: `## 山里的窑\n\n清晨六点，窑温已经升到 800℃。老师傅不看仪表，只看火色。\n\n「烧窑没什么秘诀，就是别偷懒。」他说。\n\n一窑成品率约六成，瑕疵品当场敲碎；釉料配方记在泛黄的笔记本上，不打字。`,
    author: '云涧编辑部', tags: ['走访', '匠人'], status: 'PUBLISHED', isTop: false, viewCount: 189,
    publishedAt: T, createdAt: T, updatedAt: T, categoryId: 'ac-4', category: demoArticleCategories[3]
  },
  {
    id: 'a-5', title: '白瓷不语：论器物中的克制之美', slug: 'white-porcelain',
    summary: '把所有表达让给器形与光，是最高级的克制。', coverImage: IMG(6),
    content: `## 少即是多\n\n白瓷没有釉色可倚仗，只能靠线条、厚薄、口沿的弧度说话。\n\n1. **口沿**：薄而不利，触唇温润\n2. **腹线**：收放有度，持握不坠手\n3. **底足**：修足干净，落桌无声`,
    author: '云涧编辑部', tags: ['白瓷', '审美'], status: 'PUBLISHED', isTop: false, viewCount: 156,
    publishedAt: T, createdAt: T, updatedAt: T, categoryId: 'ac-1', category: demoArticleCategories[0]
  },
  {
    id: 'a-6', title: '香席初识：从一支线香开始', slug: 'first-incense',
    summary: '不追求名贵，先学会辨认一味干净的木头香。', coverImage: IMG(5),
    content: `## 先慢下来\n\n初识香事，最容易被名词困住。其实只需要一支线香、一只素香插、一段不被打扰的十五分钟。\n\n> 香不是用来「闻」的，是用来把呼吸放慢的。`,
    author: '云涧编辑部', tags: ['香事', '入门'], status: 'PUBLISHED', isTop: false, viewCount: 132,
    publishedAt: T, createdAt: T, updatedAt: T, categoryId: 'ac-3', category: demoArticleCategories[2]
  }
]

export const demoProductCategories = [
  { id: 'pc-1', name: '茶', slug: 'tea', description: '山川叶脉，四时滋味', image: IMG(2), sortOrder: 1, parentId: null, count: 3 },
  { id: 'pc-2', name: '瓷', slug: 'porcelain', description: '泥火之间，釉色天成', image: IMG(1), sortOrder: 2, parentId: null, count: 3 },
  { id: 'pc-3', name: '香', slug: 'incense', description: '一缕清烟，半日闲光', image: IMG(5), sortOrder: 3, parentId: null, count: 1 },
  { id: 'pc-4', name: '文房', slug: 'stationery', description: '案头清供，笔墨从容', image: IMG(3), sortOrder: 4, parentId: null, count: 2 },
  { id: 'pc-5', name: '乌龙茶', slug: 'oolong', description: '', image: null, sortOrder: 11, parentId: 'pc-1', count: 1 },
  { id: 'pc-6', name: '青瓷', slug: 'celadon', description: '', image: null, sortOrder: 21, parentId: 'pc-2', count: 2 },
  { id: 'pc-7', name: '白瓷', slug: 'white-porcelain', description: '', image: null, sortOrder: 22, parentId: 'pc-2', count: 1 }
]

export const demoProductTypes = [
  { id: 'pt-1', name: '手作', slug: 'handmade', description: '匠人手工制作', sortOrder: 1 },
  { id: 'pt-2', name: '限量', slug: 'limited', description: '限量发售', sortOrder: 2 },
  { id: 'pt-3', name: '礼盒', slug: 'gift', description: '适合馈赠', sortOrder: 3 },
  { id: 'pt-4', name: '典藏', slug: 'collection', description: '收藏级作品', sortOrder: 4 }
]

const productSeed = [
  ['雨过天青 · 青瓷品茗杯', 'celadon-tea-cup', '龙泉手工 · 单杯', '釉色温润如雨后初晴，开片随使用渐生。', 268, 328, 1, 'pc-6', 'pt-1', true, true, 1],
  ['春山 · 高山乌龙茶', 'spring-mountain-oolong', '2026 春茶 · 100g', '高山云雾所育，兰香清扬，回甘绵长。', 328, 398, 2, 'pc-5', 'pt-3', true, true, 2],
  ['案上云 · 实木镇纸', 'cloud-paperweight', '黑胡桃木 · 一对', '取云纹之意，压纸亦压心。', 198, null, 3, 'pc-4', 'pt-1', false, true, 3],
  ['松风 · 沉香线香', 'agilawood-incense', '30 支 · 附素陶香插', '木质清甜，尾调微凉，适合独处时点燃。', 158, 188, 5, 'pc-3', 'pt-2', true, false, 4],
  ['素雪 · 白瓷盖碗', 'white-porcelain-gaiwan', '德化白瓷 · 110ml', '薄胎透光，口沿温润，最宜细辨茶香。', 368, 428, 6, 'pc-7', 'pt-4', false, true, 5],
  ['四时茶礼 · 典藏礼盒', 'four-seasons-gift', '一茶一杯 · 双件礼盒', '春茶与青瓷杯成对，赠人最宜。', 568, 688, 4, 'pc-1', 'pt-3', true, true, 6],
  ['烟岚 · 青瓷香插', 'celadon-incense-holder', '龙泉青瓷 · 单件', '一孔一烟，山影自生。', 128, null, 1, 'pc-6', 'pt-1', false, false, 7],
  ['墨痕 · 手工宣纸笔记本', 'xuan-paper-notebook', '线装 · 80 页', '手工宣纸内页，钢笔毛笔皆宜。', 88, null, 3, 'pc-4', 'pt-2', false, false, 8]
]

export const demoProducts = productSeed.map((row, index) => {
  const [name, slug, subtitle, summary, price, originalPrice, imageNo, categoryId, typeId, isFeatured, isRecommend, sortOrder] = row
  const base = (imageNo % 6) + 1
  return {
    id: `p-${index + 1}`,
    name, slug, subtitle, summary,
    description: `## 关于「${name}」\n\n${summary}\n\n> 器以载道，物以养心。\n\n每一件都经匠人手作与挑选，细微差异正是手作器物的温度。`,
    coverImage: IMG(imageNo),
    price, originalPrice, stock: 36 + index * 8, unit: '件',
    status: 'ON_SALE', isFeatured, isRecommend, sortOrder, viewCount: 210 - index * 13,
    origin: '中国', material: '天然材质', craft: '传统手作', packageInfo: '素雅礼盒',
    specs: [{ name: '规格', value: subtitle }, { name: '养护', value: '避免骤冷骤热，清水手洗' }],
    tags: ['东方器物', '手作'],
    seoTitle: '', seoDescription: '',
    categoryId, typeId,
    category: demoProductCategories.find((item) => item.id === categoryId) || null,
    type: demoProductTypes.find((item) => item.id === typeId) || null,
    images: [0, 1, 2].map((offset) => ({
      id: `pi-${index + 1}-${offset}`,
      productId: `p-${index + 1}`,
      url: IMG(((base + offset - 1) % 6) + 1),
      alt: `${name} 图 ${offset + 1}`,
      kind: 'CAROUSEL',
      sortOrder: offset
    })),
    createdAt: T, updatedAt: T
  }
})

export const demoBanners = [
  { id: 'b-1', title: '一器一物，自有山河', subtitle: '2026 春季新品 · 东方器物志', image: IMG(1), link: '/products', position: 'HOME', status: 'ENABLED', sortOrder: 1 },
  { id: 'b-2', title: '春茶初醒，山场入盏', subtitle: '高山乌龙 · 限时上新', image: IMG(2), link: '/products/spring-mountain-oolong', position: 'HOME', status: 'ENABLED', sortOrder: 2 },
  { id: 'b-3', title: '案头有云，心自安然', subtitle: '文房清供系列', image: IMG(3), link: '/articles', position: 'HOME', status: 'ENABLED', sortOrder: 3 }
]

/** 内存态：让演示模式下的增删改也能在本次进程内生效，方便体验后台 */
export const demoStore = {
  articles: demoArticles.map((item) => ({ ...item })),
  products: demoProducts.map((item) => ({ ...item, images: item.images.map((img) => ({ ...img })) })),
  banners: demoBanners.map((item) => ({ ...item })),
  settings: demoSettingsList.map((item) => ({ ...item })),
  articleCategories: demoArticleCategories.map((item) => ({ ...item })),
  productCategories: demoProductCategories.map((item) => ({ ...item })),
  productTypes: demoProductTypes.map((item) => ({ ...item }))
}
