/**
 * Settings Component
 *
 * Privacy controls, telemetry settings, and data management.
 */

import React, { useState } from "react";
import { useProductivity } from "../context/ProductivityContext";

const styles = {
	container: {
		padding: "2rem",
		maxWidth: "800px",
		margin: "0 auto",
	},
	header: {
		marginBottom: "2rem",
	},
	title: {
		fontSize: "2rem",
		fontWeight: "bold" as const,
		color: "#fff",
		marginBottom: "0.5rem",
	},
	subtitle: {
		fontSize: "1rem",
		color: "#999",
	},
	section: {
		backgroundColor: "#1e1e1e",
		borderRadius: "12px",
		padding: "1.5rem",
		marginBottom: "1.5rem",
	},
	sectionTitle: {
		fontSize: "1.25rem",
		fontWeight: "bold" as const,
		color: "#fff",
		marginBottom: "1rem",
	},
	settingRow: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		padding: "1rem 0",
		borderBottom: "1px solid #333",
	},
	settingInfo: {
		flex: 1,
	},
	settingLabel: {
		fontSize: "1rem",
		fontWeight: "bold" as const,
		color: "#fff",
		marginBottom: "0.25rem",
	},
	settingDescription: {
		fontSize: "0.875rem",
		color: "#999",
	},
	toggle: {
		position: "relative" as const,
		width: "50px",
		height: "26px",
		backgroundColor: "#374151",
		borderRadius: "13px",
		cursor: "pointer",
		transition: "background-color 0.2s",
	},
	toggleActive: {
		backgroundColor: "#3b82f6",
	},
	toggleKnob: {
		position: "absolute" as const,
		top: "3px",
		left: "3px",
		width: "20px",
		height: "20px",
		backgroundColor: "#fff",
		borderRadius: "50%",
		transition: "transform 0.2s",
	},
	toggleKnobActive: {
		transform: "translateX(24px)",
	},
	input: {
		width: "80px",
		padding: "0.5rem",
		backgroundColor: "#2a2a2a",
		border: "1px solid #444",
		borderRadius: "6px",
		fontSize: "1rem",
		color: "#fff",
		textAlign: "center" as const,
	},
	dangerZone: {
		backgroundColor: "#7f1d1d",
		border: "1px solid #991b1b",
	},
	button: {
		padding: "0.75rem 1.5rem",
		border: "none",
		borderRadius: "8px",
		fontSize: "1rem",
		cursor: "pointer",
		fontWeight: "bold" as const,
		transition: "opacity 0.2s",
	},
	primaryButton: {
		backgroundColor: "#3b82f6",
		color: "#fff",
	},
	dangerButton: {
		backgroundColor: "#dc2626",
		color: "#fff",
	},
	buttonGroup: {
		display: "flex",
		gap: "1rem",
		marginTop: "1rem",
	},
	privacyNote: {
		backgroundColor: "#1e3a8a",
		border: "1px solid #1e40af",
		borderRadius: "8px",
		padding: "1rem",
		marginTop: "1rem",
	},
	privacyText: {
		fontSize: "0.875rem",
		color: "#93c5fd",
		lineHeight: 1.6,
	},
};

const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => {
	return (
		<div
			style={{
				...styles.toggle,
				...(checked ? styles.toggleActive : {}),
			}}
			onClick={() => onChange(!checked)}
		>
			<div
				style={{
					...styles.toggleKnob,
					...(checked ? styles.toggleKnobActive : {}),
				}}
			/>
		</div>
	);
};

export const Settings: React.FC = () => {
	const { settings, updateSettings, toggleOverlay, exportData, deleteData } = useProductivity();
	const [isExporting, setIsExporting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	if (!settings) {
		return (
			<div style={styles.container}>
				<div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>Loading settings...</div>
			</div>
		);
	}

	const handleExportData = async () => {
		setIsExporting(true);
		try {
			const data = await exportData();

			// Create download link
			const blob = new Blob([data], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `productivity-data-${new Date().toISOString().split("T")[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			alert("Data exported successfully!");
		} catch (error) {
			console.error("Export failed:", error);
			alert("Failed to export data");
		} finally {
			setIsExporting(false);
		}
	};

	const handleDeleteData = async () => {
		if (!confirm("Are you sure you want to delete ALL your data? This cannot be undone.")) {
			return;
		}

		setIsDeleting(true);
		try {
			await deleteData();
			alert("All data deleted successfully");
		} catch (error) {
			console.error("Delete failed:", error);
			alert("Failed to delete data");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div style={styles.container}>
			<div style={styles.header}>
				<h1 style={styles.title}>Settings</h1>
				<p style={styles.subtitle}>Configure tracking and privacy options</p>
			</div>

			{/* Telemetry Settings */}
			<div style={styles.section}>
				<h2 style={styles.sectionTitle}>Telemetry</h2>

				<div style={styles.settingRow}>
					<div style={styles.settingInfo}>
						<div style={styles.settingLabel}>Screen Capture & OCR</div>
						<div style={styles.settingDescription}>
							Capture screen periodically to detect focused content
						</div>
					</div>
					<Toggle
						checked={settings.telemetry.screenCapture}
						onChange={(checked) =>
							updateSettings({ telemetry: { ...settings.telemetry, screenCapture: checked } })
						}
					/>
				</div>

				<div style={styles.settingRow}>
					<div style={styles.settingInfo}>
						<div style={styles.settingLabel}>Window Tracking</div>
						<div style={styles.settingDescription}>Track active window titles and applications</div>
					</div>
					<Toggle
						checked={settings.telemetry.windowTracking}
						onChange={(checked) =>
							updateSettings({ telemetry: { ...settings.telemetry, windowTracking: checked } })
						}
					/>
				</div>

				<div style={styles.settingRow}>
					<div style={styles.settingInfo}>
						<div style={styles.settingLabel}>Input Tracking</div>
						<div style={styles.settingDescription}>
							Track keyboard and mouse activity (counts only, no content)
						</div>
					</div>
					<Toggle
						checked={settings.telemetry.inputTracking}
						onChange={(checked) =>
							updateSettings({ telemetry: { ...settings.telemetry, inputTracking: checked } })
						}
					/>
				</div>

				<div style={{ ...styles.settingRow, borderBottom: "none" }}>
					<div style={styles.settingInfo}>
						<div style={styles.settingLabel}>OCR Interval</div>
						<div style={styles.settingDescription}>How often to capture screen (seconds)</div>
					</div>
					<input
						style={styles.input}
						type="number"
						min="10"
						max="300"
						value={settings.telemetry.ocrInterval}
						onChange={(e) =>
							updateSettings({
								telemetry: { ...settings.telemetry, ocrInterval: Number(e.target.value) },
							})
						}
					/>
				</div>
			</div>

			{/* Overlay Settings */}
			<div style={styles.section}>
				<h2 style={styles.sectionTitle}>Garden Overlay</h2>

				<div style={styles.settingRow}>
					<div style={styles.settingInfo}>
						<div style={styles.settingLabel}>Show Overlay</div>
						<div style={styles.settingDescription}>Display the garden overlay on your desktop</div>
					</div>
					<Toggle checked={settings.overlay.enabled} onChange={(checked) => toggleOverlay(checked)} />
				</div>

				<div style={styles.settingRow}>
					<div style={styles.settingInfo}>
						<div style={styles.settingLabel}>Opacity</div>
						<div style={styles.settingDescription}>Overlay transparency (0-100%)</div>
					</div>
					<input
						style={styles.input}
						type="number"
						min="10"
						max="100"
						value={Math.round(settings.overlay.opacity * 100)}
						onChange={(e) =>
							updateSettings({ overlay: { ...settings.overlay, opacity: Number(e.target.value) / 100 } })
						}
					/>
				</div>

				<div style={{ ...styles.settingRow, borderBottom: "none" }}>
					<div style={styles.settingInfo}>
						<div style={styles.settingLabel}>Size</div>
						<div style={styles.settingDescription}>Overlay window size</div>
					</div>
					<select
						style={{ ...styles.input, width: "auto" }}
						value={settings.overlay.size}
						onChange={(e) =>
							updateSettings({ overlay: { ...settings.overlay, size: e.target.value as any } })
						}
					>
						<option value="small">Small</option>
						<option value="medium">Medium</option>
						<option value="large">Large</option>
					</select>
				</div>
			</div>

			{/* Privacy Settings */}
			<div style={styles.section}>
				<h2 style={styles.sectionTitle}>Privacy</h2>

				<div style={{ ...styles.settingRow, borderBottom: "none" }}>
					<div style={styles.settingInfo}>
						<div style={styles.settingLabel}>Data Retention</div>
						<div style={styles.settingDescription}>Automatically delete data older than (days)</div>
					</div>
					<input
						style={styles.input}
						type="number"
						min="1"
						max="365"
						value={settings.privacy.storageRetentionDays}
						onChange={(e) =>
							updateSettings({
								privacy: { ...settings.privacy, storageRetentionDays: Number(e.target.value) },
							})
						}
					/>
				</div>

				<div style={styles.privacyNote}>
					<div style={styles.privacyText}>
						<strong>Privacy Note:</strong> All data is stored locally on your device. No information is
						transmitted to external servers. You can export or delete your data at any time using the
						buttons below.
					</div>
				</div>
			</div>

			{/* Data Management */}
			<div style={{ ...styles.section, ...styles.dangerZone }}>
				<h2 style={styles.sectionTitle}>Data Management</h2>

				<div style={{ color: "#fca5a5", fontSize: "0.875rem", marginBottom: "1rem" }}>
					Export your data for backup or review, or permanently delete all stored data.
				</div>

				<div style={styles.buttonGroup}>
					<button
						style={{ ...styles.button, ...styles.primaryButton }}
						onClick={handleExportData}
						disabled={isExporting}
						onMouseEnter={(e) => {
							if (!isExporting) e.currentTarget.style.opacity = "0.8";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.opacity = "1";
						}}
					>
						{isExporting ? "Exporting..." : "Export Data"}
					</button>

					<button
						style={{ ...styles.button, ...styles.dangerButton }}
						onClick={handleDeleteData}
						disabled={isDeleting}
						onMouseEnter={(e) => {
							if (!isDeleting) e.currentTarget.style.opacity = "0.8";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.opacity = "1";
						}}
					>
						{isDeleting ? "Deleting..." : "Delete All Data"}
					</button>
				</div>
			</div>
		</div>
	);
};
