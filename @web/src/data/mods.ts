export interface ModData {
  title: string;
  slug: string;
  description: string;
}

export interface ModCategory {
  key: string;
  mods: ModData[];
}

export const modCategories: ModCategory[] = [
  {
    key: "performance",
    mods: [
      {
        title: "Sodium",
        slug: "sodium",
        description:
          "A high-performance rendering engine replacement for Minecraft, which greatly improves frame rates and reduces micro-stutter.",
      },
      {
        title: "Sodium Extra",
        slug: "sodium-extra",
        description: "A Sodium addon that adds features that shouldn't be in Sodium.",
      },
      {
        title: "Lithium",
        slug: "lithium",
        description:
          "No-compromises game logic optimization mod, useful for both single-player games and multi-player servers.",
      },
      { title: "FerriteCore", slug: "ferrite-core", description: "Memory usage optimizations" },
      { title: "Entity Culling", slug: "entity-culling", description: "Skip rendering of hidden entities" },
      {
        title: "More Culling",
        slug: "moreculling",
        description: "A mod that changes how multiple types of culling are handled in order to improve performance",
      },
      {
        title: "ImmediatelyFast",
        slug: "immediatelyfast",
        description: "Speed up immediate mode rendering in Minecraft",
      },
      { title: "Nvidium", slug: "nvidium", description: "Fast nvidia only rendering engine for sodium" },
      { title: "Krypton", slug: "krypton", description: "A mod to optimize the Minecraft networking stack" },
      {
        title: "ModernFix",
        slug: "modernfix",
        description:
          "All-in-one mod that improves performance, reduces memory usage, and fixes many bugs. Compatible with all your favorite performance mods!",
      },
      {
        title: "Very Many Players (Fabric)",
        slug: "vmp-fabric",
        description: "A Fabric mod designed to improve server performance at high playercounts.",
      },
      {
        title: "Concurrent Chunk Management Engine (Fabric)",
        slug: "c2me-fabric",
        description: "A Fabric mod designed to improve the chunk performance of Minecraft.",
      },
      { title: "Fast Noise", slug: "zfastnoise", description: "Vanilla Worldgen optimization mod" },
      {
        title: "BadOptimizations",
        slug: "badoptimizations",
        description: "Optimization mod that focuses on things other than rendering",
      },
      {
        title: "Better Block Entities",
        slug: "better-block-entities",
        description:
          "A Minecraft optimization mod for Fabric-Sodium that improves framerates by improving block entity rendering via a hybrid renderer",
      },
      {
        title: "ScalableLux",
        slug: "scalablelux",
        description: "A Fabric mod based on Starlight that improves the performance of light updates in Minecraft.",
      },
    ],
  },
  {
    key: "optifine",
    mods: [
      {
        title: "Continuity",
        slug: "continuity",
        description: "A Minecraft mod that allows for efficient connected textures",
      },
      { title: "Capes", slug: "capes", description: "Lets you use capes from OptiFine, LabyMod and other cape mods" },
      { title: "Zoomify (Zoom)", slug: "zoomify", description: "A zoom mod with infinite customizability." },
      {
        title: "[ETF] Entity Texture Features",
        slug: "entitytexturefeatures",
        description:
          "Emissive, Random & Custom texture support for entities in resourcepacks just like Optifine but for Fabric",
      },
      {
        title: "Animatica Refabricated",
        slug: "animaticarefabricated",
        description: "A fork of Animatica implementing the OptiFine/MCPatcher animated texture format.",
      },
      {
        title: "[EMF] Entity Model Features",
        slug: "entity-model-features",
        description: "EMF is an, OptiFine format, Custom Entity Model replacement mod available for Fabric and Forge.",
      },
      {
        title: "LambDynamicLights - Dynamic Lights",
        slug: "lambdynamiclights",
        description:
          "Adds dynamic lights to Minecraft as the most feature-complete and optimized dynamic lighting mod.",
      },
      {
        title: "OptiGUI",
        slug: "optigui",
        description:
          "Blazing fast custom GUI textures on Fabric and Quilt with built-in OptiFine custom GUI resource pack support",
      },
      {
        title: "Skyboxify",
        slug: "skyboxify",
        description: "A skybox mod that allows you to use OptiFine skies in Fabric 1.21+",
      },
      {
        title: "Iris Shaders",
        slug: "iris",
        description:
          "A modern shader pack loader for Minecraft intended to be compatible with existing OptiFine shader packs",
      },
      {
        title: "Polytone",
        slug: "polytone",
        description:
          "Customize Map Color, Block Colors, Colormaps and Block Sounds, Biome Colors, Dye Colors. Supports Optifine format. For Resource Packs",
      },
      {
        title: "BetterGrassify",
        slug: "bettergrassify",
        description:
          "Gamers can finally touch grass!?\n\nOptiFine's Fancy and Fast better grass implemented on Fabric and NeoForge!",
      },
    ],
  },
  {
    key: "qol",
    mods: [
      {
        title: "VoxelMap-Updated",
        slug: "voxelmap-updated",
        description:
          "Minimap and Worldmap. Have an overview of your surroundings, or view the entire world. Create waypoints.",
      },
      {
        title: "Shulker Box Tooltip",
        slug: "shulkerboxtooltip",
        description: "View the contents of shulker boxes from your inventory",
      },
      {
        title: "More Chat History",
        slug: "morechathistory",
        description: "Increases the maximum length of chat history.",
      },
      {
        title: "Gamma Utils (Fullbright)",
        slug: "gamma-utils",
        description:
          "Gamma / Brightness / Night Vision mod, making it easy to see in the dark. Basically Fullbright for Fabric and NeoForge.",
      },
      {
        title: "Talk Balloons",
        slug: "talk-balloons",
        description: "Add bubbles above players heads when they send a message in the chat.",
      },
      {
        title: "Durability Viewer Updated",
        slug: "durability-viewer-updated",
        description: "Armor and Tool durability HUD",
      },
      { title: "Ping View", slug: "ping-view", description: "Displays your and other players ping in the tab list." },
      { title: "Chat Heads", slug: "chat-heads", description: "See who you're chatting with!" },
      {
        title: "Remove Reloading Screen",
        slug: "rrls",
        description: "Makes resource packs load in the background, allowing you to do other things while waiting!",
      },
      {
        title: "Essential Mod",
        slug: "essential",
        description:
          "Enhance your Minecraft with one simple mod. Host worlds for free, chat with friends, and so much more!",
      },
      { title: "Just Enough Items (JEI)", slug: "jei", description: "View Items and Recipes" },
      { title: "No Chat Reports", slug: "no-chat-reports", description: "Makes chat unreportable (where possible)" },
      {
        title: "FastQuit",
        slug: "fastquit",
        description: "Lets you return to the Title Screen early while your world is still saving in the background!",
      },
      {
        title: "Don't Clear Chat History",
        slug: "dcch",
        description:
          "Simple one-mixin mod that doesn't clear the messages you've sent from up arrow on disconnect/relog.",
      },
      {
        title: "Litematica",
        slug: "litematica",
        description: "A client-side schematic mod with extra features for creative mode work",
      },
      {
        title: "Bobby",
        slug: "bobby",
        description: "Allows for render distances greater than the server's view-distance",
      },
      { title: "Health Indicator TXF", slug: "health-indicator-txf", description: "Health indicator on player screen" },
      {
        title: "kennytvs-epic-force-close-loading-screen-mod-for-fabric",
        slug: "forcecloseworldloadingscreen",
        description:
          "Instantly closes the loading terrain screen on world changing and drastically reduces the resource pack loading screen duration",
      },
      {
        title: "Smooth Skies",
        slug: "smooth-skies",
        description: "Smooths out the skybox colors on far render distances and fixes some other skybox visual issues.",
      },
    ],
  },
  {
    key: "utility",
    mods: [
      {
        title: "Mod Menu",
        slug: "modmenu",
        description: "Adds a mod menu to view the list of mods you have installed.",
      },
      {
        title: "Puzzle",
        slug: "puzzle",
        description: "Adds resourcepack features and a GUI to configure OptiFine alternatives more conveniently.",
      },
      {
        title: "Reese's Sodium Options",
        slug: "reeses-sodium-options",
        description: "Alternative Options Menu for Sodium",
      },
      {
        title: "spark",
        slug: "spark",
        description: "spark is a performance profiler for Minecraft clients, servers and proxies.",
      },
      {
        title: "Not Enough Crashes",
        slug: "notenoughcrashes",
        description:
          "When crashing, you can go back to the title screen and keep playing, without needing to restart, alongside other things to make crashes more pleasant.",
      },
      { title: "Auth Me", slug: "auth-me", description: "Authenticate yourself and re-validate your session" },
      { title: "Respackopts", slug: "respackopts", description: "Config menus for resource packs" },
      {
        title: "CraftPresence",
        slug: "craftpresence",
        description: "Completely Customize the way others see you play in Discord!",
      },
      {
        title: "Fast IP Ping",
        slug: "fast-ip-ping",
        description: "Yeet the laggy reversed DNS lookup for literal IP server addresses",
      },
      {
        title: "Crash Assistant",
        slug: "crash-assistant",
        description: "Shows a GUI after Minecraft crashes, immediately showing and analyzing all affected logs.",
      },
      {
        title: "Main Menu Credits",
        slug: "main-menu-credits",
        description: "Adds a way of adding information to the user's title screen.",
      },
      { title: "Debugify", slug: "debugify", description: "Fixes Minecraft bugs found on the bug tracker" },
      {
        title: "MixinTrace",
        slug: "mixintrace",
        description: "Adds a list of mixins in the stack trace to crash reports ",
      },
    ],
  },
];
