# CourseFlow

A modern Learning Management System (LMS) built with React, TypeScript, and Vite.

## Features

- **Interactive Courses** - Access and manage your courses seamlessly
- **Assignments** - Create, submit, and track assignments
- **Quizzes** - Take quizzes and track your progress
- **Grades** - Real-time grade tracking and analytics
- **Discussions** - Collaborate with peers and instructors
- **Calendar** - Manage your schedule and deadlines
- **Modern UI** - Built with shadcn-ui and Tailwind CSS

## Technologies

This project is built with:

- **Vite** - Fast build tool and development server
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **shadcn-ui** - High-quality component library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, or bun

### Installation

1. Clone the repository:
```sh
git clone https://github.com/nirajmehta960/CourseFlow.git
cd CourseFlow
```

2. Install dependencies:
```sh
npm install
# or
yarn install
# or
bun install
```

3. Start the development server:
```sh
npm run dev
# or
yarn dev
# or
bun dev
```

The application will be available at `http://localhost:8080`

### Building for Production

```sh
npm run build
# or
yarn build
# or
bun run build
```

The production build will be in the `dist` directory.

### Preview Production Build

```sh
npm run preview
# or
yarn preview
# or
bun run preview
```

## Project Structure

```
src/
├── components/     # React components
│   ├── layout/    # Layout components
│   ├── ui/        # UI components (shadcn)
│   └── quiz/      # Quiz-related components
├── contexts/      # React contexts
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── types/         # TypeScript type definitions
└── lib/           # Utility functions
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
