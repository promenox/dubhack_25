import { Collection, Db, MongoClient, ServerApiVersion } from "mongodb";

// MongoDB connection configuration

const uri = "mongodb+srv://test123:test123@focalai.t1ld1i3.mongodb.net/?retryWrites=true&w=majority&appName=FocalAI";
const dbName = "focalai";
const collectionName = "user_scores";

interface UserScore {
	userId: string;
	score: number;
	timestamp: number;
	lastUpdated: number;
	username?: string;
	email?: string;
}

export class DatabaseService {
	private authToken: string | null = null;
	private client: MongoClient;
	private db: Db | null = null;
	private scoresCollection: Collection<UserScore> | null = null;
	private connected: boolean = false;
	private connectionFailed: boolean = false;
	private lastConnectionAttempt: number = 0;
	private readonly CONNECTION_RETRY_INTERVAL = 60000; // 1 minute

	constructor() {
		// Create a MongoClient with a MongoClientOptions object to set the Stable API version
		this.client = new MongoClient(uri, {
			serverApi: {
				version: ServerApiVersion.v1,
				strict: true,
				deprecationErrors: true,
			},
			connectTimeoutMS: 5000, // 5 second timeout
			serverSelectionTimeoutMS: 5000, // 5 second timeout
		});
	}

	/**
	 * Upsert basic user profile details (username/email) for a given userId
	 */
	async saveUserProfile(userId: string, username: string, email: string): Promise<void> {
		await this.connect();

		if (!this.scoresCollection) {
			throw new Error("Database not initialized");
		}

		const timestamp = Date.now();

		try {
			await this.scoresCollection.updateOne(
				{ userId },
				{
					$set: {
						username,
						email,
						lastUpdated: timestamp,
					},
					$setOnInsert: {
						// Ensure a starting score exists when first creating the document
						score: 0,
						timestamp,
					},
				},
				{ upsert: true }
			);

			console.log(`✅ User profile saved for ${userId.substring(0, 10)}... (${username}, ${email})`);
		} catch (error: any) {
			console.error("❌ Failed to save user profile:", error.message);
			throw new Error(`Failed to save user profile: ${error.message}`);
		}
	}

	/**
	 * Check if database is available
	 */
	isAvailable(): boolean {
		return this.connected && !this.connectionFailed;
	}

	/**
	 * Connect to MongoDB
	 */
	private async connect(): Promise<void> {
		if (this.connected) {
			return;
		}

		// Don't retry too frequently
		const now = Date.now();
		if (this.connectionFailed && now - this.lastConnectionAttempt < this.CONNECTION_RETRY_INTERVAL) {
			throw new Error("Database unavailable. Please check your MongoDB connection and credentials in .env file.");
		}

		this.lastConnectionAttempt = now;

		try {
			console.log("🔌 Attempting to connect to MongoDB...");
			await this.client.connect();
			this.db = this.client.db(dbName);
			this.scoresCollection = this.db.collection<UserScore>(collectionName);

			// Create index on userId for faster queries
			await this.scoresCollection.createIndex({ userId: 1 }, { unique: true });

			this.connected = true;
			this.connectionFailed = false;
			console.log("✅ Successfully connected to MongoDB!");
		} catch (error: any) {
			this.connectionFailed = true;
			console.error("❌ Failed to connect to MongoDB:", error.message);

			if (error.message.includes("TLSV1_ALERT") || error.message.includes("SSL")) {
				console.error("🔐 SSL/TLS Error: This usually means invalid MongoDB credentials.");
				console.error("📝 Please create a .env file in the 'focal' directory with valid MONGODB_URI");
				console.error("📖 See MONGODB_SETUP.md for setup instructions");
			}

			throw new Error(`MongoDB connection failed: ${error.message}`);
		}
	}

	/**
	 * Set the auth token for database operations
	 */
	setAuthToken(token: string) {
		this.authToken = token;
		console.log("🔑 Database service: Token stored successfully");
		console.log("🔑 Database service: Token preview:", token ? token.substring(0, 30) + "..." : "null");
	}

	/**
	 * Get user token from stored credentials
	 */
	getAuthToken(): string | null {
		return this.authToken;
	}

	/**
	 * Get user ID from auth token (simplified - you may want to decode JWT)
	 */
	private getUserId(): string {
		if (!this.authToken) {
			throw new Error("Authentication token not available");
		}
		// For now, use the token as user ID. In production, decode JWT to get user ID
		return this.authToken;
	}

	/**
	 * Set the user's score (overwrite existing score)
	 */
	async setScore(score: number): Promise<void> {
		await this.connect();

		if (!this.scoresCollection) {
			throw new Error("Database not initialized");
		}

		const userId = this.getUserId();
		const timestamp = Date.now();

		try {
			await this.scoresCollection.updateOne(
				{ userId },
				{
					$set: {
						score,
						lastUpdated: timestamp,
					},
					$setOnInsert: {
						timestamp,
					},
				},
				{ upsert: true }
			);

			console.log(`✅ Score set successfully for user ${userId.substring(0, 10)}...: ${score}`);
		} catch (error: any) {
			console.error("❌ Failed to set score:", error.message);
			throw new Error(`Failed to set score: ${error.message}`);
		}
	}

	/**
	 * Get the user's score
	 */
	async getScore(): Promise<number> {
		await this.connect();

		if (!this.scoresCollection) {
			throw new Error("Database not initialized");
		}

		const userId = this.getUserId();

		try {
			const result = await this.scoresCollection.findOne({ userId });

			if (!result) {
				console.log(`ℹ️ No score found for user ${userId.substring(0, 10)}..., returning 0`);
				return 0;
			}

			console.log(`✅ Score fetched successfully for user ${userId.substring(0, 10)}...: ${result.score}`);
			return result.score;
		} catch (error: any) {
			console.error("❌ Failed to get score:", error.message);
			throw new Error(`Failed to get score: ${error.message}`);
		}
	}

	/**
	 * Save a score to the database (alias for setScore for backward compatibility)
	 */
	async saveScore(score: number): Promise<void> {
		return this.setScore(score);
	}

	/**
	 * Fetch user score from the database (alias for getScore for backward compatibility)
	 */
	async fetchScore(): Promise<number> {
		return this.getScore();
	}

	/**
	 * Update score by adding to existing score
	 */
	async updateScore(additionalScore: number): Promise<void> {
		await this.connect();

		if (!this.scoresCollection) {
			throw new Error("Database not initialized");
		}

		const userId = this.getUserId();

		try {
			const result = await this.scoresCollection.findOneAndUpdate(
				{ userId },
				{
					$inc: { score: additionalScore },
					$set: { lastUpdated: Date.now() },
					$setOnInsert: { timestamp: Date.now() },
				},
				{
					upsert: true,
					returnDocument: "after",
				}
			);

			console.log(
				`✅ Score updated successfully for user ${userId.substring(
					0,
					10
				)}...: +${additionalScore} (new total: ${result?.score || additionalScore})`
			);
		} catch (error: any) {
			console.error("❌ Failed to update score:", error.message);
			throw new Error(`Failed to update score: ${error.message}`);
		}
	}

	/**
	 * Fetch all users' scores for leaderboard display
	 */
	async getAllScores(): Promise<Array<{ userId: string; score: number; username?: string }>> {
		await this.connect();

		if (!this.scoresCollection) {
			throw new Error("Database not initialized");
		}

		try {
			const cursor = this.scoresCollection
				.find({}, { projection: { _id: 0, userId: 1, score: 1, username: 1 } })
				.sort({ score: -1 });
			const results = await cursor.toArray();
			return results.map((doc) => ({ userId: doc.userId, score: doc.score, username: doc.username }));
		} catch (error: any) {
			console.error("❌ Failed to fetch all scores:", error.message);
			throw new Error(`Failed to fetch all scores: ${error.message}`);
		}
	}

	/**
	 * Close the database connection
	 */
	async close(): Promise<void> {
		if (this.connected) {
			await this.client.close();
			this.connected = false;
			console.log("✅ MongoDB connection closed");
		}
	}
}

// Export singleton instance
export const databaseService = new DatabaseService();
