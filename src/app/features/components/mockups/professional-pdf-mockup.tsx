export function ProfessionalPDFMockup() {
  const lineItems = [
    { service: 'Lawn Mowing', qty: 1, rate: '$65.00', total: '$65.00' },
    { service: 'Mulch Installation', qty: 3, rate: '$80.00', total: '$240.00' },
    { service: 'Hedge Trimming', qty: 2, rate: '$50.00', total: '$100.00' },
  ];

  return (
    <div className="bg-paper-white p-4 rounded-2xl shadow-2xl border border-stone-gray/20 transform rotate-2 hover:rotate-0 transition-transform duration-300">
      <div className="bg-paper-white p-6 rounded-lg w-full max-w-sm mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-stone-gray/30">
          <div>
            <h2 className="font-sans font-bold text-lg text-forest-green">Your Company Inc.</h2>
            <p className="text-xs text-charcoal/70 mt-1">123 Business St, City, ST 12345</p>
            <p className="text-xs text-charcoal/70">(555) 123-4567</p>
          </div>
          <div className="text-right">
            <h3 className="font-sans font-bold text-md text-charcoal">QUOTE</h3>
            <p className="font-mono text-xs text-charcoal/60">#2025-042</p>
            <p className="font-mono text-xs text-charcoal/60 mt-1">Jan 15, 2025</p>
          </div>
        </div>

        {/* Client Info */}
        <div className="mt-4 pb-3 border-b border-stone-gray/30">
          <p className="font-sans font-medium text-sm text-charcoal">Quote For:</p>
          <p className="font-sans text-sm text-charcoal/80">Johnson Residence</p>
          <p className="font-sans text-xs text-charcoal/70">456 Oak Street, City, ST 12345</p>
        </div>

        {/* Line Items */}
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs font-bold text-charcoal/70 border-b border-stone-gray/20 pb-1">
            <div className="col-span-6">Service</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Rate</div>
            <div className="col-span-2 text-right">Total</div>
          </div>
          {lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 text-sm">
              <div className="col-span-6 font-sans font-medium text-charcoal">{item.service}</div>
              <div className="col-span-2 text-right font-mono text-charcoal">{item.qty}</div>
              <div className="col-span-2 text-right font-mono text-charcoal">{item.rate}</div>
              <div className="col-span-2 text-right font-mono font-bold text-charcoal">{item.total}</div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 pt-3 border-t border-stone-gray/30 space-y-1 text-sm">
          <div className="flex justify-between">
            <p className="font-sans text-charcoal">Subtotal</p>
            <p className="font-mono font-bold text-charcoal">$405.00</p>
          </div>
          <div className="flex justify-between">
            <p className="font-sans text-charcoal">Tax (8.25%)</p>
            <p className="font-mono font-bold text-charcoal">$33.41</p>
          </div>
          <div className="flex justify-between font-bold text-lg text-forest-green mt-2 pt-2 border-t border-stone-gray/30">
            <p className="font-sans">Total</p>
            <p className="font-mono">$438.41</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-stone-gray/30 text-xs text-charcoal/70">
          <p className="font-sans">Quote valid for 30 days. Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}
