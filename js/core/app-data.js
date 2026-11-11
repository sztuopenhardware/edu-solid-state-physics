/**
 * 《固体物理学》(EP00223) 课程教学大纲全覆盖知识库与章节案例目录
 * 教材参考：Charles Kittel《固体物理导论》(第8版) & 黄昆《固体物理学》
 */
window.SSP_DATA = {
  courseInfo: {
    code: "EP00223",
    name: "固体物理学 (Solid State Physics)",
    unit: "工程物理学院 · 应用物理专业",
    credits: "3 学分（54 学时：课堂讲授 36 + 课内实践 18）",
    textbook: "Kittel《固体物理导论》（第八版） / 黄昆《固体物理学》"
  },

  chapters: [
    {
      id: "ch1",
      num: "第1章",
      shortTitle: "晶体的结构",
      fullTitle: "第 1 章 晶体的结构 (Crystal Structure)",
      weeks: "第 1–3 周 (9 学时)",
      cases: [
        {
          id: "1-1",
          code: "1.1",
          title: "原子的周期性排列：晶体/非晶体与点阵+基元",
          subtitle: "长程有序 vs 短程有序、原胞与传统晶胞 3D 对比",
          caption: "对比单晶、多晶与非晶态的原子排布与径向分布函数 g(r)，动态演示“晶体结构 = 布拉菲点阵 + 基元”及原胞与晶胞体积关系。",
          theory: `
            <p>理想的完整晶体由全同结构单元在三维空间做无限周期性重复排列构成。固体物理学将晶体结构严格抽象为<strong>空间点阵（Lattice）</strong>与<strong>基元（Basis）</strong>的结合：</p>
            <div class="formula-card">$$\\text{晶体结构 (Crystal Structure)} = \\text{布拉菲点阵 (Bravais Lattice)} + \\text{基元 (Basis)}$$</div>
            <p>任意格点位置由正格矢给出：$\\mathbf{R}_n = n_1 \\mathbf{a}_1 + n_2 \\mathbf{a}_2 + n_3 \\mathbf{a}_3$（$n_i \\in \\mathbb{Z}$）。体积最小且只包含<strong>1个格点</strong>的平行六面体称为<strong>原胞（Primitive Cell）</strong>，体积 $V_p = |\\mathbf{a}_1 \\cdot (\\mathbf{a}_2 \\times \\mathbf{a}_3)|$；而为了充分反映晶格对称性选取的较大周期单元称为<strong>惯用晶胞（Conventional Cell）</strong>。</p>
          `,
          objectives: [
            "区分单晶（长程有序）、多晶（晶粒内有序、晶界取向无序）与非晶体（仅短程有序）的微观图像及 g(r) 特征。",
            "建立格点、基元、布拉菲点阵的核心物理图像，理解复杂晶体如何由简单点阵附加多原子基元构成。",
            "掌握固体物理学原胞（含维格纳-赛兹原胞）与结晶学晶胞的区别及格点数换算。"
          ],
          frontier: "【科研与思政融入】我国在人工功能晶体生长领域稳居世界前列——从陈创天院士团队研制的深紫外非线性光学晶体 KBBF、BBO，到大尺寸高质量单晶硅与碳化硅衬底生长，对原子级周期性与缺陷的极致调控正是支撑激光技术与集成电路基石的关键。"
        },
        {
          id: "1-2",
          code: "1.2",
          title: "晶格的基本类型：7大晶系14种布拉菲晶格",
          subtitle: "SC / BCC / FCC 配位数、晶胞格点数与致密度剖析",
          caption: "全三维交互浏览 7 大晶系 14 种布拉菲点阵，支持刚球相切密堆积切换、八分之一晶胞切割计数及最近邻配位多面体高亮。",
          theory: `
            <p>三维周期点阵按点群对称性划分为 <strong>7 大晶系、14 种布拉菲点阵</strong>。其中立方晶系包含三种核心结构：</p>
            <div class="formula-card">$$\\begin{aligned}
              \\text{简单立方 (SC)}: &\\quad N=1,\\; Z=6,\\; \\eta = \\frac{\\pi}{6} \\approx 52.4\\% \\\\
              \\text{体心立方 (BCC)}: &\\quad N=2,\\; Z=8,\\; \\eta = \\frac{\\sqrt{3}\\pi}{8} \\approx 68.0\\% \\\\
              \\text{面心立方 (FCC)}: &\\quad N=4,\\; Z=12,\\; \\eta = \\frac{\\sqrt{2}\\pi}{6} \\approx 74.0\\%
            \\end{aligned}$$</div>
            <p>晶胞内有效格点数按共享权重计算：$N = N_{\\text{内部}} + \\frac{1}{2}N_{\\text{面心}} + \\frac{1}{4}N_{\\text{棱心}} + \\frac{1}{8}N_{\\text{顶角}}$。</p>
          `,
          objectives: [
            "认识 7 大晶系晶胞参数 (a, b, c, α, β, γ) 的约束特征与 14 种三维布拉菲晶格。",
            "熟练推导并直观观察简单立方 (SC)、体心立方 (BCC)、面心立方 (FCC) 的晶胞格点数、配位数与刚球致密度。",
            "理解对称性破缺如何使立方晶格连续演变为四方、正交、单斜与三斜晶格。"
          ],
          frontier: "【工程物性关联】铁 (Fe) 在 912°C 发生从 α-Fe (BCC，致密度 68%) 到 γ-Fe (FCC，致密度 74%) 的同素异构相变，体积收缩与间隙尺寸变化直接决定了钢铁热处理与渗碳淬火的微观机理。"
        },
        {
          id: "1-3",
          code: "1.3",
          title: "晶向指数 [uvw] 与晶面米勒指数 (hkl)",
          subtitle: "平行晶面族三维切片、负指数表示与晶面间距公式",
          caption: "实时调整 (hkl) 与 [uvw] 指数，在三维晶胞内渲染平行晶面族切片与晶向矢量，验证立方晶系正交关系与面间距规律。",
          theory: `
            <p><strong>米勒指数 $(hkl)$</strong> 确定步骤：求晶面在基矢轴 $\\mathbf{a}_1, \\mathbf{a}_2, \\mathbf{a}_3$ 上的截距（以晶格常数为单位）$\\to$ 取倒数 $\\to$ 化为互质整数。负指数记于数字上方，如 $(\\bar{1}10)$。</p>
            <div class="formula-card">$$d_{hkl} = \\frac{a}{\\sqrt{h^2 + k^2 + l^2}} \\quad (\\text{立方晶系相邻平行晶面间距})$$</div>
            <p>低指数晶面（如 $(111), (110), (100)$）具有<strong>更大的晶面间距 $d_{hkl}$</strong> 和<strong>更高的面原子密度</strong>，在晶体生长露面、解理断裂及滑移塑性变形中起主导作用。</p>
          `,
          objectives: [
            "熟练掌握晶向指数 [uvw]、晶向族 <uvw> 与晶面米勒指数 (hkl)、晶面族 {hkl} 的几何标定方法。",
            "理解平行等距晶面族切分晶胞的规律，掌握立方晶系晶面间距公式。",
            "直观验证立方晶系中晶向 [hkl] 与同名晶面 (hkl) 相互垂直的几何性质。"
          ],
          frontier: "【晶圆制造工艺】现代 CMOS 芯片普遍选用 (100) 晶面单晶硅晶圆并标注 [110] 定位边，正是因为 (100) 面悬挂键态密度低、界面氧化质量最优，而沿 {111}/{110} 面易于精确解理与各向异性湿法刻蚀。"
        },
        {
          id: "1-4",
          code: "1.4",
          title: "简单的典型晶体结构 (NaCl / CsCl / 金刚石 / ZnS / HCP)",
          subtitle: "复式晶格拆解、正四面体/八面体配位与 ABAB/ABC 密堆垛",
          caption: "三维剖析氯化钠、氯化铯、金刚石、立方闪锌矿与六角密排 (HCP) 结构，动态演示密排层 ABAB 与 ABCABC 堆垛序列差异。",
          theory: `
            <p>真实化合物与单质晶体多为<strong>复式晶格（含多原子基元）</strong>：</p>
            <div class="formula-card">$$\\begin{aligned}
              \\text{NaCl 结构}: &\\; \\text{FCC 点阵} + \\{\\text{Na}^+(0,0,0),\\; \\text{Cl}^-(\\tfrac{1}{2},\\tfrac{1}{2},\\tfrac{1}{2})\\}, \\; Z=6 \\\\
              \\text{金刚石 / ZnS}: &\\; \\text{FCC 点阵} + \\{(0,0,0),\\; (\\tfrac{1}{4},\\tfrac{1}{4},\\tfrac{1}{4})\\}, \\; Z=4,\\; \\eta_{\\text{Dia}} \\approx 34\\% \\\\
              \\text{HCP 六角密排}: &\\; ABAB\\cdots \\text{堆垛},\\; \\frac{c}{a} = \\sqrt{\\frac{8}{3}} \\approx 1.633,\\; Z=12,\\; \\eta = 74.0\\%
            \\end{aligned}$$</div>
          `,
          objectives: [
            "掌握 NaCl、CsCl、金刚石、闪锌矿 (ZnS) 的布拉菲晶格类型、基元坐标与配位多面体特征。",
            "理解金刚石结构由两套沿体对角线位移 1/4 的 FCC 子晶格套构而成，具有四面体方向性松散堆积特征。",
            "对比六角密排 (HCP: ABAB…) 与面心立方 (FCC: ABCABC…) 两种等径球最密堆积 (74%) 的层序差异。"
          ],
          frontier: "【半导体材料基石】第一代半导体 Si/Ge 采用金刚石结构，第二/三代化合物半导体 GaAs、InP、SiC(3C)、GaN 则以闪锌矿或纤锌矿四面体结构为基础，微观晶体对称性直接决定了直接带隙发光与高频耐压特性。"
        },
        {
          id: "1-5",
          code: "1.5",
          title: "原子结构的直接成像：扫描隧道显微镜 (STM)",
          subtitle: "量子隧穿电流指数敏感性、恒流/恒高扫描与表面实空间成像",
          caption: "仿真原子级锋利探针在晶体表面（石墨烯、Si(111)、单原子台阶）上方逐行扫描，实时生成量子隧穿电流与纳米表面形貌图。",
          theory: `
            <p><strong>扫描隧道显微镜（STM）</strong>利用金属针尖与导电样品表面相距约 $0.3\\text{–}1\\text{ nm}$ 时的<strong>量子力学势垒隧穿效应</strong>直接在实空间分辨单个原子：</p>
            <div class="formula-card">$$I_{\\text{tunnel}} \\propto V_{\\text{bias}} \\rho_s(E_F) \\exp(-2\\kappa z), \\quad \\kappa = \\frac{\\sqrt{2m\\phi}}{\\hbar}$$</div>
            <p>由于衰减常数 $\\kappa \\approx 10\\text{ nm}^{-1}$，针尖高度 $z$ 每变化 $0.1\\text{ nm}$（约一个原子层厚度），隧穿电流便发生<strong>一个数量级</strong>的剧烈改变，从而赋予 STM 高达 $0.01\\text{ Å}$ 的纵向分辨率！</p>
          `,
          objectives: [
            "理解量子隧穿电流随针尖-样品间距指数衰减的物理机制及其超高纵向分辨率起源。",
            "对比恒高模式（扫描快，适合平坦表面）与恒流模式（压电反馈调高，适合含台阶起伏表面）的工作原理。",
            "认识实空间直接成像技术（STM、AFM、球差校正透射电镜 STEM）与倒空间衍射技术的互补关系。"
          ],
          frontier: "【大国重器与精密表征】我国自主研制的极低温强磁场扫描隧道显微镜及高分辨球差校正电镜表征平台，已实现高温超导体磁通涡旋马约拉纳零能模及二维材料界面单原子的精准探测与操纵。"
        }
      ],
      quizzes: [
        {
          q: "1. 面心立方（FCC）惯用晶胞中包含的格点数、最近邻配位数及刚球致密度分别为：",
          options: [
            "A. 2 个格点，配位数 8，致密度 68.0%",
            "B. 4 个格点，配位数 12，致密度 74.0%",
            "C. 4 个格点，配位数 6，致密度 52.4%",
            "D. 8 个格点，配位数 4，致密度 34.0%"
          ],
          answer: 1,
          explain: "FCC 晶胞包含 8×(1/8) 顶角 + 6×(1/2) 面心 = 4 个格点；面对角线方向 4r = √2 a，最近邻配位数为 12，空间填充率 π√2/6 ≈ 74.0%。"
        },
        {
          q: "2. 金刚石晶体结构的布拉菲点阵类型与原胞内的碳原子数分别是：",
          options: [
            "A. 体心立方点阵，基元含 2 个原子",
            "B. 简单立方点阵，基元含 8 个原子",
            "C. 面心立方（FCC）点阵，基元含 2 个原子",
            "D. 六角点阵，基元含 4 个原子"
          ],
          answer: 2,
          explain: "金刚石并非单一布拉菲点阵，而是由 FCC 布拉菲点阵加上位于 (0,0,0) 与 (1/4,1/4,1/4) 的双原子基元构成，因此原胞含 2 个原子，晶胞含 8 个原子。"
        }
      ]
    },

    {
      id: "ch2",
      num: "第2章",
      shortTitle: "晶体衍射与倒格子",
      fullTitle: "第 2 章 晶体的衍射和倒格子 (Crystal Diffraction & Reciprocal Lattice)",
      weeks: "第 4–5 周 (6 学时)",
      cases: [
        {
          id: "2-1",
          code: "2.1",
          title: "晶体衍射与布拉格定律 (2d sinθ = nλ)",
          subtitle: "多层原子面相干散射光程差、相位叠加与 XRD 衍射峰",
          caption: "交互调节掠射角 θ、波长 λ 与面间距 d，三维实时观察光程差几何三角形、双束散射波相位干涉叠加及 2θ 衍射谱图。",
          theory: `
            <p>当波长与原子间距同量级（$\\lambda \\sim 1\\text{ Å}$）的 X 射线、电子束或热中子入射到晶体时，相邻平行晶面散射波的光程差为 $\\Delta = 2d_{hkl}\\sin\\theta$。相长干涉条件给出<strong>布拉格定律（Bragg's Law）</strong>：</p>
            <div class="formula-card">$$2 d_{hkl} \\sin\\theta = n\\lambda \\quad (n = 1, 2, 3, \\dots)$$</div>
            <p>注意晶体衍射中的 $\\theta$ 定义为入射束与晶面的<strong>掠射角（布拉格角）</strong>，实验探测器测量的偏转角（衍射角）为 $2\\theta$。只有当 $\\lambda \\le 2d_{\\max}$ 时才可能产生晶体衍射。</p>
          `,
          objectives: [
            "掌握布拉格定律的光程差几何推导，理解掠射角 θ 与衍射角 2θ 的物理定义。",
            "理解为何可见光无法产生晶体衍射而 X 射线、中子束和高能电子束可以表征原子晶格。",
            "建立晶面间距 d_hkl 与 XRD 峰位 2θ 的定量反演关系。"
          ],
          frontier: "【大科学装置应用】位于东莞的“中国散裂中子源（CSNS）”与上海同步辐射光源（SSRF），利用高通量中子与同步辐射 X 射线衍射，无损探测航空发动机叶片内部残余应力及锂电池充放电原位晶体结构演化。"
        },
        {
          id: "2-2",
          code: "2.2",
          title: "倒易晶格、劳厄条件与厄瓦尔德球 (Ewald Sphere)",
          subtitle: "正倒空间对偶变换、Δk = G 动量守恒与三维厄瓦尔德球构造",
          caption: "三维可视化倒格矢 G 与实空间晶面的正交反比关系，转动入射波矢 k 观察厄瓦尔德球扫过三维倒格点阵并激发衍射束 k'。",
          theory: `
            <p>由正格矢 $(\\mathbf{a}_1, \\mathbf{a}_2, \\mathbf{a}_3)$ 定义<strong>倒易基矢</strong>：</p>
            <div class="formula-card">$$\\mathbf{b}_1 = 2\\pi \\frac{\\mathbf{a}_2 \\times \\mathbf{a}_3}{\\mathbf{a}_1 \\cdot (\\mathbf{a}_2 \\times \\mathbf{a}_3)}, \\quad \\mathbf{a}_i \\cdot \\mathbf{b}_j = 2\\pi \\delta_{ij}$$</div>
            <p>倒格矢 $\\mathbf{G}_{hkl} = h\\mathbf{b}_1 + k\\mathbf{b}_2 + l\\mathbf{b}_3$ 严格垂直于实空间 $(hkl)$ 晶面，且 $|\\mathbf{G}_{hkl}| = \\frac{2\\pi}{d_{hkl}}$。弹性相干衍射的<strong>矢量劳厄条件</strong>（厄瓦尔德球判据）为：</p>
            <div class="formula-card">$$\\Delta \\mathbf{k} = \\mathbf{k}' - \\mathbf{k} = \\mathbf{G} \\quad \\Longleftrightarrow \\quad 2\\mathbf{k}\\cdot\\mathbf{G} + G^2 = 0$$</div>
          `,
          objectives: [
            "掌握倒易基矢的定义与正交归一性质，记住 BCC 的倒格子是 FCC、FCC 的倒格子是 BCC。",
            "深刻理解倒格矢 G_hkl 连接“实空间晶面法向/面间距”与“倒空间衍射动量转移”的桥梁作用。",
            "运用三维厄瓦尔德球几何构造直观判断劳厄法（连续波长）与转晶法/粉末法的衍射激发条件。"
          ],
          frontier: "【表面科学利器】在分子束外延（MBE）生长半导体超晶格芯片时，反射式高能电子衍射（RHEED）正是利用巨大半径的厄瓦尔德球切过二维表面倒易杆，实时监控每一个原子层的生长平整度。"
        },
        {
          id: "2-3",
          code: "2.3",
          title: "布里渊区几何构造 (三维第一布里渊区)",
          subtitle: "倒格矢垂直平分面切割动画：截角八面体 (FCC) 与菱形十二面体 (BCC)",
          caption: "拖动中垂面切割滑块，观看倒格矢布拉格反射面如何围出 SC 立方体、BCC 菱形十二面体与 FCC 截角八面体第一布里渊区及高对称点。",
          theory: `
            <p><strong>第一布里渊区（First Brillouin Zone）</strong>定义为倒易空间中的<strong>维格纳-赛兹（Wigner-Seitz）原胞</strong>：从原点出发，向所有非零倒格矢 $\\mathbf{G}$ 作垂直平分面（布拉格面 $\\mathbf{k}\\cdot\\frac{\\mathbf{G}}{2} = \\left(\\frac{G}{2}\\right)^2$），围绕原点的最小闭合多面体即为第一布里渊区。</p>
            <div class="formula-card">$$\\begin{aligned}
              \\text{实空间 BCC} \\;\\xrightarrow{\\text{倒格子 FCC}}\\; &\\text{第一布里渊区为【菱形十二面体】(12个菱形面)} \\\\
              \\text{实空间 FCC} \\;\\xrightarrow{\\text{倒格子 BCC}}\\; &\\text{第一布里渊区为【截角八面体】(8个六边形 + 6个正方形)}
            \\end{aligned}$$</div>
          `,
          objectives: [
            "掌握利用倒格矢垂直平分面构造第一及高阶布里渊区的几何方法。",
            "理解布里渊区边界正是电子波/格波发生布拉格反射（2k·G = G²）的动量空间轨迹。",
            "认识 FCC 第一布里渊区（截角八面体）上的高对称点 Γ、X、L、W、K 及其能带路径意义。"
          ],
          frontier: "【角分辨光电子能谱 ARPES】我国自主研发的深紫外激光 ARPES 装置能够直接对材料第一布里渊区内的三维电子能带与费米面（如铁基超导与拓扑半金属外尔锥）进行超高分辨率动量空间成像。"
        },
        {
          id: "2-4",
          code: "2.4",
          title: "基元的傅里叶分析与结构因子消光规律",
          subtitle: "几何结构因子 S_hkl 相量干涉、系统消光点阵与粉末衍射指纹",
          caption: "在三维倒易空间对比 SC、BCC、FCC、金刚石与 NaCl 的衍射点强度与消光空心环，同步演示复平面散射相量叠加与 XRD 指纹谱。",
          theory: `
            <p>当惯用晶胞包含 $s$ 个基元原子（分数坐标 $(u_j, v_j, w_j)$，原子形状因子 $f_j$）时，衍射束振幅正比于<strong>结构因子 $S_{hkl}$</strong>，衍射强度 $I_{hkl} \\propto |S_{hkl}|^2$：</p>
            <div class="formula-card">$$S_{hkl} = \\sum_{j=1}^{s} f_j \\exp\\!\\left[-i 2\\pi (h u_j + k v_j + l w_j)\\right]$$</div>
            <p>基元内不同原子散射波的相消干涉会导致特定 $(hkl)$ 出现<strong>系统消光（$S_{hkl}=0$）</strong>：例如 BCC 在 $h+k+l$ 为奇数时消光；FCC 仅当 $h,k,l$ 全奇或全偶时才出现衍射峰！</p>
          `,
          objectives: [
            "理解晶体电子密度周期函数的傅里叶展开与衍射振幅的定量关系。",
            "熟练计算并物理阐释 BCC、FCC、金刚石（如 (200) 消光）与 NaCl 的几何结构因子及系统消光规则。",
            "学会根据 XRD 衍射峰位的消光特征逆向鉴定未知晶体的布拉菲晶格类型。"
          ],
          frontier: "【蛋白质晶体学与材料基因组】从 DNA 双螺旋的 X 射线衍射图解析到高通量同步辐射自动相鉴定，结构因子傅里叶反演始终是人类破译物质三维原子密码的核心数学物理工具。"
        }
      ],
      quizzes: [
        {
          q: "1. 实空间为面心立方（FCC）的晶体（如 Cu、Al、Si），其第一布里渊区的多面体形状是：",
          options: [
            "A. 立方体（6 个正方形面）",
            "B. 菱形十二面体（12 个菱形面）",
            "C. 截角八面体（6 个正方形面 + 8 个正六边形面）",
            "D. 正二十面体"
          ],
          answer: 2,
          explain: "实空间 FCC 的倒易点阵是体心立方（BCC），BCC 倒点阵的维格纳-赛兹原胞由 8 个最近邻 (±1,±1,±1) 六边形面与 6 个次近邻 (±2,0,0) 正方形面围成截角八面体。"
        },
        {
          q: "2. 对于体心立方（BCC）单质晶体，下列哪个晶面在 X 射线衍射中会发生系统消光（结构因子 S = 0）？",
          options: [
            "A. (110)",
            "B. (200)",
            "C. (111)",
            "D. (211)"
          ],
          answer: 2,
          explain: "BCC 惯用晶胞基元位于 (0,0,0) 与 (1/2,1/2,1/2)，S_hkl = f[1 + exp(-iπ(h+k+l))]。当 h+k+l = 1+1+1 = 3（奇数）时顶角与体心散射波反相抵消，发生系统消光。"
        }
      ]
    },

    {
      id: "ch3",
      num: "第3章",
      shortTitle: "晶体结合与弹性",
      fullTitle: "第 3 章 晶体结合与弹性常量 (Crystal Binding & Elastic Constants)",
      weeks: "第 6–8 周 (9 学时)",
      cases: [
        {
          id: "3-1",
          code: "3.1",
          title: "惰性气体晶体：范德瓦尔斯键与 Lennard-Jones 势",
          subtitle: "瞬时偶极涨落吸引、泡利排斥、内能曲线与平衡晶格常数",
          caption: "交互改变原子间距 r 与势阱参数，观察三维量子涨落诱导偶极子同步极化、作用力矢量反转及 6-12 势能曲线平衡态。",
          theory: `
            <p>满壳层惰性气体原子（Ne, Ar, Kr, Xe）依靠量子零点涨落产生的<strong>瞬时偶极-诱导偶极色散力（London 吸引力 $\\propto -r^{-6}$）</strong>结合，短程电子云交叠则因<strong>泡利不相容原理</strong>产生强烈排斥力（$\\propto +r^{-12}$），总势能由<strong>Lennard-Jones 势</strong>描述：</p>
            <div class="formula-card">$$U(r) = 4\\epsilon \\left[ \\left(\\frac{\\sigma}{r}\\right)^{12} - \\left(\\frac{\\sigma}{r}\\right)^6 \\right], \\quad r_0 = 2^{1/6}\\sigma \\approx 1.122\\sigma$$</div>
            <p>对全晶体格点求和并令 $\\frac{dU_{\\text{tot}}}{dR} = 0$，可得固态惰性气体平衡最近邻间距 $R_0 \\approx 1.09\\sigma$，结合能弱（$\\sim 0.01\\text{–}0.1\\text{ eV}/\\text{原子}$），熔点极低。</p>
          `,
          objectives: [
            "理解范德瓦尔斯色散吸引力（-r⁻⁶）与短程泡利排斥力（+r⁻¹²）的量子物理起源。",
            "掌握结合能、内能曲线 U(r)、平衡间距 r₀（dU/dr = 0）与体弹性模量（正比于二阶导 d²U/dr²）的图像联系。",
            "解释惰性气体晶体为何倾向于形成高致密度的面心立方（FCC）无方向性堆积。"
          ],
          frontier: "【二维范德瓦尔斯异质结】石墨烯、二硫化钼（MoS₂）、六方氮化硼（h-BN）层内是强共价键，层间则由弱范德瓦尔斯力结合，使科学家能够像搭乐高积木一样撕离并转角堆叠“魔角石墨烯”超导体系。"
        },
        {
          id: "3-2",
          code: "3.2",
          title: "离子晶体：库仑相互作用与马德隆常数 (Madelung)",
          subtitle: "三维正负离子壳层求和振荡 vs Evjen 中性晶胞快速收敛",
          caption: "逐层点亮三维 NaCl/CsCl 晶格壳层，直观对比条件收敛的球壳交替振荡与 Evjen 分数电荷中性立方体法快速收敛至 α = 1.7476。",
          theory: `
            <p>离子晶体由正负离子间的<strong>长程静电库仑引力</strong>与<strong>短程Born-Mayer指数排斥势</strong>共同决定稳定性，一对离子的平均内能为：</p>
            <div class="formula-card">$$u(R) = -\\frac{\\alpha e^2}{4\\pi\\varepsilon_0 R} + z \\lambda e^{-R/\\rho}, \\quad \\alpha = \\sum_{j \\neq 0} \\frac{\\pm 1}{p_{0j}}$$</div>
            <p>其中无量纲几何级数 $\\alpha$ 称为<strong>马德隆常数（Madelung Constant）</strong>：$\\alpha_{\\text{NaCl}} \\approx 1.74756$，$\\alpha_{\\text{CsCl}} \\approx 1.76267$，$\\alpha_{\\text{ZnS}} \\approx 1.6381$。直接按球壳求和会剧烈正负振荡，而采用<strong>Evjen 电中性立方壳层法</strong>仅首层即可达 $1.45$、三层即逼近真值！</p>
          `,
          objectives: [
            "理解离子晶体结合能的主导项是长程库仑马德隆能，掌握平衡间距与晶格能的求法。",
            "通过三维壳层可视化理解为何直接球壳求和收敛极慢，而 Evjen 电中性单元法迅速收敛。",
            "对比典型离子晶体的马德隆常数与高熔点、高硬度、光学离子极化特征。"
          ],
          frontier: "【固态电池快离子导体】新一代全固态锂电池电解质（如硫化物与石榴石型氧化物 LLZO）通过调控离子晶格亚点阵马德隆势能面平坦度，降低 Li⁺ 迁移势垒以实现超快室温离子电导。"
        },
        {
          id: "3-3",
          code: "3.3",
          title: "共价晶体与轨道杂化理论 (sp / sp² / sp³ 杂化)",
          subtitle: "原子轨道连续杂化变形动画、方向性共价键与金刚石/石墨烯结构",
          caption: "拖动杂化混合滑块观看 s 与 p 原子轨道连续演化为 sp(180°)、sp²(120°平面三角形)与 sp³(109.5°正四面体)三维电子云瓣及晶格网络。",
          theory: `
            <p>共价键具有强烈的<strong>饱和性与方向性</strong>。第 IV 族元素（C, Si, Ge）成键时，能量相近的 $ns$ 与 $np$ 轨道线性组合发生<strong>轨道杂化（Hybridization）</strong>，使电子云沿特定成键方向高度集中以最大化交叠积分：</p>
            <div class="formula-card">$$\\begin{aligned}
              sp\\text{ 杂化}: &\\; \\psi_{1,2} = \\tfrac{1}{\\sqrt{2}}(s \\pm p_x) \\longrightarrow 180^\\circ \\text{ 直线构型} \\\\
              sp^2\\text{ 杂化}: &\\; 3\\text{ 个平面 }120^\\circ\\;\\sigma\\text{ 键} + \\text{垂直 }p_z\\text{ 离域 }\\pi\\text{ 键（石墨烯）} \\\\
              sp^3\\text{ 杂化}: &\\; \\psi_i = \\tfrac{1}{2}(s \\pm p_x \\pm p_y \\pm p_z) \\longrightarrow 109.47^\\circ \\text{ 正四面体（金刚石/硅）}
            \\end{aligned}$$</div>
          `,
          objectives: [
            "深刻理解原子轨道杂化（sp、sp²、sp³）提升成键方向性与电子云交叠程度、降低体系总能量的物理本质。",
            "用 sp³ 正四面体杂化完美解释为何金刚石、硅、锗虽配位数仅为 4（致密度仅 34%）却异常坚硬稳定。",
            "对比碳同素异形体中 sp²（石墨/石墨烯，导电润滑）与 sp³（金刚石，超硬宽禁带绝缘）的天壤之别。"
          ],
          frontier: "【碳基纳米材料与超硬功能晶体】我国科学家合成出兼具非晶与 sp³ 杂化超硬特性的次晶金刚石及新型碳同素异形体，并在大尺寸单晶石墨烯晶圆制备上取得国际领先突破。"
        },
        {
          id: "3-4",
          code: "3.4",
          title: "金属键与氢键晶体：延展性滑移 vs 冰 Ih 笼状网络",
          subtitle: "离域电子海韧性滑移对比离子脆断、冰 Ih 四面体空旷氢键笼",
          caption: "切换演示金属“正离子实+自由电子海”剪切滑移无脆断机理，以及水分子方向性氢键构筑的六角冰 Ih 低密度开阔笼状晶格。",
          theory: `
            <p><strong>金属键</strong>：价电子脱离原子束缚形成共有化的<strong>自由电子气（电子海）</strong>，非定域、无方向性。晶面相对滑移时正离子实始终被电子海屏蔽粘合，赋予金属优异的<strong>延展性与导电导热性</strong>（对比离子晶体滑移半个周期即因同号离子相对而脆性劈裂）。</p>
            <p><strong>氢键晶体</strong>：氢原子共价连接强电负性原子（F, O, N）时近乎裸露质子，与邻近孤对电子形成具有方向性的氢键（$\\sim 0.2\\text{ eV}$），使<strong>六角冰 $I_h$</strong> 形成四配位开阔笼状网络，熔化时笼塌陷导致<strong>水比冰密度更大</strong>。</p>
          `,
          objectives: [
            "全面对比离子键、共价键、金属键、范德瓦尔斯键与氢键五种基本结合类型的起源、键能与宏观物性差异。",
            "从微观成键方向性解释金属塑性延展性与离子/共价晶体硬脆性的本质区别。",
            "理解氢键的方向性如何塑造冰的四面体空旷结构及生命大分子（DNA/蛋白质）构象。"
          ],
          frontier: "【先进高强韧合金与深海可燃冰】高熵合金通过多主元晶格畸变与金属键电子态协同打破传统金属强塑性倒置难题；而海底天然气水合物（可燃冰）正是甲烷分子嵌于水分子三维氢键笼中的战略清洁能源。"
        },
        {
          id: "3-5",
          code: "3.5–3.6",
          title: "原子/离子半径比规则与晶体弹性应变张量",
          subtitle: "鲍林配位多面体临界半径比 r+/r- 与立方晶体拉伸/剪切弹性常量",
          caption: "模式A验证阴阳离子半径比对配位数(3/4/6/8)的几何相切约束；模式B对三维晶块施加拉伸与剪切应变，可视化弹性模量 C₁₁, C₁₂, C₄₄。",
          theory: `
            <p><strong>离子半径与配位稳定性</strong>：为使正负离子相切吸引且相邻阴离子不相互重叠排斥，正负离子半径比 $\\gamma = r_+/r_-$ 决定最大稳定配位数：</p>
            <div class="formula-card">$$\\gamma \\ge \\sqrt{3}-1 \\approx 0.732 \\;(Z=8,\\text{CsCl}); \\quad 0.414 \\le \\gamma < 0.732 \\;(Z=6,\\text{NaCl}); \\quad 0.225 \\le \\gamma < 0.414 \\;(Z=4,\\text{ZnS})$$</div>
            <p><strong>立方晶体胡克定律与弹性势能密度</strong>（仅含 3 个独立弹性刚度常量 $C_{11}, C_{12}, C_{44}$）：</p>
            <div class="formula-card">$$u_{\\text{elastic}} = \\tfrac{1}{2}C_{11}(e_{xx}^2+e_{yy}^2+e_{zz}^2) + C_{12}(e_{yy}e_{zz}+e_{zz}e_{xx}+e_{xx}e_{yy}) + \\tfrac{1}{2}C_{44}(e_{xy}^2+e_{yz}^2+e_{zx}^2)$$</div>
          `,
          objectives: [
            "理解共价原子半径、金属半径与离子晶体有效半径的测定依据及周期律变化。",
            "几何推导八面体配位临界比 √2-1 ≈ 0.414 与立方配位临界比 √3-1 ≈ 0.732。",
            "认识晶体连续介质近似下的应变分量、弹性刚度常量 C₁₁, C₁₂, C₄₄ 与体弹性模量 B = (C₁₁+2C₁₂)/3。"
          ],
          frontier: "【压电传感与应变硅技术】在现代纳米晶体管沟道中引入精确受控的双轴弹性拉伸/压缩应变（应变工程），可通过晶格形变调控能带曲率，使载流子迁移率提升 50% 以上！"
        }
      ],
      quizzes: [
        {
          q: "1. 金刚石与硅（Si）晶体的每个原子周围只有 4 个最近邻原子（致密度仅 34%），其结构高度稳定的微观根源是：",
          options: [
            "A. 范德瓦尔斯色散吸引力极大",
            "B. 马德隆静电库仑常数最大",
            "C. s 与 p 轨道形成高度方向性的 sp³ 正四面体杂化共价键",
            "D. 离域自由电子气的屏蔽效应"
          ],
          answer: 2,
          explain: "第 IV 族元素形成 4 个等价的 sp³ 杂化轨道，夹角 109.47°，电子云沿正四面体方向高度集中重叠，共价键能极大且抗角度畸变能力极强。"
        },
        {
          q: "2. 离子晶体中正负离子半径比 r+/r- 满足八面体 6 配位（NaCl 型）几何相切稳定的下限临界值是：",
          options: [
            "A. √2 - 1 ≈ 0.414",
            "B. √3 - 1 ≈ 0.732",
            "C. √(3/2) - 1 ≈ 0.225",
            "D. 1.000"
          ],
          answer: 0,
          explain: "正方形平面内 4 个阴离子互切、中心阳离子同时与阴离子相切时，2(r+ + r-) = √2 (2r-)，解得临界半径比 r+/r- = √2 - 1 ≈ 0.414。"
        }
      ]
    },

    {
      id: "ch4",
      num: "第4章",
      shortTitle: "声子(I):晶格振动",
      fullTitle: "第 4 章 声子（I）：晶格振动 (Phonons I: Crystal Vibrations)",
      weeks: "第 9–10 周 (6 学时)",
      cases: [
        {
          id: "4-1",
          code: "4.1",
          title: "一维单原子链晶格振动：格波色散与布里渊区驻波",
          subtitle: "纵波/横波动态弹簧链、ω(k) 色散曲线、相速度与群速度 v_g",
          caption: "实时驱动三维单原子弹簧链简谐格波，调节波矢 k 观察长波弹性声速极限、布里渊区边界 k=π/a 反相驻波及群速度归零现象。",
          theory: `
            <p>质量为 $M$、间距为 $a$、最近邻恢复力常数为 $C$ 的一维单原子链，在简谐近似下运动方程 $M\\ddot{u}_s = C(u_{s+1}+u_{s-1}-2u_s)$ 的格波解 $u_s = A e^{i(ksa - \\omega t)}$ 给出<strong>色散关系</strong>：</p>
            <div class="formula-card">$$\\omega(k) = 2\\sqrt{\\frac{C}{M}} \\left|\\sin\\!\\left(\\frac{ka}{2}\\right)\\right|, \\quad v_g = \\frac{d\\omega}{dk} = a\\sqrt{\\frac{C}{M}}\\cos\\!\\left(\\frac{ka}{2}\\right)$$</div>
            <p>所有物理上不等价的振动模式完全限制在<strong>第一布里渊区 $k \\in (-\\frac{\\pi}{a}, \\frac{\\pi}{a}]$</strong> 内！在边界 $k = \\pm\\frac{\\pi}{a}$ 处，相邻原子严格反相振动，群速度 $v_g = 0$，格波发生布拉格反射成为<strong>驻波</strong>。</p>
          `,
          objectives: [
            "建立原子集体耦合振动形成格波（简正模）的直观图像，区分纵波（LA）与横波（TA）。",
            "掌握一维单原子链色散关系 ω(k)，理解长波极限（ka ≪ 1）线性弹性波与短波晶格色散效应。",
            "理解为何波矢只需限制在第一布里渊区内，以及区边界 v_g = 0 的布拉格驻波物理意义。"
          ],
          frontier: "【声子晶体与超材料减振】模仿原子晶格周期性设计宏观/微纳“声子晶体”，利用布拉格散射打开声波禁带，已成功应用于精密光刻机隔振平台、潜艇声学隐身与地震波屏障。"
        },
        {
          id: "4-2",
          code: "4.2",
          title: "一维双原子链：声学支 vs 光学支与声子禁带",
          subtitle: "双质量基元同相/反相振动三维对比、频率禁带随质量比演化",
          caption: "同屏三维对比声学支（质心同相运动）与光学支（基元内正负离子反相振动），调节质量比 M₁/M₂ 与波矢 k 实时观察声子禁带张合。",
          theory: `
            <p>当每个原胞包含两个不同质量原子 $M_1 > M_2$（晶格周期 $2a$，第一布里渊区 $[-\\frac{\\pi}{2a}, \\frac{\\pi}{2a}]$）时，色散关系分裂为两支：</p>
            <div class="formula-card">$$\\omega_{\\pm}^2(k) = C\\!\\left(\\frac{1}{M_1}+\\frac{1}{M_2}\\right) \\pm C\\sqrt{\\left(\\frac{1}{M_1}+\\frac{1}{M_2}\\right)^2 - \\frac{4\\sin^2(ka)}{M_1 M_2}}$$</div>
            <p><strong>声学支（$\\omega_-$）</strong>：$k\\to 0$ 时 $\\omega_- \\to 0$，原胞内两原子<strong>同向等幅</strong>运动，如同连续介质声波；<strong>光学支（$\\omega_+$）</strong>：$k\\to 0$ 时 $M_1 u + M_2 v = 0$（原胞质心不动，两原子<strong>反相</strong>相对振动），在离子晶体中产生交变电偶极矩，强烈耦合红外电磁波！</p>
          `,
          objectives: [
            "深刻理解三维/一维晶体中 p 个基元原子对应 3 个声学支与 3(p-1) 个光学支的普遍规律。",
            "直观分辨长波极限下声学支（同相平动）与光学支（质心静止的反相相对振动）的振动图像。",
            "观察布里渊区边界 k = π/(2a) 处光学支仅轻原子振动、声学支仅重原子振动及禁带宽度特征。"
          ],
          frontier: "【拉曼光谱与红外太赫兹检测】实验室广泛使用的激光拉曼散射与傅里叶红外光谱（FTIR），本质上正是探测布里渊区中心（k ≈ 0）附近光学支声子的特征固有频率，实现材料无损指纹识别。"
        },
        {
          id: "4-3",
          code: "4.3–4.5",
          title: "弹性波量子化（声子）、准动量与非弹性散射",
          subtitle: "简正模驻波量子化、普朗克分布及倒空间正常过程(N) / 倒逆过程(U)",
          caption: "可视化晶格弹性简正模量子化声子占据数，并在倒空间布里渊区中交互演示声子碰撞及非弹性中子散射的准动量守恒 Δk = q + G。",
          theory: `
            <p>晶格第 $\\mathbf{k}$ 个简正振动模等价于频率为 $\\omega_{\\mathbf{k}}$ 的量子谐振子，能量本征值为<strong>声子（Phonon）</strong>激发量子：</p>
            <div class="formula-card">$$E_n(\\mathbf{k}) = \\left(n_{\\mathbf{k}} + \\frac{1}{2}\\right)\\hbar\\omega_{\\mathbf{k}}, \\quad \\langle n_{\\mathbf{k}} \\rangle = \\frac{1}{e^{\\hbar\\omega_{\\mathbf{k}}/k_B T} - 1}$$</div>
            <p>声子不携带真实机械质心动量（$k\\neq 0$ 模式总动量为零），但携带<strong>准动量 $\\hbar\\mathbf{k}$</strong>！在声子相互碰撞或中子/光子非弹性散射（拉曼/布里渊散射）中，满足广义动量守恒：</p>
            <div class="formula-card">$$\\mathbf{k}_1 + \\mathbf{k}_2 = \\mathbf{k}_3 + \\mathbf{G} \\quad (\\mathbf{G}=0:\\text{正常过程 N};\\; \\mathbf{G}\\neq 0:\\text{倒逆过程 U})$$</div>
          `,
          objectives: [
            "理解晶格振动能量量子化为“声子”的概念、零点振动能 ½ℏω 及玻色-爱因斯坦热平均声子数。",
            "区分真实动量与声子准动量 ℏk，理解正常过程（N过程，G=0）与倒逆过程（Umklapp过程，G≠0）。",
            "掌握中子非弹性散射测定完整声子色散曲线 ω(k) 的能量与准动量守恒原理。"
          ],
          frontier: "【声子激光与量子声学】当代凝聚态物理与量子精密测量已能操控单个量子化声子（Quantum Acoustics），将超导量子比特与高频表面声波声子耦合，构建新型混合量子信息处理器。"
        }
      ],
      quizzes: [
        {
          q: "1. 三维闪锌矿（ZnS）或金刚石（Si）晶体的每个原胞中含有 2 个原子，其晶格振动色散关系共有多少支？",
          options: [
            "A. 1 个声学支 + 1 个光学支（共 2 支）",
            "B. 3 个声学支 + 0 个光学支（共 3 支）",
            "C. 3 个声学支 + 3 个光学支（共 6 支）",
            "D. 2 个声学支 + 4 个光学支（共 6 支）"
          ],
          answer: 2,
          explain: "三维空间中含 p 个原子的原胞共有 3p 个振动自由度：恒包含 3 个声学支（1 LA + 2 TA）和 3(p-1) 个光学支。p=2 时为 3 个声学支 + 3 个光学支。"
        },
        {
          q: "2. 在一维双原子链的布里渊区中心（k → 0 长波极限），光学支格波的原子运动特征是：",
          options: [
            "A. 原胞内两个原子同向等幅运动",
            "B. 原胞质心保持不动，两个不同原子做反相相对振动",
            "C. 只有重原子振动，轻原子完全静止",
            "D. 振动频率趋近于零"
          ],
          answer: 1,
          explain: "k → 0 时光学支满足 M₁u + M₂v = 0，原胞质心不动，两原子反相振动；若为正负离子则产生强烈振荡电偶极矩，能与电磁波（光波）发生共振吸收。"
        }
      ]
    },

    {
      id: "ch5",
      num: "第5章",
      shortTitle: "声子(II):热学性质",
      fullTitle: "第 5 章 声子（II）：热学性质 (Phonons II: Thermal Properties)",
      weeks: "第 11–12 周 (6 学时)",
      cases: [
        {
          id: "5-1",
          code: "5.1",
          title: "声子比热容：爱因斯坦模型 vs 德拜 T³ 模型",
          subtitle: "三维倒空间德拜球 k_D 热激发动态冻结与晶格热容全温区演化",
          caption: "调节温度比 T/Θ_D，观察三维倒空间德拜球内从低频长波核心向高频外壳的声子激发过程，实时对比经典极限、爱因斯坦与德拜热容曲线。",
          theory: `
            <p>经典能量均分定理预言固体摩尔热容恒为<strong>杜隆-珀蒂极限 $3R = 3N_A k_B$</strong>，无法解释低温下热容趋于零的实验事实。<strong>爱因斯坦模型</strong>假设所有原子以同一频率 $\\omega_E$ 独立振动，低温按指数衰减过快；<strong>德拜模型</strong>采用连续弹性声速近似 $\\omega = v_s k$（态密度 $D(\\omega) \\propto \\omega^2$，截断于德拜频率 $\\omega_D$），完美给出<strong>低温 $T^3$ 定律</strong>：</p>
            <div class="formula-card">$$C_V(T) = 9 N k_B \\left(\\frac{T}{\\Theta_D}\\right)^3 \\int_0^{\\Theta_D/T} \\frac{x^4 e^x}{(e^x - 1)^2}\\,dx \\;\\xrightarrow{T \\ll \\Theta_D}\\; \\frac{12\\pi^4}{5} N k_B \\left(\\frac{T}{\\Theta_D}\\right)^3$$</div>
          `,
          objectives: [
            "理解经典热容理论在低温失效的量子根源（高频振动模 ℏω ≫ k_B T 被量子“冻结”）。",
            "对比爱因斯坦模型（独立同频振子，解释高温极限与低温定性下降）与德拜模型（考虑低频长波集体声学声子）。",
            "运用三维倒空间热激发球半径 k_T ~ k_B T/(ℏv_s) 直观推导低温有效激发模数 ∝ T³、内能 ∝ T⁴、热容 ∝ T³！"
          ],
          frontier: "【极低温稀释制冷与空间深冷技术】在量子计算超导芯片工作的 mK 级极低温区，材料晶格热容严格遵循 T³ 剧减，微瓦级杂散辐射即可引起显著温升，德拜热学理论是极低温热设计的理论基石。"
        },
        {
          id: "5-2",
          code: "5.2",
          title: "非谐晶体相互作用与固体热膨胀微观机制",
          subtitle: "对称简谐势阱 vs 非对称非谐势阱 (cx² - gx³) 与晶格热膨胀",
          caption: "同屏对比理想简谐晶体与真实非谐晶体随温度升高的三维热振动，直观揭示势能曲线“左陡右缓”不对称性如何导致宏观热膨胀。",
          theory: `
            <p>若原子间势能严格为对称抛物线<strong>简谐近似 $U(x) = cx^2$</strong>，无论温度多高，原子在平衡位置两侧对称振动，平均间距变化 $\\langle x \\rangle = 0$，<strong>严格简谐晶体不会发生热膨胀，且声子间无碰撞！</strong></p>
            <p>真实原子势阱左壁排斥极陡、右壁吸引较缓，展开保留<strong>三次与四次非谐项</strong>：</p>
            <div class="formula-card">$$U(x) = c x^2 - g x^3 - f x^4 \\quad (g > 0) \\;\\Longrightarrow\\; \\langle x \\rangle = \\frac{3 g}{4 c^2} k_B T$$</div>
            <p>因此平均原子间距随温度升高而增大，线膨胀系数 $\\alpha \\propto C_V(T)$！</p>
          `,
          objectives: [
            "明白严格简谐近似的局限性（零热膨胀、无限大热导率、弹性模量与温度无关）。",
            "掌握三次非谐项 -gx³ 破坏势阱左右对称性、导致平均位置 ⟨x⟩ 随温度正比偏移的清晰图像。",
            "了解某些特殊骨架晶体（如 ZrW₂O₈）通过横向刚性多面体旋转耦合实现反常“负热膨胀”的原理。"
          ],
          frontier: "【航空航天零膨胀精密材料】空间望远镜镜坯与光刻机极紫外反射镜要求在剧烈温差下尺寸纹丝不动，我国材料学家利用非谐晶格调控研制的负热膨胀/零膨胀复合陶瓷与因瓦合金解决了这一关键难题。"
        },
        {
          id: "5-3",
          code: "5.3",
          title: "晶格导热性与声子输运 (κ = ⅓ C v l)",
          subtitle: "三维声子气体热流通道、边界散射/缺陷散射与高温倒逆过程(U)热阻",
          caption: "仿真高温端向低温端扩散的三维声子波包流，调节温度与缺陷浓度，观察低温边界受限、中温导热峰值与高温倒逆散射热阻演化。",
          theory: `
            <p>将晶体中的声子视为准粒子气体，动理论给出<strong>晶格热导率</strong>：</p>
            <div class="formula-card">$$\\kappa = \\frac{1}{3} C_V v_s \\ell$$</div>
            <p>其中 $v_s$ 为声速，$\\ell$ 为声子平均自由程。需要注意：<strong>正常过程（N过程，$\\mathbf{G}=0$）守恒总准动量，本身不产生热阻！</strong>真正使热流衰减建立稳态温度梯度的是<strong>倒逆过程（Umklapp U过程，$\\mathbf{k}_1+\\mathbf{k}_2 = \\mathbf{k}_3 + \\mathbf{G}$）</strong>以及边界和杂质缺陷散射：</p>
            <p>• 极低温区：$\\ell \\approx L_{\\text{样品边界}}$，$\\kappa \\propto C_V \\propto T^3$；<br>• 高温区（$T > \\Theta_D$）：声子数 $\\propto T$，U 过程碰撞率剧增使 $\\ell \\propto 1/T$，故 $\\kappa \\propto 1/T$。</p>
          `,
          objectives: [
            "掌握声子气体热导率公式 κ = ⅓ C_V v l 中各物理量随温度的变化规律。",
            "深刻理解为何只有倒逆过程（Umklapp 散射）、缺陷散射和边界散射才会限制晶格热导率。",
            "解释纯净单晶（如金刚石、蓝宝石）热导率在低温区出现巨大峰值的完整微观机制。"
          ],
          frontier: "【芯片高导热散热与热电能源转换】一方面，金刚石与立方砷化硼凭借超高声速与弱非谐散射成为顶级芯片散热材料；另一方面，温差发电热电材料（如 Bi₂Te₃、SnSe）则通过纳米声子工程强力散射声子、打造“声子玻璃-电子晶体”。"
        }
      ],
      quizzes: [
        {
          q: "1. 根据德拜模型，在远低于德拜温度的极低温区（T ≪ Θ_D），绝缘晶体的晶格比热容 C_V 随温度的变化规律是：",
          options: [
            "A. 恒定为 3Nk_B",
            "B. 与 T 成正比（C_V ∝ T）",
            "C. 与 T³ 成正比（C_V ∝ T³）",
            "D. 按 exp(-Θ/T) 指数趋于零"
          ],
          answer: 2,
          explain: "低温下仅 ω ≲ k_B T/ℏ 的长波声学声子被激发，三维倒空间有效激发球体积正比于 T³，每个激发模平均能量约 k_B T，故总热能 U ∝ T⁴，热容 C_V = ∂U/∂T ∝ T³。"
        },
        {
          q: "2. 导致纯净无缺陷理想单晶在高温区热导率有限（κ ∝ 1/T）的根本微观散射机制是：",
          options: [
            "A. 简谐声子正常碰撞过程（N-process, G = 0）",
            "B. 非谐相互作用引起的声子倒逆碰撞过程（Umklapp U-process, G ≠ 0）",
            "C. 样品表面几何边界反射",
            "D. 自由电子热辐射"
          ],
          answer: 1,
          explain: "正常过程（G=0）守恒声子总准动量，热流不衰减；只有非谐耦合下的倒逆过程（U过程，G≠0）能反转声子净动量方向，从而在高温区产生本征热阻。"
        }
      ]
    },

    {
      id: "ch6",
      num: "第6章",
      shortTitle: "自由电子费米气",
      fullTitle: "第 6 章 自由电子费米气 (Free Electron Fermi Gas)",
      weeks: "第 12–14 周 (7.5 学时)",
      cases: [
        {
          id: "6-1",
          code: "6.1 & 6.3",
          title: "一维势箱与三维自由电子费米球 (Fermi Sphere)",
          subtitle: "k 空间分立量子态填充、费米波矢 k_F、费米能 E_F 与态密度 D(E)",
          caption: "三维渲染 k 空间允许波矢格点由泡利不相容原理逐层填满形成费米球，支持金属种类切换、截面剖视与 √E 态密度联动。",
          theory: `
            <p>忽略离子实周期势起伏与电子间库仑排斥，将金属中的价电子视为限制在体积 $V=L^3$ 均匀势箱中的<strong>无相互作用费米气体</strong>。周期性边界条件下 $\\mathbf{k} = \\frac{2\\pi}{L}(n_x, n_y, n_z)$，每个 $\\mathbf{k}$ 态容纳自旋相反的 $2$ 个电子。基态（$T=0\\text{ K}$）所有电子填满半径为<strong>费米波矢 $k_F$</strong> 的<strong>费米球</strong>：</p>
            <div class="formula-card">$$k_F = (3\\pi^2 n)^{1/3}, \\quad E_F = \\frac{\\hbar^2 k_F^2}{2m} = \\frac{\\hbar^2}{2m}(3\\pi^2 n)^{2/3}, \\quad D(E) = \\frac{V}{2\\pi^2}\\!\\left(\\frac{2m}{\\hbar^2}\\right)^{3/2}\\sqrt{E}$$</div>
            <p>典型金属费米能 $E_F \\sim 2\\text{–}12\\text{ eV}$，对应<strong>费米温度 $T_F = E_F/k_B \\sim 5\\times 10^4\\text{ K}$</strong>、费米速度 $v_F \\sim 10^6\\text{ m/s}$！</p>
          `,
          objectives: [
            "掌握一维无限深势阱驻波解与三维周期性边界条件（玻恩-冯·卡门边界条件）在 k 空间的态密度计数。",
            "理解泡利不相容原理如何迫使基态电子堆积出高达数电子伏特的费米能 E_F 与费米球。",
            "熟记三维自由电子气态密度 D(E) ∝ √E 及基态平均能量 (3/5)E_F。"
          ],
          frontier: "【超冷费米原子气体量子模拟】中国科学技术大学等研究团队在超冷 ⁶Li / ⁴⁰K 原子光晶格体系中直接观测到了清晰的三维费米面及 BCS-BEC 超流渡越，在宏观尺度重现了固体费米气量子图像。"
        },
        {
          id: "6-2",
          code: "6.2 & 6.4",
          title: "费米-狄拉克分布温度演化与电子气比热容",
          subtitle: "费米球表层 k_B T 热激发壳层三维透视、f(E,T) 软化与 C_el = γT",
          caption: "调节温度观察三维费米球表面热激发模糊壳层与内部空态产生，破解经典理论“电子热容灾变”，直观导出线性电子热容 γT。",
          theory: `
            <p>有限温度 $T$ 下，电子占据能量 $E$ 量子态的概率服从<strong>费米-狄拉克（Fermi-Dirac）统计分布</strong>：</p>
            <div class="formula-card">$$f(E, T) = \\frac{1}{\\exp\\!\\left(\\frac{E - \\mu}{k_B T}\\right) + 1}$$</div>
            <p>由于室温下 $k_B T \\approx 0.026\\text{ eV} \\ll E_F \\approx 5\\text{ eV}$，深处于费米球内部的电子因上方态已被占满而无法受热激发！<strong>仅有费米面附近能量宽度约 $k_B T$ 壳层内（占比约 $T/T_F \\sim 1\\%$）的电子能吸收热能 $k_B T$</strong>，故电子比热容与温度成正比：</p>
            <div class="formula-card">$$C_{\\text{el}} = \\frac{\\pi^2}{2} N k_B \\frac{T}{T_F} = \\gamma T, \\quad C_{\\text{total}} = \\gamma T + A T^3$$</div>
          `,
          objectives: [
            "掌握费米-狄拉克分布函数在 T = 0 K（阶跃函数）与 T > 0 K（费米面附近 ~2k_B T 范围尾部软化）的演化特征。",
            "清晰解释为何常温下金属中的自由电子对总热容贡献极小（不到经典预言 3/2 Nk_B 的百分之一），而在极低温（< 4 K）下反超声子 T³ 项成为主导！",
            "学会利用低温实验曲线 C/T 对 T² 作线性拟合同时测定电子比热系数 γ 与德拜温度 Θ_D。"
          ],
          frontier: "【重费米子超导材料】在铈（Ce）、镱（Yb）基强关联重费米子金属中，局域 f 电子与巡游电子杂化使有效质量激增上千倍，低温电子比热系数 γ 较普通铜高出三个数量级！"
        },
        {
          id: "6-5",
          code: "6.5",
          title: "电导率与欧姆定律：微观碰撞弛豫与费米球漂移",
          subtitle: "实空间电子散射轨迹 + k 空间费米球整体刚性位移 δk = -eEτ/ℏ",
          caption: "双重视角联动：实空间展示导电电子在外电场加速与声子/杂质碰撞下的漂移运动，动量空间展示整个费米球的稳态偏移。",
          theory: `
            <p>外加恒定电场 $\\mathbf{E}$ 时，每个电子波矢以 $\\hbar\\dot{\\mathbf{k}} = -e\\mathbf{E}$ 匀速演化；引入平均碰撞<strong>弛豫时间 $\\tau$</strong> 后，整个费米球在动量空间维持微小稳态平移 $\\delta\\mathbf{k} = -\\frac{e\\tau}{\\hbar}\\mathbf{E}$，产生平均漂移速度 $\\mathbf{v}_d = -\\frac{e\\tau}{m}\\mathbf{E}$ 与<strong>欧姆定律</strong>：</p>
            <div class="formula-card">$$\\mathbf{J} = -n e \\mathbf{v}_d = \\sigma \\mathbf{E}, \\quad \\sigma = \\frac{n e^2 \\tau}{m}$$</div>
            <p>注意量子图像的关键修正：完美周期晶格并<strong>不会</strong>散射电子（布洛赫波无阻传播）！实际电阻来源于破坏周期性的<strong>晶格热振动（声子，$\\rho_L(T)$）</strong>与<strong>杂质缺陷（剩余电阻率 $\\rho_i$，马提森定则 $\\rho = \\rho_L(T) + \\rho_i$）</strong>。</p>
          `,
          objectives: [
            "掌握从弛豫时间近似推导直流电导率 σ = ne²τ/m 与欧姆定律的方法。",
            "理解经典德鲁德图像（所有电子以热速度碰撞）与量子索末菲图像（费米球整体平移，实为费米面高速电子参与净导电）的本质区别。",
            "理解金属电阻率的马提森定则（声子散射项随温度升高线性增大 + 低温杂质剩余电阻率）与维德曼-弗朗茨热电比定律。"
          ],
          frontier: "【高纯无氧铜与二维弹道输运】超纯金属在液氦温度下剩余电阻比（RRR）可达数万，电子平均自由程长达毫米级；而在高质量石墨烯微纳器件中，电子甚至无需碰撞即可实现微米尺度的“弹道输运”与电子流体力学现象。"
        },
        {
          id: "6-6",
          code: "6.6",
          title: "磁场中的运动：回旋共振与霍尔效应 (Hall Effect)",
          subtitle: "洛伦兹力偏转、侧面电荷积累、霍尔电场动态平衡与 n/p 载流子判别",
          caption: "三维仿真通电导体片在垂直磁场 B 下的载流子偏转、边缘表面电荷建立与三维螺旋回旋运动，支持电子型与空穴型载流子一键反转。",
          theory: `
            <p>带电粒子在电磁场中受洛伦兹力 $m\\left(\\frac{d\\mathbf{v}}{dt} + \\frac{\\mathbf{v}}{\\tau}\\right) = q(\\mathbf{E} + \\mathbf{v}\\times\\mathbf{B})$。在横向开路稳态（$J_y = 0$）下，样品侧面积累的电荷建立<strong>横向霍尔电场 $E_y$</strong>，恰好平衡磁洛伦兹力：</p>
            <div class="formula-card">$$E_y = R_H J_x B_z, \\quad R_H = -\\frac{1}{n e} \\;(\\text{电子}) \\;\\text{或}\\; +\\frac{1}{p e} \\;(\\text{空穴}), \\quad \\omega_c = \\frac{|q|B}{m^*}$$</div>
            <p>自由电子气模型只能给出负霍尔系数（$R_H < 0$），而铝、铍及众多半导体实测出现<strong>正霍尔系数（$R_H > 0$）</strong>，这正是通往第 7 章<strong>固体能带论与“空穴”概念</strong>的重要实验突破口！</p>
          `,
          objectives: [
            "掌握磁场中电子回旋频率 ω_c = eB/m* 的物理意义及强场回旋共振条件 ω_c τ > 1。",
            "完整描述霍尔效应从瞬态磁偏转、侧面电荷堆积到横向电场建立稳态平衡的动态过程。",
            "理解如何利用霍尔系数 R_H 的符号判断主导载流子电性（电子 vs 空穴）、用其绝对值精准测定载流子浓度 n！"
          ],
          frontier: "【从经典霍尔传感到量子反常霍尔效应】薛其坤院士领衔的中国团队在磁性拓扑绝缘体薄膜中于国际上首次实验发现“量子反常霍尔效应”，无需外加磁场即可实现零能耗手性边缘导电通道，荣获国家自然科学一等奖与巴克利奖。"
        }
      ],
      quizzes: [
        {
          q: "1. 室温下金属中自由电子对热容的贡献远小于经典能量均分定理预言的 (3/2)Nk_B，其根本原因是：",
          options: [
            "A. 室温下金属中的价电子全部被原子核束缚不能运动",
            "B. 泡利不相容原理使绝大多数内层电子态被占满，仅有费米面附近约 k_B T / E_F 比例的电子能受热激发",
            "C. 电子质量太轻，动能永远为零",
            "D. 电子之间库仑排斥抵消了热能"
          ],
          answer: 1,
          explain: "金属费米温度 T_F ~ 50,000 K 远高于室温 300 K，受费米-狄拉克统计与泡利不相容原理限制，只有处于费米面附近 ~k_B T 薄壳内的极少数电子可以跃迁到上方空态吸收热能。"
        },
        {
          q: "2. 在霍尔效应实验中，保持电流沿 +x 方向、磁场沿 +z 方向不变，若将 n 型半导体换为同浓度的 p 型半导体，横向霍尔电场 E_y 的方向将：",
          options: [
            "A. 保持不变",
            "B. 方向反转（霍尔系数 R_H 由负变正）",
            "C. 变为零",
            "D. 转向 z 轴方向"
          ],
          answer: 1,
          explain: "电流同沿 +x 时，负电子向 -x 漂移而正空穴向 +x 漂移，由 v × B 知正负两种载流子被洛伦兹力推向同一侧面，因而积累的电荷极性相反，霍尔电压与霍尔电场符号反转！"
        }
      ]
    },

    {
      id: "ch7",
      num: "第7章",
      shortTitle: "固体能带论",
      fullTitle: "第 7 章 固体能带论 (Energy Bands)",
      weeks: "第 15–17 周 (9 学时)",
      cases: [
        {
          id: "7-1",
          code: "7.1",
          title: "近自由电子模型：布拉格反射驻波与能隙打开",
          subtitle: "三维周期离子势阱、ψ₊ / ψ₋ 驻波电荷密度分布与禁带 E_g = 2|U_G|",
          caption: "三维可视化布里渊区边界 k = ±π/a 处两列相反行波相干叠加成的对称/反对称驻波电子云，揭示周期势打开能隙的直观物理原因。",
          theory: `
            <p>在自由电子气基础上引入弱晶格周期势 $U(x) = \\sum_{G} U_G e^{iGx}$。当电子波矢抵达<strong>布里渊区边界 $k = \\pm\\frac{\\pi}{a}$</strong> 时，满足布拉格反射条件，右行波 $e^{i\\pi x/a}$ 与反射左行波 $e^{-i\\pi x/a}$ 强耦合形成两支<strong>驻波本征态</strong>：</p>
            <div class="formula-card">$$\\begin{aligned}
              \\psi_+(x) \\propto \\cos\\!\\left(\\frac{\\pi x}{a}\\right) &\\;\\Longrightarrow\\; |\\psi_+|^2 \\text{ 聚集在正离子核上，势能降低 } -|U_G| \\\\
              \\psi_-(x) \\propto \\sin\\!\\left(\\frac{\\pi x}{a}\\right) &\\;\\Longrightarrow\\; |\\psi_-|^2 \\text{ 聚集在离子间隙中，势能升高 } +|U_G|
            \\end{aligned}$$</div>
            <p>两者势能之差在布里渊区边界直接打开宽度为 <strong>$E_g = 2|U_G|$</strong> 的<strong>能量禁带（Band Gap）</strong>！</p>
          `,
          objectives: [
            "深刻理解能带分裂与禁带产生的物理原因：布里渊区边界布拉格反射形成的两支驻波对周期离子势场的静电势能不同！",
            "熟练转换能带表示的三种图景：扩展区图景（Extended Zone）、简约区图景（Reduced Zone）与周期区图景（Periodic Zone）。",
            "定量掌握一阶简并微扰给出的禁带宽度 E_g = 2|U_G| 及区边界能带斜率 dE/dk = 0。"
          ],
          frontier: "【光子晶体与超晶格能带工程】人工半导体超晶格（AlGaAs/GaAs）通过在纳米尺度人为设计周期势场周期与幅值，按需剪裁“子能带”宽度，催生了量子级联激光器（QCL）与高频太赫兹源。"
        },
        {
          id: "7-2",
          code: "7.2",
          title: "布洛赫函数与二维紧束缚三维能带曲面 E(kx, ky)",
          subtitle: "Bloch 调幅波三维复螺旋 + 正方晶格/石墨烯狄拉克锥 3D 能带与费米面",
          caption: "模式A演示布洛赫波 ψ_k(r)=u_k(r)e^{ikr} 的晶格周期调幅相位演化；模式B三维旋转二维紧束缚能带曲面与石墨烯狄拉克锥，并用费米面动态切割。",
          theory: `
            <p><strong>布洛赫定理（Bloch's Theorem）</strong>指出周期势场 $U(\\mathbf{r}+\\mathbf{R}) = U(\\mathbf{r})$ 中单电子薛定谔方程的本征波函数必然具有晶格周期调幅平面波形式：</p>
            <div class="formula-card">$$\\psi_{n\\mathbf{k}}(\\mathbf{r}) = u_{n\\mathbf{k}}(\\mathbf{r}) e^{i\\mathbf{k}\\cdot\\mathbf{r}}, \\quad u_{n\\mathbf{k}}(\\mathbf{r}+\\mathbf{R}) = u_{n\\mathbf{k}}(\\mathbf{r})$$</div>
            <p>从孤立原子轨道出发的<strong>紧束缚近似（Tight-Binding）</strong>给出正方晶格 $s$ 带色散：</p>
            <div class="formula-card">$$E(k_x, k_y) = E_0 - 2t\\left[\\cos(k_x a) + \\cos(k_y a)\\right]$$</div>
            <p>能带宽度 $W = 8t$ 正比于最近邻轨道交叠跃迁积分 $t$：原子间距越小、轨道交叠越强，能带越宽！</p>
          `,
          objectives: [
            "掌握布洛赫定理的两种等价表述（调幅平面波形式与平移算符本征值形式 ψ(r+R) = e^{ik·R}ψ(r)）。",
            "理解紧束缚近似从分立原子能级因波函数交叠展宽为连续允带的物理图像。",
            "观察二维三维能带曲面 E(k_x, k_y) 中电子口袋、范霍夫鞍点与空穴口袋费米面的拓扑演化。"
          ],
          frontier: "【石墨烯狄拉克锥与拓扑能带论】单层石墨烯蜂窝晶格紧束缚能带在布里渊区 K 与 K' 角点线性交汇形成零质量“狄拉克锥”，引发相对论量子电动力学输运与现代拓扑物态革命。"
        },
        {
          id: "7-3",
          code: "7.3",
          title: "克勒尼西-彭尼模型 (Kronig-Penney Model)",
          subtitle: "一维周期 δ/方势垒精确可解模型：从自由电子到孤立原子能级的连续桥梁",
          caption: "连续拖动势垒强度 P 从 0 到极大值，同步观察超越方程图解法 [-1, +1] 取值区间截断以及三维允带/禁带谱的动态生成。",
          theory: `
            <p><strong>克勒尼西-彭尼（Kronig-Penney）模型</strong>采用周期性狄拉克 $\\delta$ 势垒链 $U(x) = \\sum_n (\\frac{\\hbar^2 P}{ma}) \\delta(x - na)$ 严格求解薛定谔方程，应用布洛赫边界条件得到著名超越方程：</p>
            <div class="formula-card">$$P \\frac{\\sin(\\alpha a)}{\\alpha a} + \\cos(\\alpha a) = \\cos(ka), \\quad \\alpha = \\frac{\\sqrt{2mE}}{\\hbar}$$</div>
            <p>由于右端 $\\cos(ka) \\in [-1, +1]$（实波矢传播态），只有使左端函数值落在 $[-1, +1]$ 带内的能量 $E$ 才构成<strong>允带</strong>；超出 $[-1, +1]$ 的区域 $k$ 为虚数，波函数指数衰减，构成<strong>禁带</strong>！</p>
          `,
          objectives: [
            "掌握克勒尼西-彭尼超越方程的图解分析法，直观读取允带与禁带位置。",
            "通过调节无量纲势垒强度 P 串联两大极限：P → 0 退化为自由电子连续谱 E = ℏ²k²/2m；P → ∞ 退化为一维无限深势阱分立原子能级 αa = nπ！",
            "观察高能区（αa 增大）允带变宽、禁带变窄的普遍规律。"
          ],
          frontier: "【半导体量子阱与谐振隧穿器件】现代分子束外延生长的多量子阱（MQW）激光器（蓝光 LED 诺奖核心结构）正是克勒尼西-彭尼有限周期势阱模型在工程器件上的直接实现。"
        },
        {
          id: "7-4",
          code: "7.4–7.5",
          title: "能带轨道数目、有效质量/空穴与导体·半导体·绝缘体",
          subtitle: "能带填充决定材料导电性、掺杂能级激发与 m* 负曲率空穴运动三维仿真",
          caption: "模式A三维对比金属/绝缘体/本征与N·P型掺杂半导体的能带填充与载流子导电；模式B动态演示能带顶负有效质量电子减速反射及正空穴等效图像。",
          theory: `
            <p><strong>能带轨道数目与导电性判据</strong>：由 $N$ 个原胞组成的晶体，每一条非简并能带在第一布里渊区内恰好包含 $N$ 个独立的 $\\mathbf{k}$ 轨道（计及自旋可容纳 <strong>$2N$ 个电子</strong>）！</p>
            <p>• 若每个原胞含奇数个价电子（如 Na, Cu），最高能带半满 $\\Rightarrow$ <strong>金属</strong>；<br>• 若含偶数个价电子且价带与导带存在交叠（如 Mg, Ca）$\\Rightarrow$ <strong>二价金属</strong>；<br>• 若含偶数个价电子且满价带与空导带被禁带隔开：$E_g \\gtrsim 4\\text{ eV}$ 为<strong>绝缘体</strong>，$E_g \\sim 0.1\\text{–}3\\text{ eV}$ 为<strong>半导体</strong>！</p>
            <div class="formula-card">$$m^* = \\frac{\\hbar^2}{d^2 E / d k^2}, \\quad v_g = \\frac{1}{\\hbar}\\frac{dE}{dk}$$</div>
            <p>在近满价带顶部，$\\frac{d^2E}{dk^2} < 0$（<strong>负有效质量</strong>），缺一个电子的满带集体行为完全等效于带电量 $+e$、有效质量 $m_h^* = -m_e^* > 0$ 的准粒子——<strong>空穴（Hole）</strong>！</p>
          `,
          objectives: [
            "理解每个能带容纳 2N 个电子的计数规则，能够根据原胞价电子数与能带交叠情况准确判别金属、绝缘体与半导体。",
            "掌握本征激发（电子-空穴对成对产生）以及施主（N型，如 Si 掺 P）与受主（P型，如 Si 掺 B）杂质的导电物理根源。",
            "深刻理解有效质量张量 m* 概括晶格周期势内力作用的精妙思想，以及能带顶部空穴概念的准粒子本质。"
          ],
          frontier: "【半导体芯片与第三代宽禁带功率电子】从硅基超大规模集成电路（E_g = 1.12 eV）到我国重点突破的碳化硅（SiC, E_g = 3.26 eV）与氮化镓（GaN, E_g = 3.4 eV）新能源汽车高压快充与 5G 射频芯片，固体能带论正是整个现代信息文明的物理基石！"
        }
      ],
      quizzes: [
        {
          q: "1. 由 N 个原胞构成的简单晶体，在计及电子自旋简并度后，第一布里渊区内的每一个单能带最多可容纳多少个电子？",
          options: [
            "A. N / 2 个",
            "B. N 个",
            "C. 2N 个",
            "D. 4N 个"
          ],
          answer: 2,
          explain: "周期性边界条件下第一布里渊区内允许的独立波矢 k 数目严格等于晶体原胞总数 N；每个波矢态容纳自旋向上和向下 2 个电子，故单能带容量为 2N 个电子。"
        },
        {
          q: "2. 碱土金属镁（Mg）每个原子有 2 个价电子（原胞含偶数个价电子），按理可恰好填满一个能带，但它实际上却是优良的金属导体，原因是：",
          options: [
            "A. 镁晶体中泡利不相容原理失效",
            "B. 三维空间不同晶向上的第一能带顶部与第二能带底部在能量上发生交叠（能带重叠）",
            "C. 镁的禁带宽度超过 10 eV",
            "D. 镁仅靠晶格声子导电"
          ],
          answer: 1,
          explain: "三维晶体中不同布里渊区方向的边界距离不同，若低能带在某方向的最大能量高于高能带在另一方向的最小能量（能带交叠），电子会溢入第二能带形成两个部分填充带，表现为金属导电性。"
        }
      ]
    }
  ]
};
