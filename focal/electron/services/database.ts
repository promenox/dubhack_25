import { Collection, Db, MongoClient, ServerApiVersion } from "mongodb";

// MongoDB connection configuration
// To set up: Create a .env file in the focal directory with:
// MONGODB_URI=mongodb+srv://test:<db_password>@focalai.t1ld1i3.mongodb.net/?retryWrites=true&w=majority&appName=FocalAI
// MONGODB_DB_NAME=focalai
// MONGODB_COLLECTION=user_scores
const uri =
	process.env.MONGODB_URI ||
	"mongodb+srv://test:test@focalai.t1ld1i3.mongodb.net/?retryWrites=true&w=majority&appName=FocalAI";
const dbName = process.env.MONGODB_DB_NAME || "focalai";
const collectionName = process.env.MONGODB_COLLECTION || "user_scores";

interface UserScore {
	userId: string;
	score: number;
	timestamp: number;
	lastUpdated: number;
}

export class DatabaseService {
	private authToken: string | null = null;
	private client: MongoClient;
	private db: Db | null = null;
	private scoresCollection: Collection<UserScore> | null = null;
	private connected: boolean = false;

	constructor() {
		// Create a MongoClient with a MongoClientOptions object to set the Stable API version
		this.client = new MongoClient(uri, {
			serverApi: {
				version: ServerApiVersion.v1,
				strict: true,
				deprecationErrors: true,
			},
		});
	}

	/**
	 * Connect to MongoDB
	 */
	private async connect(): Promise<void> {
		if (this.connected) {
			return;
		}

		try {
			await this.client.connect();
			this.db = this.client.db(dbName);
			this.scoresCollection = this.db.collection<UserScore>(collectionName);

			// Create index on userId for faster queries
			await this.scoresCollection.createIndex({ userId: 1 }, { unique: true });

			this.connected = true;
			console.log("✅ Successfully connected to MongoDB!");
		} catch (error) {
			console.error("❌ Failed to connect to MongoDB:", error);
			throw error;
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
