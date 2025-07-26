// Mock implementation of lucide-react for testing
const React = require('react')

const MockIcon = ({ className, ...props }) => {
  return React.createElement('svg', {
    className,
    ...props,
    'data-testid': 'mock-icon'
  })
}

// Export all commonly used icons as the same mock component
module.exports = {
  Activity: MockIcon,
  Calendar: MockIcon,
  Download: MockIcon,
  Edit: MockIcon,
  Eye: MockIcon,
  FileText: MockIcon,
  Mail: MockIcon,
  MoreHorizontal: MockIcon,
  Plus: MockIcon,
  Search: MockIcon,
  Settings: MockIcon,
  Trash: MockIcon,
  User: MockIcon,
  Users: MockIcon,
  X: MockIcon,
  ChevronDown: MockIcon,
  ChevronUp: MockIcon,
  ChevronLeft: MockIcon,
  ChevronRight: MockIcon,
  Check: MockIcon,
  AlertCircle: MockIcon,
  Info: MockIcon,
  ExternalLink: MockIcon,
  Copy: MockIcon,
  Filter: MockIcon,
  SortAsc: MockIcon,
  SortDesc: MockIcon,
  RefreshCw: MockIcon,
  Clock: MockIcon,
  DollarSign: MockIcon,
  TrendingUp: MockIcon,
  BarChart3: MockIcon,
  PieChart: MockIcon,
  Building: MockIcon,
  Phone: MockIcon,
  MapPin: MockIcon,
  Globe: MockIcon,
  Shield: MockIcon,
  Lock: MockIcon,
  Unlock: MockIcon,
  Key: MockIcon,
  LogOut: MockIcon,
  LogIn: MockIcon,
  UserPlus: MockIcon,
  UserMinus: MockIcon,
  UserCheck: MockIcon,
  UserX: MockIcon
}