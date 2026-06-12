# Fuel-MPG-Tracker
I am a car guy and I have OCD
=============================

A modern, responsive React web application built to track your vehicle's fuel efficiency, log gas purchases, and get AI-powered maintenance insights (coming later - in development).

🚀 Features

My Garage: Manage multiple vehicles by adding or editing their year, make, and model. You can easily switch vehicle contexts instantly by clicking on a car in your garage list.


Automated MPG Calculation: The app calculates your MPG automatically by capturing the current odometer reading, subtracting the previous reading, and dividing by the purchased gas volume.


Upcoming Maintenance Check: Analyzes your specific vehicle and latest odometer reading to suggest preventative maintenance.


Analyze My MPG Trends: Evaluates your recent trips and average MPG to provide actionable fuel economy tips.


History & Performance Dashboard: A full-width data table featuring sortable columns , pagination (select between 10, 20, or 50 rows per page) , inline log editing , and a dedicated "Notes" column.


Bulk CSV Import: Easily import legacy data. Thanks to the flexible NoSQL backend, it gracefully handles missing data (like missing dates or prices) by displaying "N/A" or "--" instead of crashing.

🛠️ Tech Stack

Frontend: React (JSX) and Vite.


Styling: Tailwind CSS.


Database: Firebase Firestore (NoSQL).


Icons: Lucide-React.

⚙️ Local Setup & Installation
If you want to run this app locally and connect it to your own database, follow these steps:

1. Clone the Repository & Install Dependencies
Navigate into the project folder and install the required packages:

Bash
npm install lucide-react firebase

2. Set Up Firebase

Create a new project in the Firebase console using the free "Spark" plan.

Go to Authentication > Sign-in method, select Anonymous, and enable it.

Go to Firestore Database and create a database. Start in Test Mode for initial development.

Add a "Web App" to your Firebase project to generate your configuration snippet.

3. Connect Your Database

In the src folder, create a new file named firebase.js.

Paste your entire configuration snippet (the const firebaseConfig = { ... } block) into this file.

4. Run the App
Start your local Vite development server:

Bash
npm run dev

Click the localhost link in your terminal to open the live app in your browser.

🔒 Going to Production
When you are ready to deploy (e.g., via GitHub Pages), remember to transition your Firestore Database out of "Test Mode". Locking down your security rules will not wipe any of your existing data.
