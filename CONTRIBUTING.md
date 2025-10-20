# Contributing Guidelines

Thank you for considering contributing to the College Attendance System!

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - System information (OS, Node version, etc.)

### Suggesting Features

1. Check if the feature has been suggested
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach
   - Mockups or examples if applicable

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/attendance-system.git
cd attendance-system

# Add upstream remote
git remote add upstream https://github.com/original/attendance-system.git

# Install dependencies
npm install
cd server && npm install
cd ../admin-panel && npm install
```

## Code Style

### JavaScript
- Use ES6+ features
- Use `const` and `let`, avoid `var`
- Use arrow functions where appropriate
- Add comments for complex logic
- Follow existing code style

### React Native
- Use functional components with hooks
- Keep components small and focused
- Use meaningful variable names
- Add PropTypes or TypeScript types

### Node.js/Express
- Use async/await for async operations
- Handle errors properly
- Add input validation
- Use middleware appropriately

## Testing

Before submitting PR:
1. Test all affected features
2. Test on different devices/browsers
3. Check for console errors
4. Verify no breaking changes

## Commit Messages

Use clear, descriptive commit messages:

```
feat: Add face verification timeout
fix: Resolve MongoDB connection issue
docs: Update API documentation
style: Format code with prettier
refactor: Simplify attendance calculation
test: Add tests for login endpoint
chore: Update dependencies
```

## Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Tests
- `chore/` - Maintenance

Examples:
- `feature/add-sms-notifications`
- `fix/face-verification-timeout`
- `docs/update-api-docs`

## Pull Request Process

1. Update documentation if needed
2. Add tests if applicable
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers
6. Address review comments
7. Wait for approval and merge

## Code Review

Reviewers will check:
- Code quality and style
- Functionality and correctness
- Performance implications
- Security considerations
- Documentation completeness
- Test coverage

## Areas for Contribution

### High Priority
- [ ] Add unit tests
- [ ] Improve error handling
- [ ] Add input validation
- [ ] Optimize database queries
- [ ] Improve documentation

### Features
- [ ] SMS notifications
- [ ] Email notifications
- [ ] GPS-based attendance
- [ ] WiFi-based attendance
- [ ] Parent portal
- [ ] Advanced analytics
- [ ] Multi-language support

### Improvements
- [ ] Better error messages
- [ ] Loading states
- [ ] Accessibility improvements
- [ ] Performance optimization
- [ ] UI/UX enhancements

### Documentation
- [ ] Video tutorials
- [ ] API examples
- [ ] Troubleshooting guide
- [ ] Architecture diagrams
- [ ] User manual

## Getting Help

- Ask questions in Issues
- Join community discussions
- Read existing documentation
- Check code comments

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

**Positive behavior:**
- Using welcoming language
- Being respectful of differing viewpoints
- Accepting constructive criticism
- Focusing on what's best for the community
- Showing empathy towards others

**Unacceptable behavior:**
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information
- Other unprofessional conduct

### Enforcement

Violations may result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report violations to: [email]

## Questions?

Feel free to ask questions by:
- Opening an issue
- Contacting maintainers
- Joining community chat

Thank you for contributing! 🎉
