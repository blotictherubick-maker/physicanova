const coursesData = [
    {
        id: "isigin-geometrik-davranisi",
        title: "Işığın Geometrik Davranışı",
        summary: "Işığın düz bir çizgide yayılmasından yansıma ve kırılmaya kadar geometrik optiğin temellerini kavrayın.",
        duration: "3 Saat",
        difficulty: "Başlangıç",
        goal: "Işığın yayılma prensiplerini, yansıma, kırılma ve toplam iç yansımayı problem çözebilecek düzeyde anlamak.",
        simCount: 2,
        intro: "Bu ders, ışığı bir elektromanyetik dalga olarak değil, doğrusal yayılan 'ışınlar' olarak ele alır. Işığın farklı ortamlardaki hızı, yüzeylere çarptığında yön değiştirmesi ve kırılma indisine bağlı olarak tam iç yansıma yapması bu modülün temel konularıdır.",
        objectives: [
            "Fermat Prensibi'ni kullanarak yansıma ve kırılma yasalarını türetebilmek.",
            "Snell Yasası'nı uygulayarak farklı ortamlar arası geçişleri hesaplayabilmek.",
            "Fiber optik teknolojisinin temelindeki toplam iç yansımayı açıklayabilmek."
        ],
        modules: [
            "Modül 1: Işığın Yayılması ve Işın Modeli (OpenStax 1.1)",
            "Modül 2: Yansıma Yasası ve Düzlem Yüzeyler (OpenStax 1.2)",
            "Modül 3: Kırılma ve Snell Yasası (OpenStax 1.3)",
            "Modül 4: Tam İç Yansıma ve Kritik Açı (OpenStax 1.4)"
        ],
        simulations: [
            { title: "Fermat Prensibi ve Snell Yasası", url: "202_sinif_deneyleri.html", type: "Laboratuvar" },
            { title: "Kırılma ve Görünür Derinlik", url: "refraction.html", type: "Pratik" }
        ],
        questions: [
            "Işık yoğun ortamdan az yoğun ortama geçerken normale yaklaşır mı, uzaklaşır mı?",
            "Fermat Prensibi'ne göre ışık hangi yolu tercih eder?",
            "Tam iç yansımanın gerçekleşmesi için gerekli koşullar nelerdir?"
        ]
    },
    {
        id: "optik-aletler",
        title: "Optik Aletler ve Görüntü Oluşumu",
        summary: "Aynalar ve mercekler yardımıyla göz, kamera ve teleskopların nasıl görüntü oluşturduğunu inceleyin.",
        duration: "4 Saat",
        difficulty: "Orta",
        goal: "Geometrik optik yasalarını kullanarak küresel aynalar ve ince merceklerde görüntü oluşumunu analiz etmek.",
        simCount: 3,
        intro: "Işığın geometrik davranışını öğrendikten sonra, bu prensipleri günlük hayatta kullandığımız optik araçlara uyguluyoruz. Bu ders; aynaların odak noktaları, merceklerin büyütme oranları ve insan gözünün optik kusurları üzerine odaklanmaktadır.",
        objectives: [
            "Küresel aynalar (çukur ve tümsek) için ışın çizimleri yapabilmek.",
            "İnce mercek denklemini kullanarak sanal ve gerçek görüntülerin yerini bulabilmek.",
            "Mercek yapıcı denklemini kavrayarak optik tasarım parametrelerini anlamak."
        ],
        modules: [
            "Modül 1: Düzlem ve Küresel Aynalarda Görüntü (OpenStax 2.1 - 2.2)",
            "Modül 2: Kırılma ile Görüntü Oluşumu (OpenStax 2.3)",
            "Modül 3: İnce Mercekler ve Mercek Denklemi (OpenStax 2.4)",
            "Modül 4: Göz, Kamera ve Optik Araçlar (OpenStax 2.5 - 2.8)"
        ],
        simulations: [
            { title: "Ayna Laboratuvarı", url: "mirror_lab.html", type: "Laboratuvar" },
            { title: "İnce Mercek Simülatörü", url: "lens_sim.html", type: "Pratik" },
            { title: "Mercek Yapıcı Denklemi", url: "lens_maker.html", type: "Analiz" }
        ],
        questions: [
            "Odak uzaklığı f olan bir tümsek aynanın önündeki cismin görüntüsü nerede oluşur?",
            "Yakını göremeyen (miyop) bir göz hangi tür mercekle düzeltilir?",
            "Mercek yapıcı denklemine göre kırıcılık indisi artarsa odak uzaklığı nasıl değişir?"
        ]
    },
    {
        id: "girisim-ve-kirinim",
        title: "Girişim ve Kırınım",
        summary: "Dalga optiğinin temellerini atarak, ışığın çift yarıkta girişimini ve ince filmlerdeki renk oyunlarını öğrenin.",
        duration: "5 Saat",
        difficulty: "İleri",
        goal: "Işığın dalga karakterini deneysel temelleriyle kavramak ve kırınım limitlerinin çözünürlüğe etkisini analiz etmek.",
        simCount: 3,
        intro: "Bu derste ışığın dalga doğasına iniyoruz. Thomas Young'ın ünlü çift yarık deneyi, ışığın dalgalar halinde yayıldığının en büyük kanıtıdır. Optik aletlerin sınırlarını belirleyen kırınım olayları ve ince zarlardaki girişim desenleri bu dersin kalbini oluşturur.",
        objectives: [
            "Young'ın Çift Yarık deneyindeki aydınlık ve karanlık saçak şartlarını türetebilmek.",
            "İnce zarlarda faz kayması ve yansıma nedeniyle oluşan girişimi hesaplayabilmek.",
            "Tek yarıkta kırınım desenini açıklayarak Rayleigh kriterini çözünürlüğe uygulayabilmek."
        ],
        modules: [
            "Modül 1: Çift Yarıkta Girişim Deneyi (OpenStax 3.1)",
            "Modül 2: İnce Filmlerde Girişim (OpenStax 3.4)",
            "Modül 3: Tek Yarıkta Kırınım (OpenStax 4.1)",
            "Modül 4: Kırınım Ağları ve X-Işını Kırınımı (OpenStax 4.4 - 4.6)"
        ],
        simulations: [
            { title: "Tek ve Çift Yarıkta Kırınım", url: "diffraction.html", type: "Laboratuvar" },
            { title: "Malus Yasası ve Polarizasyon", url: "malus.html", type: "Pratik" },
            { title: "Stokes Parametreleri", url: "stokes.html", type: "İleri Analiz" }
        ],
        questions: [
            "Çift yarık deneyinde yarıklar arası mesafe artarsa saçak genişliği nasıl değişir?",
            "Sabun köpüğündeki renkli desenlerin temel fiziksel nedeni nedir?",
            "Tek yarıkta merkezi aydınlık saçağın genişliği nelere bağlıdır?"
        ]
    },
    {
        id: "ozel-gorelilik",
        title: "Özel Göreliliğe Giriş",
        summary: "Einstein'ın kuramıyla zamanın ve mekanın mutlak olmadığını, ışık hızının sınırlarını keşfedin.",
        duration: "4 Saat",
        difficulty: "Zor",
        goal: "Klasik (Galileo) sezgilerin yüksek hızlarda nasıl çöktüğünü ve Görelilik postülatlarının mantığını anlamak.",
        simCount: 2,
        intro: "Klasik mekanik düşük hızlarda kusursuz çalışsa da, evrenin hız sınırı olan ışık hızına yaklaşıldığında garip olaylar başlar. Bu ders, fizik yasalarının eylemsiz her referans sisteminde aynı olduğunu ve ışık hızının sabitliğinin evren anlayışımızı nasıl baştan yazdığını konu alır.",
        objectives: [
            "Özel göreliliğin iki temel postülatını ifade edebilmek.",
            "Zaman genişlemesi formülünü uygulayarak kozmik ışın müonlarının ömrünü hesaplayabilmek.",
            "Eşzamanlılık kavramının mutlak olmadığını kanıtlayabilmek."
        ],
        modules: [
            "Modül 1: Fizik Yasalarının Değişmezliği (OpenStax 5.1)",
            "Modül 2: Eşzamanlılık ve Zaman Genişlemesi (OpenStax 5.2 - 5.3)",
            "Modül 3: Uzunluk Büzülmesi (OpenStax 5.4)",
            "Modül 4: Lorentz Dönüşümleri (OpenStax 5.5)"
        ],
        simulations: [
            { title: "Michelson-Morley Deneyi", url: "michelson_morley.html", type: "Deney Analizi" },
            { title: "Özel Görelilik: İkizler Paradoksu", url: "#", type: "Düşünce Deneyi" }
        ],
        questions: [
            "Michelson-Morley deneyinin 'başarısız' olmasının fizikteki büyük önemi nedir?",
            "Hareketli bir saat, durgun bir saate göre neden daha yavaş çalışır?",
            "Lorentz faktörü (γ) hangi hızda 1'e eşittir?"
        ]
    },
    {
        id: "kuantumun-dogusu",
        title: "Kuantumun Doğuşu",
        summary: "Kara cisim ışıması, fotoelektrik etki ve Compton saçılması üzerinden kuantum teorisinin inşasını takip edin.",
        duration: "5 Saat",
        difficulty: "Orta",
        goal: "Enerjinin sürekli değil kuantize (kesikli) olduğu fikrinin tarihsel ve deneysel gelişimini öğrenmek.",
        simCount: 2,
        intro: "19. yüzyılın sonunda klasik fizik evreni neredeyse tamamen açıkladığını düşünüyordu. Ancak siyah cisim radyasyonunun spektrumu ve fotoelektrik etki gibi bazı anlaşılmaz deneyler her şeyi değiştirdi. Bu ders, ışığın hem bir dalga hem de enerji paketleri (fotonlar) olarak nasıl ele alındığını anlatıyor.",
        objectives: [
            "Planck hipotezini açıklayarak kara cisim ışımasındaki morötesi felaketin nasıl çözüldüğünü anlamak.",
            "Fotoelektrik denkleminde kesme potansiyeli ve eşik frekansını hesaplayabilmek.",
            "Compton saçılmasında fotonun ivmelenmesi sonucu dalga boyu değişimini formüle etmek."
        ],
        modules: [
            "Modül 1: Kara Cisim Işıması ve Planck Hipotezi (OpenStax 6.1)",
            "Modül 2: Fotoelektrik Etki ve Fotonlar (OpenStax 6.2)",
            "Modül 3: Compton Etkisi (OpenStax 6.3)",
            "Modül 4: De Broglie Dalgaları ve Dalga-Parçacık İkiliği (OpenStax 6.5 - 6.6)"
        ],
        simulations: [
            { title: "Fotoelektrik Etki", url: "photoelectric.html", type: "Laboratuvar" },
            { title: "Compton Saçılması", url: "compton.html", type: "İleri Analiz" }
        ],
        questions: [
            "Fotoelektrik etkide kopan elektronların maksimum kinetik enerjisi ışığın nesine bağlıdır?",
            "Compton saçılmasında saçılan fotonun enerjisi, gelen fotona göre nasıldır?",
            "Maddenin de dalga gibi davrandığını öne süren De Broglie dalga boyu denklemi nedir?"
        ]
    },
    {
        id: "temel-kuantum",
        title: "Temel Kuantum Mekaniği",
        summary: "Dalga fonksiyonları, belirsizlik ilkesi ve Schrödinger denklemi ile modern dünyanın olasılık teorilerine girin.",
        duration: "6 Saat",
        difficulty: "Zor",
        goal: "Kuantum mekaniğinin matematiksel temelini, olasılık yorumunu ve tünelleme gibi kuantum olaylarını kavramak.",
        simCount: 1,
        intro: "Elektronların ve diğer temel parçacıkların kesin yörüngeleri yoktur. Bu derste, parçacıkların davranışını bir 'olasılık dalgası' olarak tanımlayan dalga fonksiyonlarını öğreniyoruz. Schrödinger denklemini basit sistemlere uygulayarak, klasik fizikte imkansız olan 'kuantum tünelleme' gibi kavramları keşfedeceksiniz.",
        objectives: [
            "Dalga fonksiyonunun karesinin olasılık yoğunluğunu verdiğini anlamak (Born yorumu).",
            "Heisenberg Belirsizlik İlkesini konum ve momentum eşleniğinde uygulayabilmek.",
            "Bir boyutlu potansiyel kuyusunda sıkışmış parçacığın enerji seviyelerini hesaplayabilmek."
        ],
        modules: [
            "Modül 1: Dalga Fonksiyonları ve Olasılık (OpenStax 7.1)",
            "Modül 2: Heisenberg Belirsizlik İlkesi (OpenStax 7.2)",
            "Modül 3: Schrödinger Denklemi (OpenStax 7.3)",
            "Modül 4: Kutudaki Parçacık ve Kuantum Tünelleme (OpenStax 7.4 - 7.6)"
        ],
        simulations: [
            { title: "Stern-Gerlach Deneyi", url: "#", type: "Düşünce Deneyi (Yapım Aşamasında)" }
        ],
        questions: [
            "Bir dalga fonksiyonunun uzay üzerinden integrali neden 1'e eşit olmalıdır?",
            "Belirsizlik ilkesine göre bir parçacığın konumu çok kesin ölçülürse momentumuna ne olur?",
            "Kuantum tünelleme nedir ve güneşin parlamasında nasıl bir rol oynar?"
        ]
    },
    {
        id: "atom-yapisi",
        title: "Atom Yapısı ve Spektrumlar",
        summary: "Bohr modelinden modern kuantum modeline hidrojen atomunu ve spektroskopik analizleri keşfedin.",
        duration: "5 Saat",
        difficulty: "Orta",
        goal: "Atomun Bohr modelini anlamak ve atomik emisyon spektrumlarının oluşum mantığını çözmek.",
        simCount: 2,
        intro: "Bir elementi diğerinden nasıl ayırt ederiz? Atomik spektrumlar evrenin barkodları gibidir. Bu ders, Rutherford'un çekirdeği bulmasıyla başlayan, Bohr'un yörüngeleriyle gelişen ve modern fizikte spini içeren kuantum modeliyle sonlanan atomik teorinin haritasını çıkarıyor.",
        objectives: [
            "Bohr modelinin temel varsayımlarını ve hidrojen enerji seviyelerini açıklayabilmek.",
            "Atomların farklı ışık dalga boylarını nasıl soğurup yaydığını hesaplayabilmek.",
            "Elektron spini kavramını ve Pauli Dışlama İlkesi'ni atomik dizilime uygulayabilmek."
        ],
        modules: [
            "Modül 1: Bohr'un Hidrojen Atomu Modeli (OpenStax 6.4)",
            "Modül 2: Modern Hidrojen Atomu Modeli (OpenStax 8.1)",
            "Modül 3: Elektron Spini (OpenStax 8.3)",
            "Modül 4: Atomik Spektrumlar, X-Işınları ve Lazerler (OpenStax 8.5 - 8.6)"
        ],
        simulations: [
            { title: "Rutherford Atom Modeli", url: "rutherford.html", type: "Tarihsel Deney" },
            { title: "Frank-Hertz Deneyi", url: "frank_hertz.html", type: "Analiz" }
        ],
        questions: [
            "Bohr atom modeline göre elektron yörüngeleri neden rastgele olamaz?",
            "Elektron spini hangi ünlü deneyle ilk defa açıkça ispatlanmıştır?",
            "Lazer ışınını, sıradan lamba ışığından ayıran temel özellik nedir?"
        ]
    },
    {
        id: "nukleer-fizige-baslangic",
        title: "Nükleer Fiziğe Başlangıç",
        summary: "Güçlü nükleer kuvvet, radyoaktivite, fisyon ve füzyon reaksiyonlarıyla maddenin kalbine inin.",
        duration: "4 Saat",
        difficulty: "İleri",
        goal: "Atom çekirdeğinin yapısını, bağ enerjisini ve radyoaktif süreçlerin fiziğini analitik olarak kavramak.",
        simCount: 2,
        intro: "Maddenin en uç ve en enerjik noktasına, atom çekirdeğine yolculuk. Güçlü nükleer kuvvet, aynı yüke sahip protonları birbirine nasıl bağlar? Neden bazı izotoplar saniyeler içinde yok olurken bazıları milyarlarca yıl kararlı kalır? Fisyon ve füzyon reaksiyonlarının arkasındaki kütle-enerji eşdeğerliliği bu derste incelenecektir.",
        objectives: [
            "İzotop kavramını açıklayarak kütle eksilmesi ve bağlanma enerjisini hesaplayabilmek.",
            "Alfa, beta ve gama bozunma mekanizmalarını ayırt edebilmek.",
            "Yarı ömür denklemlerini kullanarak radyoaktif tarihleme yapabilmek."
        ],
        modules: [
            "Modül 1: Çekirdeğin Özellikleri (OpenStax 10.1)",
            "Modül 2: Radyoaktif Bozunma ve Yarı Ömür (OpenStax 10.3)",
            "Modül 3: Nükleer Reaksiyonlar (OpenStax 10.4)",
            "Modül 4: Fisyon ve Fizyolojik Etkiler (OpenStax 10.5)"
        ],
        simulations: [
            { title: "Rutherford Atom Modeli", url: "rutherford.html", type: "Pratik" },
            { title: "Yarı Ömür ve Radyoaktif Bozunma", url: "#", type: "Simülasyon (Yapım Aşamasında)" }
        ],
        questions: [
            "Demir-56 izotopu nükleer fizik açısından neden evrendeki en 'kararlı' element kabul edilir?",
            "Alfa bozunması yapan bir çekirdeğin kütle numarası nasıl değişir?",
            "Nükleer fisyon zincirleme reaksiyonu hangi koşullarda devamlılık sağlar?"
        ]
    }
];
