export function QuoteManagementMockup() {
  const quotes = [
    {
      id: '#2025-041',
      client: 'ACME Corp',
      status: 'Accepted',
      statusColor: 'bg-green-500',
      amount: '$1,250.00',
    },
    {
      id: '#2025-040',
      client: 'Smith Residence',
      status: 'Sent',
      statusColor: 'bg-stone-gray',
      amount: '$485.00',
    },
    {
      id: '#2025-039',
      client: 'City Park',
      status: 'Draft',
      statusColor: 'bg-equipment-yellow/70',
      amount: '$2,100.00',
    },
  ];

  return (
    <div className="bg-paper-white p-6 rounded-2xl shadow-2xl border border-stone-gray/20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-charcoal">Quote Management</h3>
        <button className="bg-forest-green text-paper-white font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity duration-200">
          New Quote
        </button>
      </div>
      <div className="space-y-3">
        {quotes.map((quote, index) => (
          <div
            key={index}
            className="bg-light-concrete p-4 rounded-lg hover:bg-stone-gray/30 transition-colors duration-200"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-medium text-charcoal">
                  Quote {quote.id}
                  <span className="text-xs text-charcoal/60 ml-2">for {quote.client}</span>
                </div>
                <div className="text-sm font-mono text-charcoal/70 mt-1">{quote.amount}</div>
              </div>
              <span
                className={`font-mono font-bold text-xs px-2 py-1 text-paper-white rounded-full ${quote.statusColor}`}
              >
                {quote.status}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-charcoal/60">
              <span>Updated 2 hours ago</span>
              <button className="text-forest-green hover:underline">View →</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-stone-gray/30">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-mono font-bold text-forest-green">78%</div>
            <div className="text-charcoal/70">Acceptance Rate</div>
          </div>
          <div>
            <div className="font-mono font-bold text-forest-green">$3,835</div>
            <div className="text-charcoal/70">This Month</div>
          </div>
          <div>
            <div className="font-mono font-bold text-forest-green">12</div>
            <div className="text-charcoal/70">Active Quotes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
