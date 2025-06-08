# ASD Screening Tool

A comprehensive web application for early Autism Spectrum Disorder (ASD) screening, combining interactive tests with AI-powered analysis.

## Features

- 🤖 AI-Driven Conversational Screening
- 🎯 Interactive Assessment Tests:
  - Emotion Recognition
  - Reaction Time
  - Pattern Recognition
- 📊 Clinical Report Generation
- 👨‍⚕️ Practitioner Dashboard
- 🔒 Secure Authentication
- 📱 Responsive Design

## Tech Stack

- **Frontend:**
  - React 18
  - React Router v6
  - CSS Modules
  - react-to-print (PDF generation)

- **Backend:**
  - Node.js
  - Express
  - OpenAI API
  - JWT Authentication

- **Deployment:**
  - Frontend: Vercel
  - Backend: Render
  - Database: Supabase

## Getting Started

### Prerequisites

- Node.js >= 14
- npm >= 6
- OpenAI API key
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/asd-screening-tool.git
cd asd-screening-tool
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
REACT_APP_API_URL=your_backend_url
REACT_APP_AUTH_DOMAIN=your_auth_domain
OPENAI_API_KEY=your_openai_key
JWT_SECRET=your_jwt_secret
```

4. Start the development server:
```bash
npm start
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

## Project Structure

```
src/
├── components/        # Reusable UI components
├── contexts/         # React context providers
├── pages/           # Main page components
├── services/        # API and utility services
├── styles/          # Global styles and themes
└── tests/           # Test files
```

## Testing

The application includes:
- Unit tests for components
- Integration tests for API services
- End-to-end tests for complete user flows
- Accessibility tests

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy using the Vercel CLI:
```bash
vercel
```

### Backend (Render)

1. Create a new Web Service in Render
2. Connect your repository
3. Configure environment variables
4. Deploy

## Security

- JWT-based authentication
- Role-based access control
- Secure API endpoints
- Environment variable protection
- XSS and CSRF protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for GPT API
- React team for the framework
- All contributors and testers

## Support

For support, email support@asdscreening.com or open an issue in the repository.

## Roadmap

- [ ] Add more interactive tests
- [ ] Implement real-time chat support
- [ ] Add multi-language support
- [ ] Enhance report customization
- [ ] Add data visualization features
