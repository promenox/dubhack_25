import { FocusScore as FocusScoreType } from "../types";

interface FocusScoreProps {
	score: FocusScoreType;
}

const FocusScore: React.FC<FocusScoreProps> = ({ score }) => {
	const getTrendIcon = () => {
		switch (score.trend) {
			case "rising":
				return "📈";
			case "falling":
				return "📉";
			case "stable":
				return "➡️";
		}
	};

	const getTrendColor = () => {
		switch (score.trend) {
			case "rising":
				return "#10b981";
			case "falling":
				return "#ef4444";
			case "stable":
				return "#f59e0b";
		}
	};

	const getScoreColor = (value: number) => {
		if (value >= 75) return "#10b981";
		if (value >= 50) return "#f59e0b";
		return "#ef4444";
	};

	return (
		<div style={styles.container}>
			<h2 style={styles.title}>Focus Score</h2>

			<div style={styles.scoresGrid}>
				{/* Instantaneous Score */}
				<div style={styles.scoreCard}>
					<div style={styles.scoreLabel}>Right Now</div>
					<div
						style={{
							...styles.scoreValue,
							color: getScoreColor(score.instantaneous),
						}}
					>
						{Math.round(score.instantaneous)}
					</div>
					<div style={styles.scoreMax}>/100</div>

					<div style={styles.trendContainer}>
						<span style={styles.trendIcon}>{getTrendIcon()}</span>
						<span style={{ ...styles.trendText, color: getTrendColor() }}>{score.trend}</span>
					</div>

					<svg style={styles.circle} viewBox="0 0 120 120">
						<circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
						<circle
							cx="60"
							cy="60"
							r="54"
							fill="none"
							stroke={getScoreColor(score.instantaneous)}
							strokeWidth="8"
							strokeDasharray={`${(score.instantaneous / 100) * 339.29} 339.29`}
							strokeLinecap="round"
							transform="rotate(-90 60 60)"
							style={{ transition: "stroke-dasharray 0.5s ease-out" }}
						/>
					</svg>
				</div>

				{/* Cumulative Score */}
				<div style={styles.scoreCard}>
					<div style={styles.scoreLabel}>Overall Progress</div>
					<div
						style={{
							...styles.scoreValue,
							color: getScoreColor(score.cumulative),
						}}
					>
						{Math.round(score.cumulative)}
					</div>
					<div style={styles.scoreMax}>/100</div>

					<div style={styles.description}>Your sustained focus score</div>

					<svg style={styles.circle} viewBox="0 0 120 120">
						<circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
						<circle
							cx="60"
							cy="60"
							r="54"
							fill="none"
							stroke={getScoreColor(score.cumulative)}
							strokeWidth="8"
							strokeDasharray={`${(score.cumulative / 100) * 339.29} 339.29`}
							strokeLinecap="round"
							transform="rotate(-90 60 60)"
							style={{ transition: "stroke-dasharray 0.5s ease-out" }}
						/>
					</svg>
				</div>
			</div>

			<div style={styles.infoBar}>
				<div style={styles.infoItem}>
					<span style={styles.infoIcon}>⏱️</span>
					<span style={styles.infoText}>Updates every 3 minutes</span>
				</div>
				<div style={styles.infoItem}>
					<span style={styles.infoIcon}>🎯</span>
					<span style={styles.infoText}>AI-enhanced scoring</span>
				</div>
			</div>
		</div>
	);
};

const styles: Record<string, React.CSSProperties> = {
	container: {
		background: "#2d3748",
		borderRadius: "20px",
		padding: "24px",
		boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
		color: "white",
	},
	title: {
		fontSize: "24px",
		fontWeight: "bold",
		margin: "0 0 24px 0",
	},
	scoresGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
		gap: "20px",
		marginBottom: "20px",
	},
	scoreCard: {
		position: "relative",
		background: "rgba(255,255,255,0.05)",
		borderRadius: "16px",
		padding: "24px",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		border: "1px solid rgba(255,255,255,0.1)",
	},
	scoreLabel: {
		fontSize: "14px",
		opacity: 0.8,
		marginBottom: "12px",
		textTransform: "uppercase",
		letterSpacing: "1px",
	},
	scoreValue: {
		fontSize: "48px",
		fontWeight: "bold",
		lineHeight: 1,
	},
	scoreMax: {
		fontSize: "20px",
		opacity: 0.6,
		marginTop: "4px",
	},
	circle: {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		width: "140px",
		height: "140px",
		opacity: 0.3,
		pointerEvents: "none",
	},
	trendContainer: {
		display: "flex",
		alignItems: "center",
		gap: "8px",
		marginTop: "16px",
		padding: "8px 16px",
		background: "rgba(255,255,255,0.1)",
		borderRadius: "20px",
	},
	trendIcon: {
		fontSize: "18px",
	},
	trendText: {
		fontSize: "14px",
		fontWeight: "600",
		textTransform: "capitalize",
	},
	description: {
		fontSize: "13px",
		opacity: 0.7,
		marginTop: "16px",
		textAlign: "center",
	},
	infoBar: {
		display: "flex",
		justifyContent: "space-around",
		gap: "16px",
		marginTop: "20px",
		padding: "16px",
		background: "rgba(255,255,255,0.05)",
		borderRadius: "12px",
	},
	infoItem: {
		display: "flex",
		alignItems: "center",
		gap: "8px",
	},
	infoIcon: {
		fontSize: "18px",
	},
	infoText: {
		fontSize: "13px",
		opacity: 0.8,
	},
};

export default FocusScore;
