# Contributing to Productivity Garden 🌱

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

-   Be respectful and inclusive
-   Focus on constructive feedback
-   Help others learn and grow
-   Respect privacy and security considerations

## Getting Started

1. **Fork the repository**
2. **Clone your fork:**
    ```bash
    git clone https://github.com/your-username/productivity-garden.git
    cd productivity-garden/my-app
    ```
3. **Install dependencies:**
    ```bash
    npm install
    ```
4. **Create a branch:**
    ```bash
    git checkout -b feature/your-feature-name
    ```

## Development Guidelines

### Code Style

-   **TypeScript**: Use strict type checking
-   **Formatting**: Follow existing code style
-   **Comments**: Document complex logic and public APIs
-   **Naming**: Use descriptive, clear variable names

### Component Guidelines

```typescript
// ✅ Good
const styles = {
	container: {
		padding: "2rem",
		backgroundColor: "#1e1e1e",
	},
};

export const MyComponent: React.FC<Props> = ({ data }) => {
	return <div style={styles.container}>{data}</div>;
};

// ❌ Avoid
export const MyComponent = (props: any) => {
	return <div className="container">{props.data}</div>;
};
```

### Service Guidelines

-   **Modularity**: Keep services independent and focused
-   **Lifecycle**: Implement start(), stop(), destroy()
-   **Logging**: Use consistent logging format: `[ServiceName] message`
-   **Error Handling**: Catch and log errors, don't crash the app

### Privacy Guidelines

**NEVER:**

-   Store raw keystroke content
-   Save screenshot images
-   Transmit data to external servers
-   Log sensitive user information

**ALWAYS:**

-   Document what data is collected
-   Provide disable options
-   Store data locally only
-   Allow data export and deletion

## Commit Messages

Use conventional commits:

```
feat: Add new productivity metric
fix: Resolve OCR memory leak
docs: Update installation guide
style: Format code with prettier
refactor: Simplify scoring algorithm
test: Add unit tests for DataService
chore: Update dependencies
```

## Pull Request Process

1. **Update Documentation:**

    - Update README.md if adding features
    - Update DEVELOPMENT.md if changing architecture
    - Add JSDoc comments for new APIs

2. **Test Your Changes:**

    ```bash
    npm run dev    # Manual testing
    npm run lint   # Check for errors
    npm run build  # Ensure it builds
    ```

3. **Create Pull Request:**

    - Write a clear title and description
    - Reference any related issues
    - Explain what changed and why
    - Include screenshots for UI changes

4. **Code Review:**
    - Address reviewer feedback
    - Keep discussion constructive
    - Update as needed

## Areas for Contribution

### High Priority

-   🐛 **Bug Fixes**: Any bugs or issues
-   📚 **Documentation**: Improve guides and docs
-   ♿ **Accessibility**: Make UI more accessible
-   🔒 **Security**: Enhance privacy and security

### Feature Ideas

-   **ML Integration**: Machine learning scoring models
-   **Insights**: Analytics and productivity reports
-   **Integrations**: Calendar, project management tools
-   **Themes**: Custom garden themes and plants
-   **Platform Support**: Better Linux/macOS support
-   **Localization**: Multi-language support

### Good First Issues

-   Add more app categorizations
-   Improve OCR accuracy
-   Add keyboard shortcuts
-   Create more garden plant styles
-   Write unit tests

## Testing

### Manual Testing

Before submitting PR:

-   [ ] Test on your platform (Windows/macOS/Linux)
-   [ ] Verify no console errors
-   [ ] Check settings persist
-   [ ] Test data export/delete
-   [ ] Ensure overlay works

### Adding Tests (Future)

```typescript
// Example test structure
describe("ProductivityEngine", () => {
	it("should calculate score correctly", () => {
		const engine = new ProductivityEngine();
		// Test logic...
	});
});
```

## Documentation

### Code Documentation

Use JSDoc for functions and classes:

```typescript
/**
 * Calculate productivity score based on current telemetry
 *
 * @param telemetry - Current telemetry data
 * @returns Productivity score (0-100)
 * @throws {Error} If telemetry is invalid
 */
function calculateScore(telemetry: Telemetry): number {
	// Implementation...
}
```

### README Updates

When adding features:

1. Update feature list
2. Add configuration examples
3. Update screenshots (if UI changed)
4. Document new settings

## Questions?

-   Open an issue for questions
-   Tag with `question` label
-   Be specific about what you need help with

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Productivity Garden! 🌱✨
