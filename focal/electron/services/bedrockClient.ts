import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
	region: "us-east-1", // must match where Bedrock is available in your account
	credentials: {
		accessKeyId: "AKIAT7UQI2L4PPQVMB3X",
		secretAccessKey: "Z4F1k3FFIBe82cWAXNEqY+EWHFelrbVRGaEhkZgD",
	},
});

export async function invoke(prompt: string) {
	const body = {
		prompt: prompt,
		max_tokens: 512,
		temperature: 0.7,
	};

	const command = new InvokeModelCommand({
		modelId: "meta.llama3-1-8b-instruct-v1:0",
		contentType: "application/json",
		accept: "application/json",
		body: JSON.stringify(body),
	});

	const response = await client.send(command);

	if (!response.body) throw new Error("Empty response from Bedrock");

	const json = JSON.parse(new TextDecoder().decode(response.body));

	console.log("✅ Mistral response:", json);
	return json.outputs[0].text;
}

// Example usage:
invoke("Hello! Who are you?").then(console.log).catch(console.error);
