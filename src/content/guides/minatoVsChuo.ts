// Bilingual content for the /guides/minato-vs-chuo article. English content is
// shown for both "en" and "ja" i18n languages (this guide has no separate
// Japanese translation, matching the existing fukuoka-vs-osaka guide); "zh-TW"
// gets an independently-authored Traditional Chinese version rather than a
// literal translation, since the source article is explicitly written for
// HK/TW cash buyers evaluating Tokyo. Sources are cited in their original
// Japanese and shared across both language versions.

export interface ConvergenceItem {
  year: string;
  name: string;
  desc: string;
}

export interface ScoreCell {
  text: string;
  tone: "good" | "mid" | "risk";
}

export interface ScoreRow {
  factor: string;
  minato: ScoreCell;
  chuo: ScoreCell;
}

export interface InsightItem {
  label: string;
  text: string;
}

export interface GuideMinatoChuoContent {
  eyebrow: string;
  titleLine1: string;
  titleEmphasis: string;
  deck: string;
  metaLine: string;
  section1: {
    heading: string;
    p1: string;
    p2: string;
    thesisLabel: string;
    thesisText: string;
  };
  minato: {
    tag: string;
    p1: string;
    p2: string;
    pullStatNum: string;
    pullStatInsight: string;
    pullStatNote: string;
    p3: string;
    insightTitle: string;
    insightBody: string;
  };
  lifestyleSplit: {
    minatoLabel: string;
    minatoText: string;
    chuoLabel: string;
    chuoText: string;
  };
  chuo: {
    tag: string;
    p1: string;
    convergenceLabel: string;
    convergenceItems: ConvergenceItem[];
    convergenceNote: string;
    p2: string;
    p3: string;
    pullStatNum: string;
    pullStatInsight: string;
    pullStatNote: string;
    insightTitle: string;
    insightItems: InsightItem[];
  };
  section4: { heading: string; p1: string; p2: string; p3: string };
  section5: { heading: string; p1: string; p2: string };
  scorecard: {
    heading: string;
    subtitle: string;
    minatoColLabel: string;
    chuoColLabel: string;
    rows: ScoreRow[];
  };
  ourRead: {
    heading: string;
    label: string;
    minatoWard: string;
    minatoText: string;
    chuoWard: string;
    chuoText: string;
  };
  cta: { heading: string; body: string; button: string };
  footerNote: string;
}

export const EN_CONTENT: GuideMinatoChuoContent = {
  eyebrow: "Tokyo · Investment Analysis · July 2026",
  titleLine1: "港区 vs 中央区:",
  titleEmphasis: "Same city, two completely different lives",
  deck: "Both wards draw the same HK and TW buyers. The numbers are closer than you'd expect. What's not close at all is the daily experience of actually living there — and that difference matters more than the yield gap.",
  metaLine: "AiSumai Editorial · July 2026 · Research through Q2 2026",
  section1: {
    heading: "Same city, different life",
    p1: "Walk ten minutes through 麻布台ヒルズ on a Tuesday morning, then take the subway to 日本橋 and walk those streets for an hour. You will feel the difference before you can articulate it. One place has been designed for you — globally, carefully, expensively. The other is a city that has been living its own life for four centuries and is now, quietly, becoming something new again.",
    p2: "Both wards draw the same kind of overseas buyer: HK or TW, cash, looking at Tokyo seriously. The price gap between them is smaller than most people expect. What is not small at all is what your daily life actually looks like once you are there.",
    thesisLabel: "The argument this article makes",
    thesisText:
      "“港区 is a life that has been curated for you — international, polished, ready to go. 中央区 is a life that rewards you for paying attention. Neither is better. They suit different people.”",
  },
  minato: {
    tag: "Global prestige, fully priced",
    p1: "On July 10 this week, a new FamilyMart opened next to 麻布台ヒルズ. That sentence requires unpacking. NIGO — the designer behind A BATHING APE, HUMAN MADE, and currently KENZO — is creative director. The architect is Masamichi Katayama of Wonderwall, who does Uniqlo's global flagships. The coffee is by Tetsu Kasuya, the first Asian World Brewers Cup champion. Staff speak up to five languages. The roof has a forest. It does not look like a convenience store.",
    p2: "This is not a story about a shop. It is a signal about who this neighborhood expects its residents to be, and what they consider ordinary. In 港区, the baseline experience of daily life is itself curated. Your grocery run passes a Thomas Heatherwick-designed park. Your building might be the tallest in Japan. The hotel at the base of that building is an Aman. The ward has 80 embassies and 22,614 foreign residents — the highest concentration of any Tokyo ward.",
    pullStatNum: "+106.4%",
    pullStatInsight:
      "港区 condo price growth over 9 years — highest of Tokyo's 23 wards, and the story behind it is now fully understood by every serious buyer in Hong Kong, Taipei, and Singapore.",
    pullStatNote: "Source: マンションリサーチ / マンションナビ, April 2025 [1]",
    p3: "That last point is the tension. 港区 has delivered the most consistent, most legible prestige narrative in Tokyo real estate for a decade. 麻布, 虎之門, 赤坂 — these are names that need no translation in the rooms where this kind of decision gets made. The exit is to another buyer who shares the same reference points. That is a real and valuable kind of liquidity.",
    insightTitle: "The honest yield problem",
    insightBody:
      "A ¥150M property in 港区 renting at ¥400,000/month is a 3.2% surface yield. After management fees, 修繕積立金, and fixed asset tax — particularly high on tower condos — net yield is 1–2%. Leveraged buyers face near-zero or negative cash flow at current loan rates. 港区 is a store of value and a brand play. It is not an income investment. Anyone selling it as one is not being straight with you.",
  },
  lifestyleSplit: {
    minatoLabel: "A weekday morning in 港区",
    minatoText:
      "Coffee from the Tetsu Kasuya counter at FAMIMA PARK, designed by NIGO. Walk past the Heatherwick garden at 麻布台ヒルズ to a client meeting at 虎ノ門ヒルズ. Lunch reservation at a restaurant that opened in a building completed six months ago. The person sitting next to you is a diplomat, a fund manager, or someone you cannot quite place.",
    chuoLabel: "A Sunday morning in 中央区",
    chuoText:
      "Early to 築地場外市場 before the tourists arrive. The fishmonger knows your order. Walk back through the 日本橋リバーウォーク — the sky above the old stone bridge is different from last year, the expressway a little less present. Afternoon in a new specialty coffee shop that opened in a renovated warehouse three blocks from where the Waldorf Astoria is being built.",
  },
  chuo: {
    tag: "Three things at once — that's what's new",
    p1: "The phrase “中央区 is the next big thing” has been heard in Tokyo property conversations for most of the past decade. It has been said about 勝どき, about 晴海, about 築地, about 日本橋 — often by people with something to sell. The reason to pay attention now is not because the story has changed. It is because three separate versions of that story are happening simultaneously, for the first time.",
    convergenceLabel: "The convergence — what's different about 2026",
    convergenceItems: [
      {
        year: "2026–32",
        name: "築地 ¥9,000億円",
        desc: "三井不動産 consortium. 126万m² total floor area — larger than 麻布台ヒルズ and 高輪ゲートウェイシティ combined. 5万人 stadium. New subway station.",
      },
      {
        year: "2027",
        name: "東京ミッドタウン日本橋",
        desc: "284m tower, 三井×野村. Waldorf Astoria opens 2026. 5 redevelopment zones in one connected riverside district.",
      },
      {
        year: "~2040",
        name: "首都高 地下化",
        desc: "The expressway above 日本橋 bridge goes underground. That bridge — one of Tokyo's most historically significant — will see open sky for the first time in most residents' lifetimes.",
      },
    ],
    convergenceNote:
      "None of these alone would be the argument. Happening at the same time, they are redefining what 中央区 means in a way that has not happened in decades.",
    p2: "日本橋 specifically is where the lifestyle shift is most visible right now. The neighborhood has always had the bones — it is where Edo-era merchants built their city, where the original 日本橋 stone bridge marked kilometer zero for all roads in Japan. For decades, the elevated expressway above that bridge turned the area into a utilitarian office district that closed at 6pm. What is happening now is not redevelopment so much as excavation: removing what was added in the postwar era to reveal what was always there, and layering something new on top of it.",
    p3: "The new specialty coffee shops, the independent galleries, the preservation of the 日本橋野村ビル旧館 facade inside the new tower — these are not coincidences. They are what happens when a neighborhood's original character reasserts itself against five decades of suppression.",
    pullStatNum: "+112.7%",
    pullStatInsight:
      "中央区 condo price growth over 9 years — actually higher than 港区 in percentage terms, at a current average ¥189万/㎡ vs 港区's ¥209万/㎡. The gap is narrowing, and it was wider five years ago.",
    pullStatNote: "Source: マンションナビ / t23m-navi.jp [2]",
    insightTitle: "Three risks to price in honestly",
    insightItems: [
      {
        label: "定期借地権",
        text: "The 築地 redevelopment land belongs to the Tokyo Metropolitan Government. 三井不動産 holds a 70-year fixed-term leasehold — not freehold. Surrounding 中央区 properties are freehold, but buyers attracted by the 築地 story need to understand the land rights of their specific asset.",
      },
      {
        label: "Bay area oversupply",
        text: "晴海フラッグ delivered 5,632 units at once. That is a real supply overhang in the waterfront submarket.",
      },
      {
        label: "Infrastructure timeline",
        text: "The expressway 地下化 completes around 2040. The 臨海地下鉄 is planned, not approved. Both are directionally right; neither has a firm date.",
      },
    ],
  },
  section4: {
    heading: "Buying the ward is the wrong unit of analysis",
    p1: "This applies equally to both wards — and it is the mistake most overseas buyers make.",
    p2: "In 港区, 芝浦 and 港南 trade at 30–40% below 麻布 and 虎之門 on a per-sqm basis, with meaningfully higher rental yields and strong tenant demand from the Shinagawa working population. The 品川 station area will change significantly with リニア中央新幹線 access (planned 2027). An investor who buys 麻布 for the brand and an investor who buys 芝浦 for the yield are making fundamentally different decisions inside the same ward name.",
    p3: "In 中央区, 日本橋 and 月島 are separated by a 15-minute walk and a century of urban character. The 築地 redevelopment affects the neighborhood directly around the site — it does not automatically lift 晴海 tower condo values, which face their own supply dynamics. Buying “中央区” is not a thesis. Buying the specific block within 200 metres of the 日本橋リバーウォーク is a thesis.",
  },
  section5: {
    heading: "One risk both markets share",
    p1: "The Bank of Japan has been normalizing rates since ending its negative interest rate policy in March 2024. Variable rates currently sit at 0.5–1.0%; fixed rates at 1.5–2.0%. The entire pricing structure of central Tokyo property over the past decade was built on rates near zero. If BOJ continues tightening toward 2–3%, the math for leveraged buyers changes significantly in both wards.",
    p2: "For cash buyers — which describes most serious HK and TW investors in these markets — the impact is indirect: it affects the buyer pool for your eventual exit. A market where domestic leveraged buyers are constrained is a thinner market, which can affect liquidity even when you do not need debt yourself.",
  },
  scorecard: {
    heading: "Side by side",
    subtitle: "Three scenarios a ¥100M buyer should compare — not just two cities.",
    minatoColLabel: "港区 Minato",
    chuoColLabel: "中央区 Chuo (日本橋 focus)",
    rows: [
      {
        factor: "Current avg ¥/㎡",
        minato: { text: "¥209万 — near peak", tone: "mid" },
        chuo: { text: "¥189万 — closing gap", tone: "good" },
      },
      {
        factor: "9-year price growth",
        minato: { text: "+106.4%", tone: "good" },
        chuo: { text: "+112.7% (higher)", tone: "good" },
      },
      {
        factor: "Surface rental yield",
        minato: { text: "~3.2%", tone: "risk" },
        chuo: { text: "4–5.5%", tone: "mid" },
      },
      {
        factor: "Net yield (est.)",
        minato: { text: "1–2% — near zero", tone: "risk" },
        chuo: { text: "3–4%", tone: "mid" },
      },
      {
        factor: "Development pipeline",
        minato: { text: "高輪ゲートウェイ open, リニア 2027", tone: "mid" },
        chuo: { text: "3 major catalysts simultaneously", tone: "good" },
      },
      {
        factor: "International brand recognition",
        minato: { text: "Highest — 麻布、虎ノ門 need no intro", tone: "good" },
        chuo: { text: "Growing — 日本橋 less known overseas", tone: "mid" },
      },
      {
        factor: "Exit liquidity",
        minato: { text: "Deep — global buyer pool", tone: "good" },
        chuo: { text: "Solid but narrower buyer profile", tone: "mid" },
      },
      {
        factor: "Key risk",
        minato: { text: "Story fully priced, yield structurally low", tone: "risk" },
        chuo: { text: "定期借地権, bay oversupply, timeline uncertainty", tone: "risk" },
      },
    ],
  },
  ourRead: {
    heading: "Our read",
    label: "AiSumai · July 2026",
    minatoWard: "港区",
    minatoText:
      "You are buying the most legible prestige address in Tokyo, with the deepest international buyer pool for your eventual exit. The trade-off is that you are paying for a story everyone already knows, with yields that make cash flow essentially irrelevant. This is a wealth preservation and brand play — excellent at what it is, if that is what you want.",
    chuoWard: "中央区",
    chuoText:
      "You are buying a convergence — three simultaneous transformations that have not happened at the same time before. 日本橋 specifically is a neighborhood recovering its own identity rather than performing one for a global audience. That tends to produce real, durable value. The risks are real and should be read carefully, particularly 定期借地権 and supply dynamics in the bay area. Choose the specific location, not the ward.",
  },
  cta: {
    heading: "Compare specific properties",
    body: "Paste two SUUMO listing links — one in each ward. AI gives you a full side-by-side in 60 seconds.",
    button: "Start comparing",
  },
  footerNote: "AiSumai 愛住 · Not financial advice · 投資助言ではありません",
};

export const ZH_CONTENT: GuideMinatoChuoContent = {
  eyebrow: "東京 · 投資分析 · 2026年7月",
  titleLine1: "港區 vs 中央區：",
  titleEmphasis: "同一座城市，兩種完全不同的生活",
  deck: "兩個行政區吸引的是同一群買家——來自香港與台灣、認真考慮東京市場的現金買家。房價差距比你想像中小，真正天差地遠的，是住在那裡的日常生活——而這個差異，比租金報酬率的差距更重要。",
  metaLine: "AiSumai 編輯部 · 2026年7月 · 研究資料至2026年第二季",
  section1: {
    heading: "同一座城市，不同的生活",
    p1: "週二早上在麻布台之丘走十分鐘，再搭地鐵到日本橋，走一個小時的街。你會在說出原因之前，先感受到那種差異。一邊是為你精心設計的城區——國際化、精緻、隨時可以入住。另一邊，是一座已經按照自己的步調生活了四百年的城市，如今正悄悄地，再次蛻變成新的樣貌。",
    p2: "港區跟中央區吸引的是同一類海外買家：來自香港或台灣，手握現金，認真看待東京市場。兩區之間的房價差距，比多數人想像得小。真正不小的，是你到了那裡之後，日常生活實際上會是什麼樣子。",
    thesisLabel: "這篇文章的核心論點",
    thesisText:
      "「港區是一種為你量身打造的生活——國際化、精緻、隨時就緒。中央區則是一種獎勵你用心觀察的生活。沒有哪個比較好，只是適合不同的人。」",
  },
  minato: {
    tag: "全球級聲望，價格已充分反映",
    p1: "就在本週7月10日，麻布台之丘旁開了一間新的全家便利商店。這句話值得細看：創意總監是NIGO——A BATHING APE、HUMAN MADE的設計師，現任KENZO創意總監；建築設計是Wonderwall的片山正通，操刀過Uniqlo全球旗艦店；咖啡由粕谷哲主理，他是首位拿下World Brewers Cup世界冠軍的亞洲人；店員能說多達五種語言；屋頂還有一片森林。它看起來完全不像一間便利商店。",
    p2: "這不是一則關於商店的故事，而是一個訊號——說明這個街區期待住在這裡的人是什麼樣子，以及他們認為「日常」該是什麼水準。在港區，日常生活的基本體驗本身就是被精心策劃過的：你去買菜的路上，會經過Thomas Heatherwick設計的公園；你住的大樓，可能是全日本最高的建築；大樓底層的酒店是安縵。這個區有80個大使館、22,614名外國居民——是東京23區裡外國居民密度最高的區。",
    pullStatNum: "+106.4%",
    pullStatInsight:
      "港區公寓價格9年來的漲幅，東京23區之冠。這個故事，如今香港、台北、新加坡每一位認真的買家都已經完全了解。",
    pullStatNote: "資料來源：マンションリサーチ／マンションナビ，2025年4月 [1]",
    p3: "這正是關鍵所在。過去十年，港區在東京不動產市場裡，交出了最一致、最容易理解的高端敘事。麻布、虎之門、赤坂——在做這類決策的場合裡，這些名字完全不需要翻譯。退場時，你面對的是一群認同同一套參照系的買家。那是一種真實而有價值的流動性。",
    insightTitle: "誠實面對報酬率問題",
    insightBody:
      "一戶港區1.5億日圓的物件，若租金收入為每月40萬日圓，表面報酬率是3.2%。扣掉管理費、修繕公積金，以及對大樓型物件特別高的固定資產稅之後，淨報酬率只剩1%到2%。用貸款操作的買家，在目前的利率水準下，現金流甚至接近零或轉為負值。港區是保值與品牌的選擇，不是收租型的投資。任何把它當作收租型投資推銷給你的人，都沒有對你說實話。",
  },
  lifestyleSplit: {
    minatoLabel: "港區的平日早晨",
    minatoText:
      "在麻布台之丘、由粕谷哲主理、NIGO操刀設計的FAMIMA PARK喝咖啡。走過Heatherwick設計的花園，前往虎之門之丘開會。午餐訂位在一間半年前才開幕的大樓裡的餐廳。坐在你旁邊的人，可能是外交官、基金經理人，或是一個你猜不出身份的人。",
    chuoLabel: "中央區的週日早晨",
    chuoText:
      "趁遊客抵達之前，早早到築地場外市場——魚販記得你平常買什麼。沿著日本橋河濱步道走回家，古老石橋上方的天空跟去年不一樣了，高架道路的存在感也淡了一些。下午到三個街區外一間由老倉庫改建的新精品咖啡店坐坐，那裡正在興建華爾道夫酒店。",
  },
  chuo: {
    tag: "三件事同時發生——這就是2026年的不同之處",
    p1: "「中央區是下一個熱點」這句話，過去十年來在東京不動產圈幾乎沒停過——用在勝鬨身上說過，用在晴海身上說過，用在築地身上說過，也用在日本橋身上說過，而且往往是想賣你東西的人在說。現在真正值得關注的原因，不是這個故事變了，而是這個故事的三個不同版本，第一次同時在發生。",
    convergenceLabel: "匯聚點——2026年有何不同",
    convergenceItems: [
      {
        year: "2026–32",
        name: "築地　9,000億日圓",
        desc: "三井不動產主導的財團開發，總樓地板面積126萬平方公尺——比麻布台之丘加上高輪Gateway City還大，設有5萬人座位的體育場與新地鐵站。",
      },
      {
        year: "2027",
        name: "東京中城日本橋",
        desc: "284公尺高塔，三井×野村聯手開發。華爾道夫酒店2026年開幕，同一個濱河街區裡有5個都更基地。",
      },
      {
        year: "約2040",
        name: "首都高速地下化",
        desc: "日本橋橋上方的高架道路將轉入地下。這座東京最具歷史意義的地標之一，多數居民有生以來，將首次看見橋上方真正的天空。",
      },
    ],
    convergenceNote:
      "任何一項單獨拿出來，都不足以構成論點。但三件事同時發生，正在以近幾十年來未曾有過的方式，重新定義「中央區」這個詞的意義。",
    p2: "日本橋是目前生活型態轉變最明顯的地方。這裡的底蘊一直都在——這裡是江戶時代商人建城的起點，原始的日本橋石橋標誌著日本所有道路的起點。過去數十年，橋上方的高架道路把這一帶變成一個晚上6點就打烊的實用型辦公商圈。現在發生的，與其說是「重新開發」，不如說是一種「考古」：把戰後加上去的東西移除，讓原本就存在的東西重新顯露出來，再疊上新的一層。",
    p3: "新開的精品咖啡店、獨立藝廊，以及新大樓裡保留下來的日本橋野村大樓舊館立面——這些都不是巧合。這些，正是一個街區的原始個性，在被壓抑了五十年之後重新抬頭時，會出現的樣子。",
    pullStatNum: "+112.7%",
    pullStatInsight:
      "中央區公寓價格9年來的漲幅，以百分比計算其實已經超過港區——目前均價每平方公尺189萬日圓，港區則為209萬日圓。差距正在縮小，而且五年前的差距比現在更大。",
    pullStatNote: "資料來源：マンションナビ／t23m-navi.jp [2]",
    insightTitle: "三個要誠實面對的風險",
    insightItems: [
      {
        label: "定期借地權",
        text: "築地都更用地屬於東京都政府所有，三井不動產持有的是70年期的定期借地權，不是所有權。中央區其他物件多為所有權（永久產權），但被築地話題吸引的買家，需要搞清楚自己買的那戶物件，土地權利到底是什麼。",
      },
      {
        label: "灣岸供給過剩",
        text: "晴海Flag一次交付了5,632戶，這對濱海次市場來說是真實存在的供給壓力。",
      },
      {
        label: "基礎建設時程",
        text: "高架道路地下化預計2040年前後完成，臨海地下鐵仍在規劃階段、尚未正式核准。兩者方向都對，但都沒有確定日期。",
      },
    ],
  },
  section4: {
    heading: "以行政區為單位來判斷，是錯的分析單位",
    p1: "這一點對兩個區都適用——而這正是多數海外買家最常犯的錯誤。",
    p2: "在港區，芝浦跟港南的每平方公尺單價，比麻布、虎之門低30%到40%，租金報酬率明顯更高，而且來自品川上班族群的租屋需求穩定。品川車站周邊，會隨著磁浮中央新幹線通車（預計2027年）出現明顯變化。一個因為品牌買麻布的投資人，跟一個為了報酬率買芝浦的投資人，即使買在同一個行政區裡，做的其實是完全不同的決策。",
    p3: "在中央區，日本橋跟月島之間，只隔著15分鐘的步行距離，卻隔著一個世紀的城市性格。築地都更直接影響的是基地周邊的街區，不會自動拉抬晴海那些大樓型公寓的價值——晴海有它自己的供給問題要面對。「買中央區」本身不是一個投資論點，「買日本橋河濱步道200公尺範圍內的特定街廓」才是一個投資論點。",
  },
  section5: {
    heading: "兩個市場共同的風險",
    p1: "日本銀行自2024年3月結束負利率政策以來，一直在讓利率正常化。目前浮動利率落在0.5%到1.0%，固定利率則在1.5%到2.0%之間。過去十年，東京市中心不動產的整套定價邏輯，都是建立在接近零利率的基礎上。如果日銀持續朝2%到3%的方向升息，兩個行政區裡用貸款操作的買家，資金成本結構都會出現明顯變化。",
    p2: "對現金買家而言——這也是多數認真進場的香港、台灣投資人的實際狀況——影響是間接的：它會影響你未來出場時面對的買家池。如果本地槓桿買家因為利率而縮手，市場會變薄，即使你自己不需要貸款，流動性也可能因此受到影響。",
  },
  scorecard: {
    heading: "兩區並列比較",
    subtitle: "一位手握1.5億日圓的買家，應該比較的是三種情境——不只是兩個行政區。",
    minatoColLabel: "港區 Minato",
    chuoColLabel: "中央區 Chuo（以日本橋為主）",
    rows: [
      {
        factor: "目前每平方公尺均價",
        minato: { text: "209萬日圓——接近高點", tone: "mid" },
        chuo: { text: "189萬日圓——差距正在縮小", tone: "good" },
      },
      {
        factor: "9年房價漲幅",
        minato: { text: "+106.4%", tone: "good" },
        chuo: { text: "+112.7%（更高）", tone: "good" },
      },
      {
        factor: "表面租金報酬率",
        minato: { text: "約3.2%", tone: "risk" },
        chuo: { text: "4–5.5%", tone: "mid" },
      },
      {
        factor: "淨報酬率（估）",
        minato: { text: "1–2%——接近零", tone: "risk" },
        chuo: { text: "3–4%", tone: "mid" },
      },
      {
        factor: "開發案時程",
        minato: { text: "高輪Gateway City已開幕，磁浮新幹線2027年", tone: "mid" },
        chuo: { text: "三大催化劑同時發生", tone: "good" },
      },
      {
        factor: "國際品牌知名度",
        minato: { text: "最高——麻布、虎之門完全不需要介紹", tone: "good" },
        chuo: { text: "正在成長——日本橋在海外知名度較低", tone: "mid" },
      },
      {
        factor: "退場流動性",
        minato: { text: "深——全球買家池", tone: "good" },
        chuo: { text: "穩健，但買家群較窄", tone: "mid" },
      },
      {
        factor: "主要風險",
        minato: { text: "故事已完全反映在價格裡，報酬率結構性偏低", tone: "risk" },
        chuo: { text: "定期借地權、灣岸供給過剩、時程不確定", tone: "risk" },
      },
    ],
  },
  ourRead: {
    heading: "我們的看法",
    label: "AiSumai · 2026年7月",
    minatoWard: "港區",
    minatoText:
      "你買的是東京最容易被理解的高端地址，退場時面對的是全球最深的買家池。代價是，你為一個所有人都已經知道的故事付費，報酬率低到現金流幾乎不重要。這是一種保值與品牌型的選擇——如果這正是你要的，它在這個定位上表現得很好。",
    chuoWard: "中央區",
    chuoText:
      "你買的是一個匯聚點——三件從未同時發生過的轉變，第一次疊在一起。日本橋尤其特別，它是一個正在找回自己身份的街區，而不是在表演一個給全球觀眾看的形象。這種特質，往往能帶來真實、持久的價值。風險是真實存在的，需要仔細評估，尤其是定期借地權跟灣岸的供給狀況。選具體的地段，不要只選行政區。",
  },
  cta: {
    heading: "比較具體物件",
    body: "貼上兩個 SUUMO 物件連結——一個港區、一個中央區。AI 在 60 秒內給你完整的並排分析。",
    button: "開始比較",
  },
  footerNote: "AiSumai 愛住 · 非投資建議 · Not financial advice",
};
