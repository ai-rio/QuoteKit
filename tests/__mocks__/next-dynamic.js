// Mock for next/dynamic
module.exports = (importFunc, options = {}) => {
  const Component = (props) => {
    if (options.loading) {
      return options.loading();
    }
    // Return a simple mock component
    return require('react').createElement('div', {
      'data-testid': 'dynamic-component',
      ...props
    }, 'Dynamic Component');
  };
  
  Component.displayName = 'DynamicComponent';
  return Component;
};
