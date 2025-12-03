import AnalyticsChart from '../AnalyticsChart';

export default function AnalyticsChartExample() {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-background">
      <AnalyticsChart type="payouts" title="$BMT Payouts Over Time" />
      <AnalyticsChart type="students" title="Student Growth" />
    </div>
  );
}
