type Props = {
	text: string;
	confidence: number;
};

export default function OCRPreview({ text, confidence }: Props) {
	return (
		<div style={styles.card}>
			<h3 style={styles.title}>Live OCR</h3>
			<p style={styles.subtitle}>Latest screen text (updates every few seconds)</p>
			<div style={styles.meta}>Confidence: {Math.round(confidence)}%</div>
			<div style={styles.box}>
				<pre style={styles.text}>{text || "—"}</pre>
			</div>
		</div>
	);
}

const styles: Record<string, React.CSSProperties> = {
	card: {
		background: "rgba(255,255,255,0.05)",
		border: "1px solid rgba(255,255,255,0.1)",
		borderRadius: 12,
		padding: 16,
		display: "flex",
		flexDirection: "column",
		gap: 8,
	},
	title: { margin: 0 },
	subtitle: { margin: 0, opacity: 0.7, fontSize: 13 },
	meta: { fontSize: 12, opacity: 0.85 },
	box: {
		background: "rgba(0,0,0,0.3)",
		borderRadius: 8,
		border: "1px solid rgba(255,255,255,0.1)",
		padding: 12,
		maxHeight: 200,
		overflow: "auto",
	},
	text: { margin: 0, whiteSpace: "pre-wrap" },
};
