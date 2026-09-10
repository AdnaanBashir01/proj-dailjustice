Dial Justice (demo version of lawyer booking and consultation)
Legal, Made Human — a responsive client-lawyer consultation platform with interactive appointment booking and scheduling.

🔗 Live demo: https://dailjustice.netlify.app/

Overview

Dial Justice connects clients with lawyers through a streamlined booking experience. It combines a serverless PostgreSQL backend with browser-native APIs to handle scheduling, media permissions, and document uploads directly in the client's browser.

Tech Stack<br>
React 19 — UI library<br>
TypeScript — static typing<br>
Vite — build tool / dev server<br>
Tailwind CSS 4 — utility-first styling<br>
Neon Serverless PostgreSQL — relational data storage<br>

Features:<br>
📅 Interactive Appointment Booking — schedule and manage consultations between clients and lawyers.<br>
🗄️ Neon Serverless PostgreSQL Integration — dynamic relational storage for appointments, users, and case data.<br>
💾 LocalStorage Session Persistence — combined with Postgres to keep sessions alive across visits
🎥 Native Browser APIs<br>
MediaDevices — real-time camera/microphone permission handling for consultations.<br>
FileReader / Blob — instant file upload previews for documents and evidence.<br>
📱 Fully Responsive Design — built mobile-first with Tailwind CSS 4.<br>
