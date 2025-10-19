import { useState } from "react";

interface SettingsProps {
	onSaveApiKey: (key: string) => void;
	currentApiKey?: string;
}

const Settings: React.FC<SettingsProps> = ({ onSaveApiKey, currentApiKey }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [apiKey, setApiKey] = useState("");
	const [saved, setSaved] = useState(false);

	const handleSave = () => {
		if (apiKey.trim()) {
			onSaveApiKey(apiKey.trim());
			setSaved(true);
			setTimeout(() => {
				setSaved(false);
				setIsOpen(false);
			}, 1500);
		}
	};

	if (!isOpen) {
		return (
			<button style={styles.floatingButton} onClick={() => setIsOpen(true)} title="Settings">
				⚙️
			</button>
		);
	}

	return (
		<div style={styles.overlay}>
			<div style={styles.modal}>
				<div style={styles.header}>
					<h2 style={styles.title}>Settings</h2>
					<button style={styles.closeButton} onClick={() => setIsOpen(false)}>
						✕
					</button>
				</div>

				<div style={styles.content}>
					<div style={styles.section}>
						<h3 style={styles.sectionTitle}>AI Integration</h3>
						<p style={styles.description}>
							Add your OpenAI API key to enable AI-powered score refinement and personalized summaries.
							Without an API key, FocusAI will use rule-based scoring.
						</p>

						<div style={styles.inputGroup}>
							<label style={styles.label}>OpenAI API Key</label>
							<input
								type="password"
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								placeholder={currentApiKey ? "••••••••••••••••" : "sk-..."}
								style={styles.input}
							/>
							<small style={styles.hint}>
								Get your API key from{" "}
								<a
									href="https://platform.openai.com/api-keys"
									target="_blank"
									rel="noopener noreferrer"
									style={styles.link}
								>
									platform.openai.com
								</a>
							</small>
						</div>

						<button
							style={{
								...styles.saveButton,
								...(saved ? styles.saveButtonSuccess : {}),
							}}
							onClick={handleSave}
							disabled={saved}
						>
							{saved ? "✓ Saved!" : "Save API Key"}
						</button>
					</div>

					<div style={styles.section}>
						<h3 style={styles.sectionTitle}>About FocusAI</h3>
						<p style={styles.aboutText}>
							FocusAI tracks your activity and uses AI to help you understand and improve your focus. Your
							data stays local on your device.
						</p>
						<div style={styles.infoGrid}>
							<div style={styles.infoItem}>
								<span style={styles.infoIcon}>📊</span>
								<span style={styles.infoLabel}>Updates every 3 min</span>
							</div>
							<div style={styles.infoItem}>
								<span style={styles.infoIcon}>🌱</span>
								<span style={styles.infoLabel}>Garden updates ~10 min</span>
							</div>
							<div style={styles.infoItem}>
								<span style={styles.infoIcon}>🤖</span>
								<span style={styles.infoLabel}>AI summaries every 30 min</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

const styles: Record<string, React.CSSProperties> = {
	floatingButton: {
		position: "fixed",
		bottom: "24px",
		right: "24px",
		width: "56px",
		height: "56px",
		borderRadius: "50%",
		border: "none",
		background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
		color: "white",
		fontSize: "24px",
		cursor: "pointer",
		boxShadow: "0 4px 20px rgba(102, 126, 234, 0.4)",
		transition: "transform 0.2s",
		zIndex: 1000,
	},
	overlay: {
		position: "fixed",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		background: "rgba(0,0,0,0.7)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 2000,
		backdropFilter: "blur(4px)",
	},
	modal: {
		background: "#1e293b",
		borderRadius: "20px",
		maxWidth: "600px",
		width: "90%",
		maxHeight: "80vh",
		overflow: "auto",
		boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
	},
	header: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		padding: "24px",
		borderBottom: "1px solid rgba(255,255,255,0.1)",
	},
	title: {
		fontSize: "24px",
		fontWeight: "bold",
		margin: 0,
		color: "white",
	},
	closeButton: {
		background: "none",
		border: "none",
		color: "white",
		fontSize: "24px",
		cursor: "pointer",
		opacity: 0.7,
		transition: "opacity 0.2s",
	},
	content: {
		padding: "24px",
	},
	section: {
		marginBottom: "32px",
	},
	sectionTitle: {
		fontSize: "18px",
		fontWeight: "bold",
		color: "white",
		marginBottom: "12px",
	},
	description: {
		fontSize: "14px",
		color: "rgba(255,255,255,0.8)",
		lineHeight: "1.6",
		marginBottom: "20px",
	},
	inputGroup: {
		display: "flex",
		flexDirection: "column",
		gap: "8px",
		marginBottom: "16px",
	},
	label: {
		fontSize: "14px",
		fontWeight: "600",
		color: "white",
	},
	input: {
		padding: "12px 16px",
		borderRadius: "12px",
		border: "2px solid rgba(255,255,255,0.1)",
		background: "rgba(255,255,255,0.05)",
		color: "white",
		fontSize: "14px",
		outline: "none",
		transition: "border-color 0.2s",
	},
	hint: {
		fontSize: "12px",
		color: "rgba(255,255,255,0.6)",
	},
	link: {
		color: "#667eea",
		textDecoration: "none",
	},
	saveButton: {
		width: "100%",
		padding: "12px",
		borderRadius: "12px",
		border: "none",
		background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
		color: "white",
		fontSize: "15px",
		fontWeight: "bold",
		cursor: "pointer",
		transition: "all 0.3s",
	},
	saveButtonSuccess: {
		background: "#10b981",
	},
	aboutText: {
		fontSize: "14px",
		color: "rgba(255,255,255,0.8)",
		lineHeight: "1.6",
		marginBottom: "20px",
	},
	infoGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
		gap: "16px",
	},
	infoItem: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: "8px",
		padding: "16px",
		background: "rgba(255,255,255,0.05)",
		borderRadius: "12px",
	},
	infoIcon: {
		fontSize: "24px",
	},
	infoLabel: {
		fontSize: "12px",
		color: "rgba(255,255,255,0.8)",
		textAlign: "center",
	},
};

export default Settings;
