import re

def process():
    with open("f:\\PhysicaNova\\index.html", "r", encoding="utf-8") as f:
        content = f.read()

    # Look for cards structure
    card_pattern = re.compile(
        r'<div class="sim-card group.*?onclick="(.*?)".*?data-topic="(.*?)".*?data-level="(.*?)".*?data-title="(.*?)".*?'
        r'<div class="w-24 h-24.*?">(.*?)</div>\s*<div.*?<h3.*?>(.*?)</h3>\s*<p.*?>(.*?)</p>.*?'
        r'Difficulty Level.*?<span.*?>(.*?)</span>.*?'
        r'<div class="flex flex-col items-end gap-1">\s*<span.*?>(.*?)</span>',
        re.DOTALL
    )

    cards = card_pattern.findall(content)

    new_cards_html = ""
    for c in cards:
        onclick, topic, level, title, media, title_inner, desc, diff, duration_span = c
        
        # determine media (img or icon)
        # remove inner absolute divs from images if any
        media = re.sub(r'<div class="absolute inset-0 bg-primary/10"></div>', '', media).strip()
        # duration block extraction
        if 'Duration:' in duration_span:
            duration = re.search(r'Duration:\s*<span[^>]*>(.*?)</span>', duration_span).group(1)
        else:
            duration = "In Progress"
        
        # Generate new card matching stitchkod
        new_card = f"""
        <div class="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer sim-card" onclick="{onclick}" data-topic="{topic}" data-level="{level}" data-title="{title}">
            <div class="h-40 bg-[#F1F3F5] flex items-center justify-center relative overflow-hidden border-b">
                {media}
            </div>
            <div class="p-4 flex flex-col h-[130px]">
                <h4 class="font-bold text-sm mb-2 text-[#1B4332] line-clamp-2">{title_inner}</h4>
                <div class="text-[11px] text-gray-500 mt-auto flex justify-between border-t pt-3">
                    <span class="font-medium">Difficulty: {diff}</span>
                    <span class="font-medium flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">schedule</span> {duration}</span>
                </div>
            </div>
        </div>
        """
        new_cards_html += new_card

    # Read JS code
    js_match = re.search(r'(<script>\s*document\.addEventListener\("DOMContentLoaded".*?</script>)', content, re.DOTALL)
    js_code = js_match.group(1) if js_match else ''

    template = """<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <style>
        body { background-color: #F8F9FA; color: #212529; font-family: 'Inter', sans-serif; }
        .sidebar { background-color: #F1F3F5; border-right: 1px solid #DEE2E6; }
        .hero-banner { background: linear-gradient(rgba(27, 67, 50, 0.05), rgba(27, 67, 50, 0.05)), url('assets/lab-bg.jpg'); background-size: cover; background-position: center; }
        .btn-primary { background-color: #1B4332; color: white; padding: 10px 24px; border-radius: 6px; }
        .btn-primary:hover { background-color: #2D6A4F; }
        .material-symbols-outlined { font-size: 48px; } /* for icons in cards */
    </style>
</head>
<body class="flex flex-col min-h-screen">
    <!-- Header -->
    <header class="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <a href="index.html" class="font-bold text-xl flex items-center gap-2">
            <span class="text-[#1B4332] flex items-center gap-1">
                <span class="material-symbols-outlined text-2xl !text-[24px]">science</span>
                PhysicaNova
            </span> | Modern Lab
        </a>
        <nav class="hidden md:flex gap-6 text-sm font-medium text-gray-600">
            <a href="index.html" class="hover:text-[#1B4332] text-[#1B4332] font-bold">Simulations</a>
            <a href="haberler.html" class="hover:text-[#1B4332]">Research</a>
            <a href="#" class="hover:text-[#1B4332]">Datasets</a>
            <a href="hakkimizda.html" class="hover:text-[#1B4332]">About</a>
        </nav>
        <div class="relative hidden sm:block">
            <input type="text" id="searchInput" placeholder="Search simulations..." class="bg-gray-100 px-4 pl-10 py-2 rounded-full text-sm border focus:outline-none focus:border-[#1B4332] w-64">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 !text-[18px]">search</span>
        </div>
    </header>

    <div class="flex flex-1 max-w-[1600px] w-full mx-auto">
        <!-- Sidebar -->
        <aside class="w-64 sidebar p-6 hidden lg:block sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
            <h3 class="font-bold text-sm mb-4 uppercase tracking-wider text-[#1B4332]">Explore Modules</h3>
            <ul class="space-y-4 text-sm" id="categoryList">
                <li class="font-semibold text-gray-700 cursor-pointer hover:text-[#1B4332]" data-filter="all">All Modules</li>
                <li class="font-semibold text-gray-700 mt-4 cursor-pointer hover:text-[#1B4332]" data-filter="Kuantum Mekaniği">Quantum Mechanics</li>
                <li class="font-semibold text-gray-700 mt-4 cursor-pointer hover:text-[#1B4332]" data-filter="Termodinamik">Thermodynamics</li>
                <li class="font-semibold text-gray-700 mt-4 cursor-pointer hover:text-[#1B4332]" data-filter="Optik">Optik</li>
                <li class="font-semibold text-gray-700 mt-4 cursor-pointer hover:text-[#1B4332]" data-filter="Görelilik">Görelilik</li>
                <li class="font-semibold text-gray-700 mt-4 cursor-pointer hover:text-[#1B4332]" data-filter="Atom Fiziği">Atom Fiziği</li>
                <li class="font-semibold text-gray-700 mt-4 cursor-pointer hover:text-[#1B4332]" data-filter="Nükleer Fizik">Nükleer Fizik</li>
            </ul>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 p-8 overflow-hidden">
            <!-- Hero Banner -->
            <section class="hero-banner rounded-xl p-12 mb-10 border border-[#DEE2E6] flex flex-col justify-center min-h-[300px] bg-white relative overflow-hidden">
                <div class="relative z-10 w-full md:w-2/3 bg-white/80 backdrop-blur-sm p-8 rounded-lg border border-white/40">
                    <h1 class="text-4xl font-bold text-[#1B4332] max-w-lg mb-4">
                        Advanced Physics Simulations for the Modern Laboratory
                    </h1>
                    <p class="text-gray-700 max-w-md mb-6 font-medium">Explore complex phenomena through interactive, data-driven models designed for academic research.</p>
                    <button onclick="document.getElementById('simGrid').scrollIntoView({behavior: 'smooth'})" class="btn-primary w-fit font-semibold shadow-sm">START EXPLORING</button>
                </div>
            </section>

            <!-- Grid Layout for Cards -->
            <h2 class="font-bold text-xl mb-6 text-[#1B4332]">Featured Simulations</h2>
            
            <div id="noResults" class="hidden text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                <span class="material-symbols-outlined text-4xl mb-2">search_off</span>
                <p>No simulations found matching your criteria.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6" id="simGrid">
                {cards_html}
            </div>
        </main>
    </div>

    <!-- Footer -->
    <footer class="bg-[#212529] text-white py-6 text-center text-xs w-full mt-auto">
        <p>© 2024 PhysicaNova. All rights reserved. Dedicated to advancing physics education.</p>
    </footer>

    {js_code}
</body>
</html>"""
    
    with open("f:\\PhysicaNova\\index.html", "w", encoding="utf-8") as f:
        f.write(template.replace("{cards_html}", new_cards_html).replace("{js_code}", js_code))
    
    print(f"Processed {len(cards)} cards successfully.")

if __name__ == "__main__":
    process()
