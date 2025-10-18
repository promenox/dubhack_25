const DECORATIONS = [
  { id: 'oak', name: 'Mini Oak Tree', description: 'Adds shade to your garden.' },
  { id: 'fence', name: 'Cozy Wooden Fence', description: 'Keeps critters at bay.' },
  { id: 'path', name: 'Stone Pathway', description: 'Guides visitors through blooms.' }
];

interface DecorationsPanelProps {
  onClose?: () => void;
}

export const DecorationsPanel = ({ onClose }: DecorationsPanelProps) => (
  <section className="decorations-panel">
    <header>
      <div>
        <h2>Decorations</h2>
        <p>Preview cosmetic items to personalize your garden. (Coming soon)</p>
      </div>
      {onClose && (
        <button
          type="button"
          className="decorations-panel__close"
          onClick={onClose}
        >
          Close
        </button>
      )}
    </header>
    <div className="decorations-panel__list">
      {DECORATIONS.map((item) => (
        <div key={item.id} className="decoration-card">
          <strong>{item.name}</strong>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  </section>
);
