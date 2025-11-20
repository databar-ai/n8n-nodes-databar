# Contributing to n8n-nodes-databar

Thank you for your interest in contributing! This document provides guidelines for developers who want to contribute to the Databar n8n node.

## Development Setup

### Prerequisites
- Node.js (v18.17.0 or higher)
- npm
- n8n installed locally

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/databar-ai/n8n-nodes-databar.git
   cd n8n-nodes-databar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Test locally**
   ```bash
   # Copy to n8n custom directory
   cp -r dist/* ~/.n8n/custom/
   
   # Restart n8n
   pkill -f "n8n" && n8n start
   ```

## Project Structure

```
n8n-nodes-databar/
├── credentials/
│   └── DatabarApi.credentials.ts    # API authentication
├── nodes/
│   └── Databar/
│       ├── Databar.node.ts          # Main node implementation
│       └── databar.svg              # Node icon
├── dist/                            # Compiled output (generated)
├── package.json                     # Package configuration
├── tsconfig.json                    # TypeScript configuration
└── gulpfile.js                      # Build tasks
```

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Edit TypeScript files in `nodes/` or `credentials/`
   - Follow existing code style and patterns

3. **Build and test**
   ```bash
   npm run build
   npm run lint
   ```

4. **Test in n8n**
   ```bash
   cp -r dist/* ~/.n8n/custom/
   pkill -f "n8n" && n8n start
   ```

### Code Style

- Use TypeScript for all code
- Follow existing naming conventions
- Add JSDoc comments for public methods
- Use meaningful variable names

### Linting

Run the linter before committing:
```bash
npm run lint

# Auto-fix issues
npm run lintfix
```

### Building

```bash
npm run build
```

This compiles TypeScript and copies assets to the `dist/` directory.

## Key Technical Details

### Authentication
- Uses `x-apikey` header for Databar API
- Credentials defined in `DatabarApi.credentials.ts`
- Test endpoint: `GET /v1/user/me`

### Async Operations
- Enrichments and waterfalls are asynchronous
- `pollTaskStatus()` helper handles polling
- Configurable intervals and timeouts

### Dynamic Dropdowns
- `loadOptionsMethod` functions fetch from API
- Options are searchable with `searchable: true`
- Graceful error handling with fallbacks

### Resource Mapper
- `resourceMapperMethod` generates dynamic fields
- Fetches parameter definitions from API
- Maps Databar types to n8n field types

## Submitting Changes

1. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: description of your changes"
   ```

2. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request**
   - Go to GitHub and create a PR
   - Describe your changes clearly
   - Reference any related issues

## Testing Checklist

Before submitting a PR, verify:
- [ ] Code builds without errors
- [ ] Linter passes
- [ ] Node loads in n8n
- [ ] All operations work as expected
- [ ] Credentials test successfully
- [ ] Error handling works correctly
- [ ] Documentation updated if needed

## Release Process

Releases are handled by maintainers:

1. Update version in `package.json`
2. Update CHANGELOG or version history in README
3. Build: `npm run build`
4. Publish: `npm publish`
5. Tag release in GitHub

## Questions?

For questions about contributing:
- Open an issue on GitHub
- Email: info@databar.ai

Thank you for contributing! 🎉

