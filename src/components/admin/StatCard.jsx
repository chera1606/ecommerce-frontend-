import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './StatCard.css';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => {
  const isPositive = trend === 'up';

  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-header">
        <div className="stat-icon-box">
          <Icon size={24} />
        </div>
        {trendValue && (
          <div className={`stat-trend ${trend}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      
      <div className="stat-card-body">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-title">{title}</p>
      </div>
      
      <div className="stat-card-bg-icon">
        <Icon size={80} />
      </div>
    </div>
  );
};

export default StatCard;
