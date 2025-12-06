// How to install the project 

1. Run
 npm install 

2. Start Expo 
npx expo start  

3. Run on device or on the web 
Scan QR Code 

Chart Feature 
This project includes a bar chart feature that updates automatically as expenses are added, edited, or deleted.  

It should show 
-Total spending by category 
-Dynamic labels 
-Values that update based on SQLite data 

GitHub Copilot Reflection 

-I used copilot to help initialize my ExpenseChart component 
-To help write my getChartData() function 

A copilot function that I rejected was when copilot suggested that I use a hard-coded list of categories but the projectv suggests otherwise.  

Copilot saved me time when configuring the chart, using reusable buttons and functions,
and having a cleaner map of the category totals. 
