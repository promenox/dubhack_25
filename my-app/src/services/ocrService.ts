import Tesseract from "tesseract.js";

export type OCRProgress = {
	status: string;
	progress: number; // 0..1
};

export type OCRResult = {
	text: string;
	confidence: number;
};

/**
 * Run OCR on an image/file/blob/url using Tesseract.js with progress reporting.
 * If you want to self-host language files, place them under `/public/tessdata` and
 * pass languagesPath = "/tessdata".
 */
export async function runOCR(
	image: File | Blob | string,
	language: string = "eng",
	onProgress?: (progress: OCRProgress) => void,
	languagesPath?: string
): Promise<OCRResult> {
	const options: Record<string, unknown> = {
		logger: (message: any) => {
			if (onProgress) {
				const status: string = message?.status ?? "working";
				const progress: number = typeof message?.progress === "number" ? message.progress : 0;
				onProgress({ status, progress });
			}
		},
	};

	// Self-host traineddata if languagesPath provided
	if (languagesPath) {
		(options as any).langPath = languagesPath; // Tesseract.js recognizes langPath
	}

	const result = await (Tesseract as any).recognize(image, language, options);
	const text: string = result?.data?.text ?? "";
	const confidence: number = typeof result?.data?.confidence === "number" ? result.data.confidence : 0;

	return { text, confidence };
}
