## :CpuIcon: Przydzielanie większej ilości RAM

> **Note:** Od lipca 2026 aplikacja Modrinth domyślnie przydziela 6 GB pamięci RAM, co w zupełności wystarcza do płynnego działania Fabric Boosted. Jeśli potrzebujesz przydzielić więcej pamięci na wymagające shadery lub duży dystans renderowania, wykonaj poniższe szybkie kroki.


Aby to zrobić w aplikacji Modrinth, otwórz instancję Fabric Boosted, przejdź do Ustawienia instancji > Sync overrides, przewiń w dół do sekcji `Przypisana pamięć`, włącz przełącznik i ustaw pożądaną ilość pamięci RAM.

| RAM | MB      |
| --- | ------- |
| 2GB | 2048 MB |
| 4GB | 4096 MB |
| 6GB | 6144 MB |
| 8GB | 8192 MB |

## :TelevisionIcon: Ustawienia Wideo

- **Render Distance** - Domyślnie ustawione na 12 chunków, możesz je zmniejszyć dla lepszej wydajności.
- **Simulation Distance** - Domyślnie ustawione na 12 chunków, możesz je zmniejszyć dla lepszej wydajności.
- **Graphics** - Ustawione na Fast dla optymalnej wydajności.
- **Smooth Lighting** - Wyłączone.
- **Particles** - Ustawione na Decreased, możesz zmienić na Minimal dla lepszej wydajności.
- **Clouds** - Wyłączone.
- **Entity Distance** - Ustawione na 100%
- **V-Sync** - Wyłączone.
- **Entity Shadows** - Wyłączone.
- **Leaves** - Ustawione na Fast.
- **Weather** - Ustawione na Fast.

## :ImageIcon: Mod Nvidium

Jeśli posiadasz kartę graficzną NVIDIA (seria 16 lub nowsza), Nvidium utrzyma więcej chunków w pamięci GPU, poprawiając wrażenia podczas poruszania się po świecie bez utraty wydajności.

Ustawienia Nvidium znajdują się w Video Settings > Nvidium. Domyślnie ustawione na 256 chunków, możesz to zmniejszyć lub całkowicie wyłączyć.

## :ScissorsIcon: Mod More Culling

More Culling poprawia wydajność, nie renderując obiektów, które nie są widoczne dla gracza, takich jak te zasłonięte przez inne obiekty.

Ustawienia More Culling znajdują się w Video Settings > More Culling.

## :WrenchIcon: Inne Mody Wydajnościowe

Fabric Boosted zawiera kilka modów zwiększających wydajność, takich jak:

- [Lithium](https://modrinth.com/mod/lithium) - Optymalizacja fizyki gry i AI mobów
- [FerriteCore](https://modrinth.com/mod/ferrite-core) - Zmniejsza zużycie RAM
- [Entity Culling](https://modrinth.com/mod/entityculling) - Przestaje renderować niewidoczne jednostki
- [ImmediatelyFast](https://modrinth.com/mod/immediatelyfast) - Poprawia wydajność renderowania w trybie natychmiastowym
- [ScalableLux](https://modrinth.com/mod/scalablelux) - Poprawia wydajność aktualizacji światła
- [Krypton](https://modrinth.com/mod/krypton) - Optymalizuje stos sieciowy
- [ModernFix](https://modrinth.com/mod/modernfix) - Poprawia wydajność, zmniejsza zużycie pamięci i naprawia wiele błędów
- [Very Many Players](https://modrinth.com/mod/vmp-fabric) - Poprawia wydajność gry przy dużej liczbie graczy
- [Concurrent Chunk Management Engine](https://modrinth.com/mod/c2me-fabric) - Poprawia wydajność chunków
- [Fast Noise](https://modrinth.com/mod/zfastnoise) - Optymalizuje wydajność generowania świata
- [BadOptimizations](https://modrinth.com/mod/badoptimizations) - Kolekcja głównie mikro-optymalizacji
- [Better Block Entities](https://modrinth.com/mod/better-block-entities) - Poprawia wydajność renderowania skrzynek, tabliczek, łóżek itp.

Te mody działają w tle, aby optymalizować różne aspekty gry, zapewniając płynniejsze działanie bez konieczności dodatkowej konfiguracji.
