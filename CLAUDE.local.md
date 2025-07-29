1. All ways serena tool

2. QuoteKit Implementation Notes
- Implemented as a modular CLI tool for quote management
- Key implementation file: main.py handles core functionality
- Potential type error challenges with previous implementations, requiring careful type checking and handling

3. Supabase Local Development
- Use Docker to run Supabase locally: `docker-compose up supabase`
- Access local Supabase Studio by navigating to `http://localhost:3000`
- Connect to local Supabase using connection string from `.env` or Docker configuration
- Use Supabase CLI for managing migrations and local development environment
- To stop local Supabase: `docker-compose down`

4. Design System and Mobile Friendliness
- Focus on responsive design principles for cross-device compatibility
- Implement flexible layout strategies (flexbox, CSS grid) to ensure adaptability
- Prioritize mobile-first approach with media queries and fluid typography
- Ensure touch-friendly interface elements with appropriate tap targets (minimum 44x44px)
- Optimize performance for mobile devices by minimizing unnecessary animations and optimizing asset sizes
- Use viewport meta tags and responsive units (%, vh, vw) for consistent scaling
- Test thoroughly on various mobile devices and screen sizes