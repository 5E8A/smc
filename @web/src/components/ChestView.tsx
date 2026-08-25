import ModChest from "./ModChest";

const ChestView = () => {
  return (
    <div className="flex min-h-screen flex-col bg-transparent pt-10 pb-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="mb-2 font-mc text-4xl text-white font-pixel-shadow md:text-5xl">Chest Demo</h1>
          <p className="text-mc-text">
            Dev demo - creative-inventory style tabs, hover slots for tooltips, click to open Modrinth.
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
