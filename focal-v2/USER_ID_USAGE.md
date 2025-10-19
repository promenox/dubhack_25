# Using User ID (UUID) in Your App

AWS Cognito automatically assigns each user a permanent UUID called the "sub" (subject). This is now available through the auth service.

## Getting the User ID

### Option 1: Get just the UUID

```typescript
import authService from "./services/auth";

// Get just the user ID
const userId = await authService.getUserId();
console.log(userId); // Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### Option 2: Get full user info (including UUID)

```typescript
import authService from "./services/auth";

// Get all user attributes
const user = await authService.getUserAttributes();
console.log(user.userId); // UUID: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
console.log(user.username); // Username: "john_doe"
console.log(user.email); // Email: "john@example.com"
```

## Example Usage in Components

### 1. In Dashboard Component

```typescript
import { useEffect, useState } from "react";
import authService from "../services/auth";

const Dashboard = () => {
	const [userId, setUserId] = useState<string | null>(null);
	const [userInfo, setUserInfo] = useState<any>(null);

	useEffect(() => {
		// Load user info on component mount
		const loadUser = async () => {
			try {
				const user = await authService.getUserAttributes();
				setUserId(user.userId);
				setUserInfo(user);

				// Now you can use userId for API calls, database queries, etc.
				console.log("Current user UUID:", user.userId);
			} catch (error) {
				console.error("Failed to load user:", error);
			}
		};

		loadUser();
	}, []);

	return (
		<div>
			<h1>Welcome, {userInfo?.username}!</h1>
			<p>Your user ID: {userId}</p>
		</div>
	);
};
```

### 2. For API Calls

```typescript
// Fetch user-specific data from your backend
const fetchUserData = async () => {
	const userId = await authService.getUserId();

	const response = await fetch(`/api/users/${userId}/data`, {
		headers: {
			Authorization: `Bearer ${tokens.accessToken}`,
		},
	});

	return response.json();
};
```

### 3. For Tracking Focus Sessions

```typescript
// Save focus session to database with user ID
const saveFocusSession = async (sessionData: any) => {
	const userId = await authService.getUserId();

	await fetch("/api/sessions", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			userId: userId, // Link session to user
			...sessionData,
		}),
	});
};
```

## Important Notes

### ✅ Use `userId` (UUID) for:

-   **Database relationships** - Primary key or foreign key
-   **API endpoints** - `/api/users/{userId}/sessions`
-   **File storage** - `s3://bucket/users/{userId}/files`
-   **Analytics** - Track user behavior
-   **Permissions** - Check if user owns a resource

### ❌ Don't use `username` for:

-   Database primary keys (usernames can change)
-   Permanent identifiers
-   Security-critical operations

### Why UUID is Better:

1. **Immutable** - Never changes, even if username/email changes
2. **Unique** - Guaranteed unique across your entire system
3. **Secure** - Can't be guessed or enumerated
4. **Standard** - Works with any backend database

## Caching User Info

To avoid repeated API calls, you can cache the user info:

```typescript
let cachedUser: AuthUser | null = null;

export const getCachedUser = async (): Promise<AuthUser> => {
	if (!cachedUser) {
		cachedUser = await authService.getUserAttributes();
	}
	return cachedUser;
};

export const clearUserCache = () => {
	cachedUser = null;
};
```

## Using with Context (Recommended for React)

Create a user context to make userId available globally:

```typescript
// src/contexts/UserContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import authService, { AuthUser } from "../services/auth";

interface UserContextType {
	user: AuthUser | null;
	userId: string | null;
	loading: boolean;
}

const UserContext = createContext<UserContextType>({
	user: null,
	userId: null,
	loading: true,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadUser = async () => {
			try {
				const userData = await authService.getUserAttributes();
				setUser(userData);
			} catch (error) {
				console.error("Failed to load user:", error);
			} finally {
				setLoading(false);
			}
		};

		loadUser();
	}, []);

	return (
		<UserContext.Provider value={{ user, userId: user?.userId || null, loading }}>{children}</UserContext.Provider>
	);
};

export const useUser = () => useContext(UserContext);
```

Then use it anywhere:

```typescript
const MyComponent = () => {
	const { userId, user, loading } = useUser();

	if (loading) return <div>Loading...</div>;

	return <div>User ID: {userId}</div>;
};
```
