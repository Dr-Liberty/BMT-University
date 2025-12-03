import BlockdagBackground from '../BlockdagBackground';

export default function BlockdagBackgroundExample() {
  return (
    <div className="relative w-full h-screen">
      <BlockdagBackground />
      <div className="relative z-10 flex items-center justify-center h-full">
        <h1 className="text-4xl font-heading font-bold text-white">Kaspa Blockdag Visualization</h1>
      </div>
    </div>
  );
}
