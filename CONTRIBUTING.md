# Contributing to College Attendance App

Thank you for considering contributing to our project! 🎉

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/native-bunk.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes: `git commit -m "feat: Add your feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Android Studio (for Android development)
- MongoDB (optional, app works with in-memory storage)

### Installation
```bash
# Install dependencies
npm install

# Start the server
cd server
node index.js

# Start the mobile app
npx expo start
```

## Code Style

- Use meaningful variable and function names
- Add comments for complex logic
- Follow React Native best practices
- Ensure code is properly formatted
- Test on both light and dark themes

## Commit Message Guidelines

We follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
- `feat: Add profile picture upload`
- `fix: Resolve modal crash on teacher side`
- `docs: Update README with setup instructions`

## Testing

Before submitting a PR:
1. Test on both Android and iOS (if possible)
2. Test in both light and dark themes
3. Test with and without internet connection
4. Verify no console errors or warnings

## Pull Request Process

1. Update documentation if needed
2. Add screenshots for UI changes
3. Describe your changes clearly
4. Link any related issues
5. Wait for review and address feedback

## Questions?

Feel free to open an issue for any questions or concerns!
