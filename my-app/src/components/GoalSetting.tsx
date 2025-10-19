import { useState } from "react";
import { UserGoal } from "../types";

interface GoalSettingProps {
	currentGoal: UserGoal | null;
	onSaveGoal: (goal: UserGoal) => void;
}

const GoalSetting: React.FC<GoalSettingProps> = ({ currentGoal, onSaveGoal }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [goalText, setGoalText] = useState(currentGoal?.title || "");
	const [category, setCategory] = useState<"work" | "study" | "creative" | "other">(currentGoal?.category || "work");

	const handleSave = () => {
		if (!goalText.trim()) return;

		const goal: UserGoal = {
			id: currentGoal?.id || Date.now().toString(),
			title: goalText.trim(),
			category,
			active: true,
			createdAt: currentGoal?.createdAt || Date.now(),
		};

		onSaveGoal(goal);
		setIsEditing(false);
	};

	const handleCancel = () => {
		setGoalText(currentGoal?.title || "");
		setCategory(currentGoal?.category || "work");
		setIsEditing(false);
	};

	if (!isEditing && !currentGoal) {
		return (
			<div style={styles.container}>
				<div style={styles.emptyState}>
					<span style={styles.emptyIcon}>🎯</span>
					<h3 style={styles.emptyTitle}>Set Your Focus Goal</h3>
					<p style={styles.emptyText}>
						Define what you want to accomplish. FocusAI will help you stay on track.
					</p>
					<button style={styles.primaryButton} onClick={() => setIsEditing(true)}>
						Create Goal
					</button>
				</div>
			</div>
		);
	}

	if (isEditing) {
		return (
			<div style={styles.container}>
				<h3 style={styles.title}>{currentGoal ? "Edit Goal" : "Set Your Goal"}</h3>

				<div style={styles.form}>
					<div style={styles.formGroup}>
						<label style={styles.label}>What are you working on?</label>
						<input
							type="text"
							value={goalText}
							onChange={(e) => setGoalText(e.target.value)}
							placeholder="e.g., Complete project proposal, Learn React, Write article..."
							style={styles.input}
							autoFocus
						/>
					</div>

					<div style={styles.formGroup}>
						<label style={styles.label}>Category</label>
						<div style={styles.categoryGrid}>
							{(["work", "study", "creative", "other"] as const).map((cat) => (
								<button
									key={cat}
									style={{
										...styles.categoryButton,
										...(category === cat ? styles.categoryButtonActive : {}),
									}}
									onClick={() => setCategory(cat)}
								>
									{getCategoryIcon(cat)} {cat}
								</button>
							))}
						</div>
					</div>

					<div style={styles.formActions}>
						<button style={styles.secondaryButton} onClick={handleCancel}>
							Cancel
						</button>
						<button style={styles.primaryButton} onClick={handleSave} disabled={!goalText.trim()}>
							Save Goal
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div style={styles.container}>
			<div style={styles.goalDisplay}>
				<div style={styles.goalHeader}>
					<span style={styles.goalIcon}>{getCategoryIcon(currentGoal!.category)}</span>
					<div style={styles.goalInfo}>
						<span style={styles.categoryBadge}>{currentGoal!.category}</span>
						<h3 style={styles.goalTitle}>{currentGoal!.title}</h3>
					</div>
				</div>

				<button style={styles.editButton} onClick={() => setIsEditing(true)}>
					✏️ Edit
				</button>
			</div>
		</div>
	);
};

function getCategoryIcon(category: string): string {
	const icons: Record<string, string> = {
		work: "💼",
		study: "📚",
		creative: "🎨",
		other: "🎯",
	};
	return icons[category] || "🎯";
}

const styles: Record<string, React.CSSProperties> = {
	container: {
		background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
		borderRadius: "20px",
		padding: "24px",
		boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
		color: "white",
	},
	title: {
		fontSize: "20px",
		fontWeight: "bold",
		margin: "0 0 20px 0",
	},
	emptyState: {
		textAlign: "center",
		padding: "20px",
	},
	emptyIcon: {
		fontSize: "48px",
		display: "block",
		marginBottom: "16px",
	},
	emptyTitle: {
		fontSize: "20px",
		fontWeight: "bold",
		margin: "0 0 12px 0",
	},
	emptyText: {
		fontSize: "14px",
		opacity: 0.9,
		lineHeight: "1.6",
		marginBottom: "24px",
	},
	form: {
		display: "flex",
		flexDirection: "column",
		gap: "20px",
	},
	formGroup: {
		display: "flex",
		flexDirection: "column",
		gap: "8px",
	},
	label: {
		fontSize: "14px",
		fontWeight: "600",
		opacity: 0.9,
	},
	input: {
		padding: "12px 16px",
		borderRadius: "12px",
		border: "none",
		fontSize: "15px",
		background: "rgba(255,255,255,0.9)",
		color: "#1a1a1a",
		outline: "none",
	},
	categoryGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(2, 1fr)",
		gap: "12px",
	},
	categoryButton: {
		padding: "12px",
		borderRadius: "12px",
		border: "2px solid rgba(255,255,255,0.3)",
		background: "rgba(255,255,255,0.1)",
		color: "white",
		fontSize: "14px",
		fontWeight: "600",
		cursor: "pointer",
		textTransform: "capitalize",
		transition: "all 0.2s",
	},
	categoryButtonActive: {
		background: "rgba(255,255,255,0.9)",
		color: "#667eea",
		borderColor: "white",
	},
	formActions: {
		display: "flex",
		gap: "12px",
		justifyContent: "flex-end",
		marginTop: "8px",
	},
	primaryButton: {
		padding: "12px 24px",
		borderRadius: "12px",
		border: "none",
		background: "rgba(255,255,255,0.9)",
		color: "#667eea",
		fontSize: "15px",
		fontWeight: "bold",
		cursor: "pointer",
		transition: "all 0.2s",
	},
	secondaryButton: {
		padding: "12px 24px",
		borderRadius: "12px",
		border: "2px solid rgba(255,255,255,0.5)",
		background: "transparent",
		color: "white",
		fontSize: "15px",
		fontWeight: "600",
		cursor: "pointer",
		transition: "all 0.2s",
	},
	goalDisplay: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "flex-start",
	},
	goalHeader: {
		display: "flex",
		gap: "16px",
		alignItems: "center",
		flex: 1,
	},
	goalIcon: {
		fontSize: "40px",
	},
	goalInfo: {
		display: "flex",
		flexDirection: "column",
		gap: "8px",
	},
	categoryBadge: {
		display: "inline-block",
		padding: "4px 12px",
		background: "rgba(255,255,255,0.2)",
		borderRadius: "12px",
		fontSize: "12px",
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: "0.5px",
		alignSelf: "flex-start",
	},
	goalTitle: {
		fontSize: "18px",
		fontWeight: "bold",
		margin: 0,
		lineHeight: "1.4",
	},
	editButton: {
		padding: "8px 16px",
		borderRadius: "10px",
		border: "2px solid rgba(255,255,255,0.3)",
		background: "rgba(255,255,255,0.1)",
		color: "white",
		fontSize: "14px",
		cursor: "pointer",
		transition: "all 0.2s",
	},
};

export default GoalSetting;
