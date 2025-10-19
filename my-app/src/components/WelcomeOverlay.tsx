import { useState } from "react";

interface WelcomeOverlayProps {
	onDismiss: () => void;
}

const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ onDismiss }) => {
	const [currentSlide, setCurrentSlide] = useState(0);

	const slides = [
		{
			icon: "🎯",
			title: "Welcome to FocusAI",
			description:
				"Your intelligent productivity companion that helps you stay focused and grow your digital garden.",
			features: [
				"Smart activity tracking every 3 minutes",
				"AI-powered context understanding",
				"Beautiful garden visualization",
			],
		},
		{
			icon: "📊",
			title: "How It Works",
			description: "FocusAI monitors your activity and calculates a focus score based on:",
			features: [
				"Keyboard activity (35%)",
				"Focus consistency - fewer app switches (40%)",
				"Active time vs idle time (25%)",
			],
		},
		{
			icon: "🤖",
			title: "AI Enhancement",
			description: "Optional AI features understand context to refine your score:",
			features: [
				"Detects productive vs distracting activity",
				"Aligns activity with your goals",
				"Generates personalized summaries every 30 min",
			],
		},
		{
			icon: "🌱",
			title: "Grow Your Garden",
			description: "Your focus garden evolves through 7 beautiful stages:",
			features: [
				"Soil 🟤 → Seed 🌰 → Sprout 🌱",
				"Seedling 🌿 → Growing 🪴 → Blooming 🌻",
				"Flourishing 🌺✨ (with consistent work!)",
			],
		},
		{
			icon: "🚀",
			title: "Ready to Begin?",
			description: "Here's what happens next:",
			features: [
				"Set your focus goal",
				"Start working on your task",
				"Watch your scores and garden update automatically!",
			],
		},
	];

	const currentSlideData = slides[currentSlide];
	const isLastSlide = currentSlide === slides.length - 1;

	const handleNext = () => {
		if (isLastSlide) {
			onDismiss();
		} else {
			setCurrentSlide((prev) => prev + 1);
		}
	};

	const handlePrev = () => {
		if (currentSlide > 0) {
			setCurrentSlide((prev) => prev - 1);
		}
	};

	return (
		<div style={styles.overlay}>
			<div style={styles.modal}>
				<button style={styles.skipButton} onClick={onDismiss}>
					Skip Tutorial ✕
				</button>

				<div style={styles.content}>
					<div style={styles.icon}>{currentSlideData.icon}</div>
					<h2 style={styles.title}>{currentSlideData.title}</h2>
					<p style={styles.description}>{currentSlideData.description}</p>

					<div style={styles.featuresList}>
						{currentSlideData.features.map((feature, index) => (
							<div key={index} style={styles.featureItem}>
								<span style={styles.featureBullet}>✓</span>
								<span style={styles.featureText}>{feature}</span>
							</div>
						))}
					</div>

					<div style={styles.navigation}>
						<button
							style={{
								...styles.navButton,
								...(currentSlide === 0 ? styles.navButtonDisabled : {}),
							}}
							onClick={handlePrev}
							disabled={currentSlide === 0}
						>
							← Previous
						</button>

						<div style={styles.dots}>
							{slides.map((_, index) => (
								<div
									key={index}
									style={{
										...styles.dot,
										...(index === currentSlide ? styles.dotActive : {}),
									}}
									onClick={() => setCurrentSlide(index)}
								/>
							))}
						</div>

						<button style={styles.primaryButton} onClick={handleNext}>
							{isLastSlide ? "Let's Go! 🚀" : "Next →"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

const styles: Record<string, React.CSSProperties> = {
	overlay: {
		position: "fixed",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		background: "rgba(0,0,0,0.85)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 9999,
		backdropFilter: "blur(8px)",
		animation: "fadeIn 0.3s ease-in",
	},
	modal: {
		position: "relative",
		background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
		borderRadius: "24px",
		maxWidth: "600px",
		width: "90%",
		padding: "48px",
		boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
		border: "1px solid rgba(102, 126, 234, 0.3)",
	},
	skipButton: {
		position: "absolute",
		top: "16px",
		right: "16px",
		background: "none",
		border: "none",
		color: "rgba(255,255,255,0.6)",
		fontSize: "14px",
		cursor: "pointer",
		padding: "8px 12px",
		borderRadius: "8px",
		transition: "all 0.2s",
	},
	content: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		textAlign: "center",
	},
	icon: {
		fontSize: "80px",
		marginBottom: "24px",
		animation: "bounce 1s ease-in-out infinite",
	},
	title: {
		fontSize: "32px",
		fontWeight: "bold",
		color: "white",
		margin: "0 0 16px 0",
		background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
		WebkitBackgroundClip: "text",
		WebkitTextFillColor: "transparent",
		backgroundClip: "text",
	},
	description: {
		fontSize: "16px",
		color: "rgba(255,255,255,0.8)",
		lineHeight: "1.6",
		marginBottom: "32px",
		maxWidth: "500px",
	},
	featuresList: {
		display: "flex",
		flexDirection: "column",
		gap: "16px",
		width: "100%",
		marginBottom: "40px",
	},
	featureItem: {
		display: "flex",
		alignItems: "center",
		gap: "12px",
		padding: "16px",
		background: "rgba(102, 126, 234, 0.1)",
		borderRadius: "12px",
		border: "1px solid rgba(102, 126, 234, 0.2)",
		textAlign: "left",
	},
	featureBullet: {
		fontSize: "20px",
		color: "#10b981",
		fontWeight: "bold",
		flexShrink: 0,
	},
	featureText: {
		fontSize: "15px",
		color: "rgba(255,255,255,0.9)",
		lineHeight: "1.5",
	},
	navigation: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		width: "100%",
		gap: "16px",
	},
	navButton: {
		padding: "12px 24px",
		borderRadius: "12px",
		border: "2px solid rgba(255,255,255,0.2)",
		background: "rgba(255,255,255,0.05)",
		color: "white",
		fontSize: "15px",
		fontWeight: "600",
		cursor: "pointer",
		transition: "all 0.2s",
	},
	navButtonDisabled: {
		opacity: 0.3,
		cursor: "not-allowed",
	},
	primaryButton: {
		padding: "12px 28px",
		borderRadius: "12px",
		border: "none",
		background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
		color: "white",
		fontSize: "15px",
		fontWeight: "bold",
		cursor: "pointer",
		transition: "all 0.2s",
		boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
	},
	dots: {
		display: "flex",
		gap: "8px",
		flex: 1,
		justifyContent: "center",
	},
	dot: {
		width: "10px",
		height: "10px",
		borderRadius: "50%",
		background: "rgba(255,255,255,0.3)",
		cursor: "pointer",
		transition: "all 0.2s",
	},
	dotActive: {
		background: "#667eea",
		width: "28px",
		borderRadius: "5px",
	},
};

export default WelcomeOverlay;
