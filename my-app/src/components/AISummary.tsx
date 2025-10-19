import { AISummary as AISummaryType } from "../types";

interface AISummaryProps {
	summary: AISummaryType | null;
	isGenerating?: boolean;
}

const AISummary: React.FC<AISummaryProps> = ({ summary, isGenerating = false }) => {
	if (isGenerating) {
		return (
			<div style={styles.container}>
				<div style={styles.header}>
					<h3 style={styles.title}>AI Insights</h3>
				</div>
				<div style={styles.loadingContainer}>
					<div style={styles.spinner} />
					<p style={styles.loadingText}>Analyzing your focus patterns...</p>
				</div>
			</div>
		);
	}

	if (!summary) {
		return (
			<div style={styles.container}>
				<div style={styles.header}>
					<h3 style={styles.title}>AI Insights</h3>
					<span style={styles.badge}>Next in {30} min</span>
				</div>
				<div style={styles.emptyState}>
					<span style={styles.emptyIcon}>🤖</span>
					<p style={styles.emptyText}>
						Keep working! Your first AI summary will be generated after 30 minutes of activity.
					</p>
				</div>
			</div>
		);
	}

	const avgColor = summary.averageScore >= 75 ? "#10b981" : summary.averageScore >= 50 ? "#f59e0b" : "#ef4444";

	return (
		<div style={styles.container}>
			<div style={styles.header}>
				<h3 style={styles.title}>AI Insights</h3>
				<span style={styles.badge}>{formatTimeAgo(summary.timestamp)}</span>
			</div>

			<div style={styles.statsRow}>
				<div style={styles.statBox}>
					<span style={styles.statLabel}>Period</span>
					<span style={styles.statValue}>{summary.periodMinutes} min</span>
				</div>
				<div style={styles.statBox}>
					<span style={styles.statLabel}>Avg Score</span>
					<span style={{ ...styles.statValue, color: avgColor }}>{Math.round(summary.averageScore)}</span>
				</div>
			</div>

			<div style={styles.section}>
				<div style={styles.sectionHeader}>
					<span style={styles.sectionIcon}>💭</span>
					<span style={styles.sectionTitle}>Feedback</span>
				</div>
				<p style={styles.feedback}>{summary.feedback}</p>
			</div>

			{summary.topActivities.length > 0 && (
				<div style={styles.section}>
					<div style={styles.sectionHeader}>
						<span style={styles.sectionIcon}>📊</span>
						<span style={styles.sectionTitle}>Top Activities</span>
					</div>
					<div style={styles.activitiesList}>
						{summary.topActivities.map((activity, index) => (
							<div key={index} style={styles.activityItem}>
								<span style={styles.activityBullet}>•</span>
								<span style={styles.activityText}>{activity}</span>
							</div>
						))}
					</div>
				</div>
			)}

			{summary.suggestions.length > 0 && (
				<div style={styles.section}>
					<div style={styles.sectionHeader}>
						<span style={styles.sectionIcon}>💡</span>
						<span style={styles.sectionTitle}>Suggestions</span>
					</div>
					<div style={styles.suggestionsList}>
						{summary.suggestions.map((suggestion, index) => (
							<div key={index} style={styles.suggestionItem}>
								<span style={styles.suggestionNumber}>{index + 1}</span>
								<span style={styles.suggestionText}>{suggestion}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

function formatTimeAgo(timestamp: number): string {
	const diff = Date.now() - timestamp;
	const minutes = Math.floor(diff / 60000);

	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;

	const hours = Math.floor(minutes / 60);
	return `${hours}h ago`;
}

const styles: Record<string, React.CSSProperties> = {
	container: {
		background: "#1e293b",
		borderRadius: "20px",
		padding: "24px",
		boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
		color: "white",
	},
	header: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: "20px",
	},
	title: {
		fontSize: "20px",
		fontWeight: "bold",
		margin: 0,
	},
	badge: {
		fontSize: "12px",
		padding: "4px 12px",
		background: "rgba(139, 92, 246, 0.2)",
		borderRadius: "12px",
		color: "#a78bfa",
	},
	statsRow: {
		display: "flex",
		gap: "16px",
		marginBottom: "20px",
	},
	statBox: {
		flex: 1,
		background: "rgba(255,255,255,0.05)",
		borderRadius: "12px",
		padding: "16px",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
	},
	statLabel: {
		fontSize: "12px",
		opacity: 0.7,
		marginBottom: "8px",
	},
	statValue: {
		fontSize: "24px",
		fontWeight: "bold",
	},
	section: {
		marginTop: "20px",
	},
	sectionHeader: {
		display: "flex",
		alignItems: "center",
		gap: "8px",
		marginBottom: "12px",
	},
	sectionIcon: {
		fontSize: "18px",
	},
	sectionTitle: {
		fontSize: "16px",
		fontWeight: "600",
	},
	feedback: {
		fontSize: "15px",
		lineHeight: "1.6",
		opacity: 0.9,
		margin: 0,
		padding: "12px",
		background: "rgba(255,255,255,0.05)",
		borderRadius: "12px",
		borderLeft: "3px solid #8b5cf6",
	},
	activitiesList: {
		display: "flex",
		flexDirection: "column",
		gap: "8px",
	},
	activityItem: {
		display: "flex",
		alignItems: "center",
		gap: "12px",
		padding: "8px 12px",
		background: "rgba(255,255,255,0.05)",
		borderRadius: "8px",
	},
	activityBullet: {
		fontSize: "20px",
		color: "#8b5cf6",
	},
	activityText: {
		fontSize: "14px",
		opacity: 0.9,
	},
	suggestionsList: {
		display: "flex",
		flexDirection: "column",
		gap: "12px",
	},
	suggestionItem: {
		display: "flex",
		gap: "12px",
		padding: "12px",
		background: "rgba(139, 92, 246, 0.1)",
		borderRadius: "12px",
		border: "1px solid rgba(139, 92, 246, 0.3)",
	},
	suggestionNumber: {
		width: "24px",
		height: "24px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		background: "#8b5cf6",
		borderRadius: "50%",
		fontSize: "12px",
		fontWeight: "bold",
		flexShrink: 0,
	},
	suggestionText: {
		fontSize: "14px",
		lineHeight: "1.5",
		opacity: 0.95,
	},
	loadingContainer: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		padding: "40px 20px",
	},
	spinner: {
		width: "40px",
		height: "40px",
		border: "4px solid rgba(139, 92, 246, 0.2)",
		borderTop: "4px solid #8b5cf6",
		borderRadius: "50%",
		animation: "spin 1s linear infinite",
	},
	loadingText: {
		marginTop: "16px",
		fontSize: "14px",
		opacity: 0.7,
	},
	emptyState: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		padding: "40px 20px",
		textAlign: "center",
	},
	emptyIcon: {
		fontSize: "48px",
		marginBottom: "16px",
	},
	emptyText: {
		fontSize: "14px",
		opacity: 0.7,
		lineHeight: "1.6",
		maxWidth: "300px",
	},
};

export default AISummary;
