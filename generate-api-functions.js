const fs = require('fs');
const path = require('path');

// Route files to convert
const routes = [
  'autoloan',
  'cashplus', 
  'creditcard',
  'personal-details',
  'current-address',
  'permanent-address',
  'employment-details',
  'reference-contacts',
  'vehicle-details',
  'insurance-details',
  'contact-details',
  'verification'
];

// Template for serverless function
const template = (routeName) => `const { routerToServerless } = require('./_routerAdapter');

// Import the existing router
const ${routeName.replace('-', '')}Router = require('../routes/${routeName}');

// Convert router to serverless function
module.exports = routerToServerless(${routeName.replace('-', '')}Router);
`;

// Create API directory if it doesn't exist
const apiDir = path.join(__dirname, 'api');
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir);
}

// Generate serverless functions for each route
routes.forEach(routeName => {
  const fileName = `${routeName}.js`;
  const filePath = path.join(apiDir, fileName);
  
  // Convert kebab-case to camelCase for variable names
  const camelCaseName = routeName.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  
  const content = `const { routerToServerless } = require('./_routerAdapter');

// Import the existing router
const ${camelCaseName}Router = require('../routes/${routeName}');

// Convert router to serverless function
module.exports = routerToServerless(${camelCaseName}Router);
`;
  
  fs.writeFileSync(filePath, content);
  console.log(`Created ${fileName}`);
});

console.log('All serverless functions generated successfully!'); 