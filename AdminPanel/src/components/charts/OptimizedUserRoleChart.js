import React, { memo } from 'react';
import PropTypes from 'prop-types';
import UserRoleChart from './UserRoleChart';

/**
 * Optimized wrapper for UserRoleChart to prevent unnecessary re-renders
 * Only re-renders when roleDistribution actually changes
 */
const OptimizedUserRoleChart = memo(({ roleDistribution }) => {
  // Don't render if no valid data
  if (!roleDistribution || typeof roleDistribution !== 'object') {
    return null;
  }

  const hasData = Object.keys(roleDistribution).length > 0 && 
    Object.values(roleDistribution).some(count => count > 0);

  if (!hasData) {
    return null;
  }

  return <UserRoleChart roleDistribution={roleDistribution} />;
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if role distribution actually changed
  const prevKeys = Object.keys(prevProps.roleDistribution || {}).sort();
  const nextKeys = Object.keys(nextProps.roleDistribution || {}).sort();
  
  // Check if keys are different
  if (prevKeys.length !== nextKeys.length || 
      !prevKeys.every((key, index) => key === nextKeys[index])) {
    return false;
  }
  
  // Check if values are different
  return prevKeys.every(key => 
    prevProps.roleDistribution[key] === nextProps.roleDistribution[key]
  );
});

OptimizedUserRoleChart.displayName = 'OptimizedUserRoleChart';

OptimizedUserRoleChart.propTypes = {
  roleDistribution: PropTypes.object,
};

OptimizedUserRoleChart.defaultProps = {
  roleDistribution: {},
};

export default OptimizedUserRoleChart;