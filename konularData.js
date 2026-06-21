const topicsData = [
    {
        id: "optik",
        title: "Optik",
        icon: "visibility",
        description: "Işığın doğası, yansıma, kırılma, girişim ve optik aletlerin çalışma prensipleri.",
        simCount: 9,
        level: "Lise / Lisans",
        intro: "Optik, ışığın davranışını ve maddeyle etkileşimini inceleyen temel fizik dalıdır. OpenStax University Physics Volume 3 kapsamındaki bu bölümde, ışığın hem geometrik optik kurallarına (ışın modeli) hem de dalga optiği özelliklerine (girişim ve kırınım) odaklanılır. Aynalar, mercekler ve mikroskop gibi modern optik enstrümanların temelleri de bu disipline dayanır.",
        subTopics: [
            "1.1 Işığın Yayılması (The Propagation of Light)",
            "1.2 Yansıma Yasası (The Law of Reflection)",
            "1.3 Kırılma (Refraction)",
            "1.4 Tam İç Yansıma (Total Internal Reflection)",
            "1.7 Polarizasyon (Polarization)",
            "2.1 Düzlem Aynalarda Görüntü Oluşumu (Images Formed by Plane Mirrors)",
            "2.4 İnce Mercekler (Thin Lenses)",
            "3.1 Young'ın Çift Yarıkta Girişim Deneyi (Young's Double-Slit Interference)",
            "4.1 Tek Yarıkta Kırınım (Single-Slit Diffraction)"
        ],
        recommendedStart: {
            title: "Fermat Prensibi ve Snell Yasası",
            url: "202_sinif_deneyleri.html",
            desc: "Işığın yansıma ve kırılma yasalarını en kısa zaman prensibiyle keşfedin."
        },
        nextStep: {
            title: "İnce Mercek Simülatörü",
            url: "lens_sim.html",
            desc: "Kırılmanın pratikte nasıl görüntüler oluşturduğunu inceleyin."
        },
        simulations: [
            { title: "Fermat Prensibi ve Snell Yasası", url: "202_sinif_deneyleri.html", type: "Optik", diff: "Orta" },
            { title: "Kırılma ve Görünür Derinlik", url: "refraction.html", type: "Optik", diff: "Orta" },
            { title: "Ayna Laboratuvarı", url: "mirror_lab.html", type: "Optik", diff: "Orta" },
            { title: "İnce Mercek Simülatörü", url: "lens_sim.html", type: "Optik", diff: "Orta" },
            { title: "Mercek Yapıcı Denklemi", url: "lens_maker.html", type: "Optik", diff: "Zor" },
            { title: "Tek ve Çift Yarıkta Kırınım", url: "diffraction.html", type: "Optik", diff: "Orta" },
            { title: "Malus Yasası ve Polarizasyon", url: "malus.html", type: "Optik", diff: "Orta" },
            { title: "Stokes Parametreleri", url: "stokes.html", type: "Optik", diff: "İleri Seviye" },
            { title: "Michelson-Morley Deneyi", url: "michelson_morley.html", type: "Optik", diff: "İleri Seviye" }
        ]
    },
    {
        id: "gorelilik",
        title: "Görelilik",
        icon: "hourglass_empty",
        description: "Zaman genişlemesi, uzunluk büzülmesi ve fizik yasalarının değişmezliği.",
        simCount: 2,
        level: "Lisans",
        intro: "Einstein'ın Özel Görelilik kuramı, uzay ve zaman kavramlarımıza dair klasik algımızı tamamen değiştirmiştir. Işık hızının tüm eylemsiz referans sistemlerinde sabit kalması ilkesine dayanan bu teori, yüksek hızlarda zamanın daha yavaş akması (zaman genişlemesi) ve uzunlukların kısalması gibi çarpıcı sonuçlar doğurur.",
        subTopics: [
            "5.1 Fizik Yasalarının Değişmezliği (Invariance of Physical Laws)",
            "5.2 Görelilikte Eşzamanlılık (Relativity of Simultaneity)",
            "5.3 Zaman Genişlemesi (Time Dilation)",
            "5.4 Uzunluk Büzülmesi (Length Contraction)",
            "5.5 Lorentz Dönüşümleri (The Lorentz Transformation)"
        ],
        recommendedStart: {
            title: "Michelson-Morley Deneyi",
            url: "michelson_morley.html",
            desc: "Esir maddesinin var olmadığını ve ışık hızının mutlaklığını gösteren o meşhur deneyi test edin."
        },
        nextStep: {
            title: "İkizler Paradoksu",
            url: "#",
            desc: "Zaman genişlemesinin paradoksal sonuçlarını inceleyin. (Yapım Aşamasında)"
        },
        simulations: [
            { title: "Michelson-Morley Deneyi", url: "michelson_morley.html", type: "Görelilik", diff: "İleri Seviye" },
            { title: "Özel Görelilik: İkizler Paradoksu", url: "#", type: "Görelilik", diff: "Zor (Yapım Aşamasında)" }
        ]
    },
    {
        id: "kuantum",
        title: "Kuantum Mekaniği",
        icon: "scatter_plot",
        description: "Işığın tanecikli yapısı, dalga-parçacık ikiliği ve olasılık kuramları.",
        simCount: 3,
        level: "Lisans",
        intro: "Kuantum Mekaniği, mikroskobik dünyanın sezgilerimize aykırı yasalarını tanımlar. Klasik fiziğin açıklayamadığı kara cisim ışıması ve fotoelektrik etki gibi olaylar, enerjinin kesikli (kuantize) olduğu fikrini doğurmuştur. Parçacıkların aynı zamanda dalga karakteri göstermesi, Heisenberg'in Belirsizlik İlkesi ve Schrödinger denklemi bu konunun omurgasını oluşturur.",
        subTopics: [
            "6.1 Kara Cisim Işıması (Blackbody Radiation)",
            "6.2 Fotoelektrik Etki (Photoelectric Effect)",
            "6.3 Compton Etkisi (The Compton Effect)",
            "6.5 De Broglie Madde Dalgaları (De Broglie’s Matter Waves)",
            "7.2 Heisenberg Belirsizlik İlkesi (The Heisenberg Uncertainty Principle)",
            "7.3 Schrödinger Denklemi (The Schrödinger Equation)"
        ],
        recommendedStart: {
            title: "Fotoelektrik Etki",
            url: "photoelectric.html",
            desc: "Işığın enerjisinin tanecikler (fotonlar) halinde taşındığını keşfedin."
        },
        nextStep: {
            title: "Compton Saçılması",
            url: "compton.html",
            desc: "Fotonların elektronlara çarparak momentum aktardığı bu deneyi inceleyin."
        },
        simulations: [
            { title: "Fotoelektrik Etki", url: "photoelectric.html", type: "Kuantum Mekaniği", diff: "Orta" },
            { title: "Compton Saçılması", url: "compton.html", type: "Kuantum Mekaniği", diff: "Zor" },
            { title: "Stern-Gerlach Deneyi", url: "#", type: "Kuantum Mekaniği", diff: "İleri Seviye (Yapım Aşamasında)" }
        ]
    },
    {
        id: "atom",
        title: "Atom Fiziği",
        icon: "electric_bolt",
        description: "Bohr modeli, atomik spektrumlar, elektron spini ve enerji seviyeleri.",
        simCount: 3,
        level: "Lise / Lisans",
        intro: "Atom Fiziği, atomun yapısını, elektronların dizilimini ve atomların ışıkla etkileşimini (spektrumları) inceler. Rutherford'un çekirdek modelinden başlayarak Bohr'un kuantize yörüngelerine ve oradan modern hidrojen atomu modeline uzanan bu bölüm, lazerlerin ve X-ışınlarının çalışma mantığını açıklar.",
        subTopics: [
            "6.4 Bohr'un Hidrojen Atomu Modeli (Bohr’s Model of the Hydrogen Atom)",
            "8.1 Hidrojen Atomu (The Hydrogen Atom)",
            "8.3 Elektron Spini (Electron Spin)",
            "8.5 Atomik Spektrumlar ve X-ışınları (Atomic Spectra and X-rays)",
            "8.6 Lazerler (Lasers)"
        ],
        recommendedStart: {
            title: "Rutherford Atom Modeli",
            url: "rutherford.html",
            desc: "Atomun çoğunun boşluk olduğunu gösteren efsanevi saçılma deneyini yapın."
        },
        nextStep: {
            title: "Frank-Hertz Deneyi",
            url: "frank_hertz.html",
            desc: "Atomların iç enerji seviyelerinin kesikli (kuantize) olduğunu kanıtlayın."
        },
        simulations: [
            { title: "Rutherford Atom Modeli", url: "rutherford.html", type: "Atom Fiziği", diff: "Orta" },
            { title: "Frank-Hertz Deneyi", url: "frank_hertz.html", type: "Atom Fiziği", diff: "Zor" },
            { title: "Millikan Yağ Damlası", url: "millikan.html", type: "Atom Fiziği", diff: "Orta" }
        ]
    },
    {
        id: "nukleer",
        title: "Nükleer Fizik",
        icon: "radar",
        description: "Çekirdeğin yapısı, radyoaktif bozunma, fisyon ve nükleer reaksiyonlar.",
        simCount: 2,
        level: "Lisans",
        intro: "Nükleer Fizik, maddenin en yoğun ve en yüksek enerjili kısmına, atom çekirdeğine odaklanır. Çekirdeği bir arada tutan güçlü nükleer kuvvet, kararsız çekirdeklerin radyoaktif olarak bozunmasına neden olan süreçler ve devasa enerji salınımı sağlayan fisyon / füzyon reaksiyonları bu alanın temel taşlarıdır.",
        subTopics: [
            "10.1 Çekirdeğin Özellikleri (Properties of Nuclei)",
            "10.3 Radyoaktif Bozunma (Radioactive Decay)",
            "10.4 Nükleer Reaksiyonlar (Nuclear Reactions)",
            "10.5 Fisyon (Fission)",
            "10.6 Füzyon (Fusion)"
        ],
        recommendedStart: {
            title: "Rutherford Atom Modeli",
            url: "rutherford.html",
            desc: "Büyük ve ağır çekirdeklerin elektriksel itme gücünü gözlemleyin."
        },
        nextStep: {
            title: "Yarı Ömür ve Radyoaktif Bozunma",
            url: "yari_omur.html",
            desc: "Kararsız izotopların zaman içindeki azalma olasılıklarını inceleyin."
        },
        simulations: [
            { title: "Rutherford Atom Modeli", url: "rutherford.html", type: "Nükleer Fizik", diff: "Orta" },
            { title: "Yarı Ömür ve Radyoaktif Bozunma", url: "yari_omur.html", type: "Nükleer Fizik", diff: "Orta" }
        ]
    },
    {
        id: "parcacik",
        title: "Parçacık Fiziği ve Kozmoloji",
        icon: "blur_on",
        description: "Temel parçacıklar, korunum yasaları ve evrenin başlangıcı.",
        simCount: 0,
        level: "İleri Seviye",
        intro: "Standart Model'in temel yapı taşları olan kuarklar ve leptonlar, kuvvet taşıyıcı bozonlar ve evrenin genişlemesine dair modeller bu bölümde işlenir. En küçük yapı taşlarının (Parçacık Fiziği), en büyük yapının (Kozmoloji) evrimiyle nasıl iç içe geçtiğini anlamamızı sağlar.",
        subTopics: [
            "11.1 Parçacık Fiziğine Giriş (Introduction to Particle Physics)",
            "11.2 Parçacık Hızlandırıcıları (Particle Accelerators and Detectors)",
            "11.3 Standart Model (The Standard Model)",
            "11.4 Büyük Patlama (The Big Bang)",
            "11.5 Erken Evrenin Evrimi (Evolution of the Early Universe)"
        ],
        recommendedStart: null,
        nextStep: null,
        simulations: []
    }
];
