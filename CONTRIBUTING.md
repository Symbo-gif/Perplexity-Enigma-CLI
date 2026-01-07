# Contributing to Perplexity-Enigma-CLI

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/Perplexity-Enigma-CLI.git
   cd Perplexity-Enigma-CLI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development build**
   ```bash
   npm run dev
   ```

## Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add tests for new features
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run build
   npm test
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New features
   - `fix:` Bug fixes
   - `docs:` Documentation changes
   - `test:` Test additions or changes
   - `chore:` Build process or tooling changes
   - `refactor:` Code refactoring
   - `perf:` Performance improvements

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Ensure all tests pass
- Update documentation if needed
- Keep PRs focused on a single feature or fix

## Code Style

- Use TypeScript for all code
- Follow existing formatting conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Testing

- Write tests for all new features
- Ensure existing tests still pass
- Use Vitest for testing
- Aim for high test coverage

## Documentation

- Update README.md for user-facing changes
- Update CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/)
- Add code comments for complex logic
- Update VERSIONING.md if changing release process

## Release Process (Maintainers Only)

See [VERSIONING.md](./VERSIONING.md) for the complete release process.

Quick steps:
1. Update version in package.json
2. Update CHANGELOG.md
3. Commit changes
4. Create and push tag
5. GitHub Actions handles the rest

## Questions?

Feel free to open an issue for any questions or concerns!
