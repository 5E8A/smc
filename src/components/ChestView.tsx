import ModChest from "./ModChest";

const ChestView = () => {
  return (
    <div className="flex flex-col min-h-screen bg-transparent pt-10 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-mc text-white mb-2 font-pixel-shadow">Chest Demo</h1>
          <p className="text-mc-text">
            Dev demo — creative-inventory style tabs, hover slots for tooltips, click to open Modrinth.
          </p>
        </div>

        <div className="flex justify-center">
          <ModChest />
        </div>
      </div>
    </div>
  );
};

export default ChestView;
