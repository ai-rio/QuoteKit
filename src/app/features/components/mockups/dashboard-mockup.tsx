export function DashboardMockup() {
  const metrics = [
    { label: 'Total Revenue', value: '$12,450', trend: '+12%' },
    { label: 'Quotes Sent', value: '42', trend: '+8%' },
    { label: 'Acceptance Rate', value: '78%', trend: '+5%' },
    { label: 'Avg. Quote Value', value: '$296', trend: '+15%' },
  ];

  return (
    <div className="bg-paper-white p-6 rounded-2xl shadow-2xl border border-stone-gray/20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-charcoal">Business Dashboard</h3>
        <div className="flex items-center space-x-2 text-sm text-charcoal/70">
          <span>Last 30 days</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-light-concrete p-4 rounded-lg text-center hover:bg-stone-gray/30 transition-colors duration-200"
          >
            <p className="text-sm text-charcoal/70 font-medium mb-1">{metric.label}</p>
            <p className="font-mono text-3xl font-bold text-forest-green">{metric.value}</p>
            <div className="flex items-center justify-center mt-2">
              <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17l10-10M17 7H7v10"></path>
              </svg>
              <span className="text-xs text-green-600 font-medium">{metric.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="border-t border-stone-gray/30 pt-4">
        <h4 className="font-bold text-sm text-charcoal mb-3">Recent Activity</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-charcoal/80">Quote #2025-041 accepted</span>
            </div>
            <span className="text-charcoal/60 text-xs">2h ago</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-equipment-yellow rounded-full"></div>
              <span className="text-charcoal/80">Quote #2025-040 sent</span>
            </div>
            <span className="text-charcoal/60 text-xs">4h ago</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-stone-gray rounded-full"></div>
              <span className="text-charcoal/80">New item added to library</span>
            </div>
            <span className="text-charcoal/60 text-xs">1d ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
