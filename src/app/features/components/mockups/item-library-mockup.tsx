export function ItemLibraryMockup() {
  const items = [
    { name: 'Lawn Mowing', price: '$65.00' },
    { name: 'Mulch Installation (per yard)', price: '$80.00' },
    { name: 'Hedge Trimming (per hour)', price: '$50.00' },
  ];

  return (
    <div className="bg-paper-white p-6 rounded-2xl shadow-2xl border border-stone-gray/20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-charcoal">Item Library</h3>
        <button className="bg-equipment-yellow text-charcoal font-bold px-4 py-2 rounded-lg text-sm hover:brightness-110 transition-all duration-200">
          Add New Item
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="bg-light-concrete p-4 rounded-lg grid grid-cols-3 gap-4 items-center hover:bg-stone-gray/30 transition-colors duration-200"
          >
            <span className="font-medium col-span-2 text-charcoal">{item.name}</span>
            <span className="font-mono font-bold text-forest-green text-right">{item.price}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-stone-gray/30">
        <div className="flex items-center justify-between text-sm text-charcoal/70">
          <span>3 items in library</span>
          <button className="text-forest-green hover:underline font-medium">
            View all items →
          </button>
        </div>
      </div>
    </div>
  );
}
