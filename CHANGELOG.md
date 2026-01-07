# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Production-ready CI/CD workflows
- Automated release process
- Comprehensive changelog

## [1.0.0] - 2026-01-07

### Added
- Initial release of Perplexity Enigma CLI
- Interactive mode for continuous Q&A with Perplexity AI
- One-shot question mode via `enigma ask "question"`
- Multi-model support (sonar, sonar-pro, sonar-reasoning, sonar-deep-research, etc.)
- Configuration management via `.pplxrc` YAML file and environment variables
- Windows PowerShell integration with setup scripts
- Real-time search capabilities through Perplexity API
- Command-line options for model selection, search mode, and output preferences
- Comprehensive error handling and fallback mechanisms
- Configuration viewing and persistence commands
- API key management with secure storage

### Features
- **Interactive Mode**: Type `enigma` to enter interactive session with `:help` and `:exit` commands
- **Model Selection**: Override model per-call with `--model` flag
- **Configuration Precedence**: Environment variables > `.pplxrc` > defaults
- **PowerShell Profile Setup**: Automatic profile configuration for Windows users
- **Structured Output**: Clean formatting with color-coded responses

### Documentation
- Comprehensive README with Windows-focused quick start guide
- Troubleshooting section for common issues
- Development setup instructions
- FAQ for Windows users
- Configuration examples with `.env.example` and `.pplxrc.example`

[Unreleased]: https://github.com/Symbo-gif/Perplexity-Enigma-CLI/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Symbo-gif/Perplexity-Enigma-CLI/releases/tag/v1.0.0
