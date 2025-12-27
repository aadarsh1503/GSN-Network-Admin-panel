import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  color = 'blue',
  prefix = '',
  suffix = '',
  animate = true 
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }
    
    let startTime;
    const duration = 2000;
    const startValue = 0;
    
    const animateValue = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * (value - startValue) + startValue));
      
      if (progress < 1) {
        requestAnimationFrame(animateValue);
      }
    };
    
    requestAnimationFrame(animateValue);
  }, [value, animate]);

  const calculateTrend = () => {
    if (!previousValue || previousValue === 0) return null;
    const change = ((value - previousValue) / previousValue) * 100;
    return {
      percentage: Math.abs(change).toFixed(1),
      isPositive: change > 0,
      isNeutral: change === 0
    };
  };

  const trend = calculateTrend();
  
  const colorClasses = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      icon: 'bg-blue-100 text-blue-600',
      trend: 'text-blue-200'
    },
    green: {
      bg: 'from-green-500 to-green-600',
      icon: 'bg-green-100 text-green-600',
      trend: 'text-green-200'
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      icon: 'bg-purple-100 text-purple-600',
      trend: 'text-purple-200'
    },
    orange: {
      bg: 'from-orange-500 to-orange-600',
      icon: 'bg-orange-100 text-orange-600',
      trend: 'text-orange-200'
    },
    red: {
      bg: 'from-red-500 to-red-600',
      icon: 'bg-red-100 text-red-600',
      trend: 'text-red-200'
    },
    indigo: {
      bg: 'from-indigo-500 to-indigo-600',
      icon: 'bg-indigo-100 text-indigo-600',
      trend: 'text-indigo-200'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors.bg} p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group`}>
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-16 w-16 rounded-full bg-white bg-opacity-5 group-hover:bg-opacity-10 transition-all duration-300"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${colors.icon} bg-opacity-20 backdrop-blur-sm group-hover:bg-opacity-30 transition-all duration-300`}>
            <Icon className="h-6 w-6" />
          </div>
          
          {trend && !trend.isNeutral && (
            <div className={`flex items-center space-x-1 text-sm ${colors.trend}`}>
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{trend.percentage}%</span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-white text-opacity-80 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold">
            {prefix}
            {displayValue.toLocaleString()}
            {suffix}
          </p>
          {trend && (
            <p className="text-xs text-white text-opacity-60">
              {trend.isPositive ? 'Increased' : 'Decreased'} from last period
            </p>
          )}
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300"></div>
    </div>
  );
};

export default MetricCard;