# Versioning and Release Strategy

## Versioning

This project follows [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
  - **MAJOR**: Breaking changes (incompatible API changes)
  - **MINOR**: New features (backward-compatible functionality)
  - **PATCH**: Bug fixes (backward-compatible bug fixes)

### Version Format

- Production releases: `v1.0.0`, `v1.1.0`, `v2.0.0`
- Pre-releases: `v1.0.0-alpha.1`, `v1.0.0-beta.2`, `v1.0.0-rc.1`

## Release Process

### Automated Release (Recommended)

Releases are automated via GitHub Actions when you push a version tag:

1. **Update version in package.json**
   ```bash
   npm version [major|minor|patch]
   # Or manually edit package.json
   ```

2. **Update CHANGELOG.md**
   - Add a new section for the version
   - Document all changes under appropriate categories:
     - Added
     - Changed
     - Deprecated
     - Removed
     - Fixed
     - Security

3. **Commit changes**
   ```bash
   git add package.json package-lock.json CHANGELOG.md
   git commit -m "chore: release v1.x.x"
   ```

4. **Create and push tag**
   ```bash
   git tag v1.x.x
   git push origin main --tags
   ```

5. **Automated workflow** will:
   - Run all tests
   - Build the project
   - Create a GitHub Release with changelog
   - Publish to npm with provenance

### Manual Release (Fallback)

If automation fails, you can manually release:

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Publish to npm**
   ```bash
   npm publish --access public
   ```

3. **Create GitHub Release**
   - Go to: https://github.com/Symbo-gif/Perplexity-Enigma-CLI/releases/new
   - Enter tag version (e.g., v1.0.0)
   - Copy changelog content for the release notes
   - Publish release

## Pre-release Process

For alpha, beta, or release candidate versions:

1. **Create pre-release version**
   ```bash
   npm version prerelease --preid=alpha
   # Results in: 1.0.0-alpha.0
   ```

2. **Update CHANGELOG.md** with `[Unreleased]` section

3. **Tag and push**
   ```bash
   git tag v1.0.0-alpha.0
   git push origin main --tags
   ```

4. **Pre-release workflow** creates a pre-release GitHub Release and publishes with tag:
   ```bash
   npm publish --tag alpha
   ```

## NPM Package

The package is published as: **perplexity-enigma**

- Public repository: https://www.npmjs.com/package/perplexity-enigma
- Install: `npm install -g perplexity-enigma`

### Package Publishing Requirements

To publish the package, the repository maintainer needs:

1. **NPM Account** with publish access
2. **NPM Token** stored as `NPM_TOKEN` secret in GitHub repository settings
3. **Provenance** enabled for supply chain security

## CI/CD Pipeline

### Continuous Integration (CI)

Runs on every push and pull request to `main` or `develop`:

- **Multi-platform testing**: Ubuntu, Windows, macOS
- **Multi-version testing**: Node.js 18.x, 20.x, 22.x
- **Steps**:
  1. Install dependencies
  2. Run linter
  3. Run tests
  4. Build project
  5. Verify build artifacts

### Release Workflow

Triggered when a version tag is pushed (e.g., `v1.0.0`):

- **Steps**:
  1. Run full test suite
  2. Build production bundle
  3. Extract changelog for version
  4. Create GitHub Release
  5. Publish to npm with provenance

## Version History

All releases are tracked in:
- **CHANGELOG.md** - Detailed change log
- **GitHub Releases** - Release notes and downloadable assets
- **npm versions** - Published package versions

## Support Policy

- **Latest Major Version**: Full support with bug fixes and features
- **Previous Major Version**: Critical security fixes only for 6 months
- **Older Versions**: Not supported

## Breaking Changes

Major version bumps indicate breaking changes:

- Document breaking changes prominently in CHANGELOG.md
- Provide migration guide in release notes
- Consider deprecation warnings in previous minor versions

## Quick Reference

```bash
# Patch release (1.0.0 → 1.0.1)
npm version patch

# Minor release (1.0.0 → 1.1.0)
npm version minor

# Major release (1.0.0 → 2.0.0)
npm version major

# Pre-release
npm version prerelease --preid=alpha

# After version bump
git push origin main --tags
```

## Troubleshooting

### Release Workflow Fails

1. Check GitHub Actions logs
2. Verify `NPM_TOKEN` secret is set
3. Ensure npm account has publish permissions
4. Verify package.json version matches tag

### npm Publish Fails

1. Check if version already exists: `npm view perplexity-enigma versions`
2. Verify npm authentication: `npm whoami`
3. Ensure public access: Add `"publishConfig": {"access": "public"}` to package.json

### GitHub Release Creation Fails

1. Check `GITHUB_TOKEN` permissions
2. Verify tag format matches `v*.*.*`
3. Ensure CHANGELOG.md has section for the version

## Resources

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [npm Documentation](https://docs.npmjs.com/)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
