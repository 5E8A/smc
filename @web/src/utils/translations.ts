export type Language = "en" | "pl";

export const translations = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      download: "Download Pack",
      archive: "News",
      wiki: "Wiki",
    },
    common: {
      back: "Back",
      language: "Language",
    },
    meta: {
      title: "SMC - Seba Modding Community",
      description: "Official blog for the Fabric Boosted modpack by 5E8A. News, updates, and optimization guides.",
    },
    hero: {
      tag_prefix: "Version",
      tag_suffix: "Now Available for MC",
      achievement_title: "Achievement Get!",
      title_prefix: "FABRIC",
      title_accent: "BOOSTED",
      description:
        "The ultimate optimization & quality-of-life modpack. Built for flawless performance, whether you're playing vanilla singleplayer or multiplayer servers.",
      read_updates: "Read Updates",
      wiki: "Wiki & Docs",
    },
    features: {
      fabric_title: "Fabric Core",
      fabric_desc: "Built on the lightweight Fabric loader for lightning-fast startup times and instant compatibility.",
      sodium_title: "Sodium Powered",
      sodium_desc: "Replaces the rendering engine to deliver consistent 144+ FPS on modern hardware.",
      memory_title: "Quality of Life",
      memory_desc: "Adds most useful QoL mods to enhance gameplay.",
    },
    mods: {
      title: "WHAT'S INSIDE",
      subtitle: "The mods that power Fabric Boosted",
      performance: "Performance",
      optifine: "OptiFine Features",
      qol: "Quality of Life",
      utility: "Utility",
    },
    latest: {
      title: "LATEST LOGS",
      subtitle: "Updates from the developer",
      view_archive: "View Archive",
      read_article: "Read Article",
    },
    archive: {
      title: "ARCHIVE",
      subtitle: "Browse all past updates, guides, and community news.",
      search_placeholder: "Search articles...",
    },
    wiki: {
      title: "DOCUMENTATION",
      subtitle: "Official guides, modpack details, and installation instructions.",
      search_placeholder: "Search documentation...",
      read_doc: "Read Guide",
    },
    about_page: {
      title: "About The Project",
      subtitle: "The philosophy behind Fabric Boosted.",
      mission_title: "Our Mission",
      mission_text:
        "Fabric Boosted was created with goal to provide the smoothest Minecraft experience with best Quality of Life mods. We believe that everyone should be able to enjoy Minecraft at high framerates and improved vanilla gameplay using QoL mods.",
      creator_title: "The Creator",
      creator_text:
        "5E8A is a passionate Minecraft modder and optimization enthusiast. After years of gaining knowledge with optimization, he decided to create the ultimate Fabric Modpack.",
      stats_downloads: "Downloads",
      stats_users: "Community Members",
      stats_version: "Current Version",
    },
    footer: {
      desc: "The home of high-performance Minecraft modding.",
      resources: "Resources",
      connect: "Connect",
      copyright: "SMC",
      copyrightName: "Seba Modding Community",
      rights: "NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.",
      made_with: "Developed by logy",
      credits: "Credits",
    },
    credits: {
      title: "CREDITS & LEGAL",
      subtitle: "Who made what, and the legal fine print.",
      disclaimer_title: "Disclaimer",
      disclaimer_text:
        "NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT. Minecraft is a trademark of Mojang AB and Microsoft Corporation.",
      assets_title: "Minecraft Assets",
      assets_text:
        "The block textures (dark prismarine, deepslate, warped wart block, sculk, bedrock), the toast texture and the grass block icon are (c) Mojang AB / Microsoft Corporation. They are sourced from the vanilla Minecraft assets via the open-source PrismarineJS/minecraft-assets repository and used under the Minecraft Usage Guidelines.",
      wallpaper_title: "Background Artwork",
      wallpaper_text:
        "The homepage background artwork was sourced from a free wallpaper site ([Wallpaper Alchemy](https://www.wallpaperalchemy.com/wallpaper/minecraft-mountain-sunset-valley-wallpaper-4k-1702)). All rights belong to its original creator - if this is your work, contact us to add credit or remove it.",
      fonts_title: "Fonts",
      fonts_text:
        "Inter - (c) 2016 The Inter Project Authors. VT323 - (c) 2011 The VT323 Project Authors. Both are licensed under the SIL Open Font License 1.1 ([openfontlicense.org](https://openfontlicense.org)) and are used unmodified. Full license texts ship with the font files.",
      operator_title: "Site Operator",
      operator_text: "SMC - Seba Modding Community is operated by 5E8A. Contact: GitHub / Discord.",
      affiliate_title: "Affiliate Disclosure",
      affiliate_text:
        "The hosting banner on the homepage is an affiliate link to Sparked Host. We may earn a commission at no extra cost to you.",
    },
    not_found: {
      title: "Page Not Found",
      description: "The page you're looking for doesn't exist or has been moved.",
      back_home: "Back to Home",
    },
    error_fallback: {
      title: "Something went wrong",
      description: "An unexpected error occurred while rendering this page.",
      reload: "Reload",
      home: "Home",
    },
    unavailable: {
      title: "Not available in English yet",
      description: "This content hasn't been translated into English, but you can read it in Polish.",
      read_in: "Read it in Polish",
      back_to_archive: "Back to Archive",
    },
    open_app: {
      title: "Opening Modrinth App",
      description_before: "If you don't have the Modrinth App, ",
      description_link: "install it here",
      description_after: ", or open in browser using the link below.",
      fallback_link: "Open in browser",
    },
    lightbox: {
      label: "Image viewer",
      open: "Open fullscreen",
      close: "Close",
      prev: "Previous image",
      next: "Next image",
    },
    media: {
      play: "Play animation",
      stop: "Stop animation",
    },
  },
  pl: {
    nav: {
      home: "Strona Główna",
      about: "O Nas",
      download: "Pobierz",
      archive: "Archiwum",
      wiki: "Wiki",
    },
    common: {
      back: "Wstecz",
      language: "Język",
    },
    meta: {
      title: "SMC - Seba Modding Community",
      description:
        "Oficjalny blog paczki modów Fabric Boosted od 5E8A. Aktualności, poradniki i przewodniki optymalizacyjne.",
    },
    hero: {
      tag_prefix: "Wersja",
      tag_suffix: "Już Dostępna na wersję MC",
      achievement_title: "Osiągnięcie zdobyte!",
      title_prefix: "FABRIC",
      title_accent: "BOOSTED",
      description:
        "Doświadcz Minecrafta jak nigdy dotąd dzięki ostatecznej paczce optymalizacyjnej. Wysokie FPS, niskie opóźnienia i płynna rozgrywka.",
      read_updates: "Czytaj Aktualności",
      wiki: "Wiki i Dokumentacja",
    },
    features: {
      fabric_title: "Rdzeń Fabric",
      fabric_desc: "Oparte na lekkim silniku Fabric dla błyskawicznego uruchamiania i natychmiastowej kompatybilności.",
      sodium_title: "Moc Sodium",
      sodium_desc: "Wymienia silnik renderujący, aby zapewnić stałe 144+ FPS na nowoczesnym sprzęcie.",
      memory_title: "Wydajność Pamięci",
      memory_desc:
        "Zaawansowane dostrajanie Garbage Collection oznacza, że możesz grać komfortowo z mniejszą ilością RAM.",
    },
    mods: {
      title: "CO ZAWIERA",
      subtitle: "Mody napędzające Fabric Boosted",
      performance: "Wydajność",
      optifine: "Funkcje OptiFine",
      qol: "Jakość Życia",
      utility: "Narzędzia",
    },
    latest: {
      title: "OSTATNIE LOGI",
      subtitle: "Aktualizacje od dewelopera",
      view_archive: "Zobacz Archiwum",
      read_article: "Czytaj Artykuł",
    },
    archive: {
      title: "ARCHIWUM",
      subtitle: "Przeglądaj wszystkie poprzednie aktualizacje, poradniki i wieści.",
      search_placeholder: "Szukaj artykułów...",
    },
    wiki: {
      title: "DOKUMENTACJA",
      subtitle: "Oficjalne poradniki, szczegóły paczki i instrukcje instalacji.",
      search_placeholder: "Szukaj w dokumentacji...",
      read_doc: "Czytaj Poradnik",
    },
    about_page: {
      title: "O Projekcie",
      subtitle: "Filozofia stojąca za Fabric Boosted.",
      mission_title: "Nasza Misja",
      mission_text:
        "Fabric Boosted powstało z jednym celem: zapewnić jak najpłynniejszą rozgrywkę w Minecraft bez kompromisów w jakości wizualnej. Wierzymy, że każdy powinien móc cieszyć się grą przy wysokiej liczbie klatek na sekundę, niezależnie od specyfikacji sprzętowej.",
      creator_title: "Twórca",
      creator_text:
        "5E8A to pasjonat moddingu Minecraft i entuzjasta optymalizacji. Po latach zmagań z optymalizacją, postanowił stworzyć ostateczną paczkę wydajnościową.",
      stats_downloads: "Pobrań",
      stats_users: "Członków Społeczności",
      stats_version: "Obecna Wersja",
    },
    footer: {
      desc: "Dom wysokowydajnego moddingu Minecraft.",
      resources: "Zasoby",
      connect: "Kontakt",
      copyright: "SMC",
      copyrightName: "Seba Modding Community",
      rights: "TO NIE JEST OFICJALNY PRODUKT MINECRAFT. NIE ZATWIERDZONY ANI NIE POWIĄZANY Z MOJANG LUB MICROSOFT.",
      made_with: "Stworzone przez logy",
      credits: "Credits",
    },
    credits: {
      title: "CREDITS I PRAWA",
      subtitle: "Kto co stworzył i drobny druk.",
      disclaimer_title: "Zastrzeżenie",
      disclaimer_text:
        "TO NIE JEST OFICJALNY PRODUKT MINECRAFT. NIE ZATWIERDZONY ANI NIE POWIĄZANY Z MOJANG LUB MICROSOFT. Minecraft jest znakiem towarowym Mojang AB i Microsoft Corporation.",
      assets_title: "Zasoby Minecraft",
      assets_text:
        "Tekstury bloków (ciemny pryzmaryn, deepslate, blok warped wart, sculk, bedrock), tekstura toastu oraz ikona trawy są (c) Mojang AB / Microsoft Corporation. Pochodzą z oryginalnych zasobów Minecraft za pośrednictwem open-source'owego repozytorium PrismarineJS/minecraft-assets i są używane zgodnie z Zasadami Użytkowania Minecraft.",
      wallpaper_title: "Grafika w Tle",
      wallpaper_text:
        "Grafika tła strony głównej pochodzi z darmowej strony z tapetami ([Wallpaper Alchemy](https://www.wallpaperalchemy.com/wallpaper/minecraft-mountain-sunset-valley-wallpaper-4k-1702)). Wszelkie prawa należą do jej oryginalnego twórcy - jeśli jest to Twoja praca, skontaktuj się z nami, aby dodać podziękowanie lub usunąć grafikę.",
      fonts_title: "Czcionki",
      fonts_text:
        "Inter - (c) 2016 The Inter Project Authors. VT323 - (c) 2011 The VT323 Project Authors. Obie są licencjonowane na SIL Open Font License 1.1 ([openfontlicense.org](https://openfontlicense.org)) i używane bez modyfikacji. Pełne teksty licencji znajdują się przy plikach czcionek.",
      operator_title: "Operator Strony",
      operator_text: "SMC - Seba Modding Community jest prowadzone przez 5E8A. Kontakt: GitHub / Discord.",
      affiliate_title: "Informacja o Afiliacji",
      affiliate_text:
        "Baner hostingowy na stronie głównej to link partnerski do Sparked Host. Możemy otrzymać prowizję bez dodatkowych kosztów dla Ciebie.",
    },
    not_found: {
      title: "Nie Znaleziono Strony",
      description: "Strona, której szukasz, nie istnieje lub została przeniesiona.",
      back_home: "Wróć na Stronę Główną",
    },
    error_fallback: {
      title: "Coś poszło nie tak",
      description: "Wystąpił nieoczekiwany błąd podczas renderowania tej strony.",
      reload: "Odśwież",
      home: "Strona Główna",
    },
    unavailable: {
      title: "Nie ma tego jeszcze po polsku",
      description: "Ta treść nie została jeszcze przetłumaczona na język polski, możesz przeczytać ją po angielsku.",
      read_in: "Przeczytaj po angielsku",
      back_to_archive: "Wróć do archiwum",
    },
    open_app: {
      title: "Otwieranie Modrinth App",
      description_before: "Jeśli nie masz Modrinth App, ",
      description_link: "zainstaluj tutaj",
      description_after: ", lub otwórz w przeglądarce za pomocą poniższego przycisku.",
      fallback_link: "Otwórz w przeglądarce",
    },
    lightbox: {
      label: "Przeglądarka obrazów",
      open: "Otwórz pełny ekran",
      close: "Zamknij",
      prev: "Poprzedni obraz",
      next: "Następny obraz",
    },
    media: {
      play: "Odtwórz animację",
      stop: "Zatrzymaj animację",
    },
  },
};
